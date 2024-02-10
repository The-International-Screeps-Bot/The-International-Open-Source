import {
  CreepLogisticsRequestKeys,
  CreepMemoryKeys,
  ReservedCoordTypes,
  Result,
  RoomLogisticsRequestTypes,
  RoomMemoryKeys,
  WorkTypes,
  creepRoles,
  packedCoordLength,
  packedPosLength,
  roomLogisticsRoles,
  storingStructureTypesSet,
} from '../../constants/general'
import { RoomStatsKeys } from '../../constants/stats'
import { CreepRoleManager } from './creepRoleManager'
import { packCoord, unpackCoord, unpackCoordAsPos, unpackPosAt } from 'other/codec'
import { RoomManager } from 'room/room'
import { CollectiveManager } from 'international/collective'
import { creepClasses } from './creepClasses'
import { StatsManager } from 'international/stats'
import { CommuneUtils } from 'room/commune/communeUtils'
import { roomData } from 'room/roomData'
import { RoomObjectUtils } from 'room/roomObjectUtils'
import { RoomUtils } from 'room/roomUtils'
import { FindNewRoomLogisticsRequestArgs, RoomLogisticsRequest, CreepLogisticsRequest } from 'types/roomLogistics'
import { arePositionsEqual, findObjectWithID, getRange, findWithLowestScore } from 'utils/utils'
import { MyCreepUtils } from './myCreepUtils'

export class CreepUtils {
    static expandName(creepName: string) {
        return creepName.split('_')
    }

    static roleName(creepName: string) {
        const expandedName = this.expandName(creepName)
        return creepRoles[parseInt(expandedName[0])]
    }

    static roleCreep(creep: Creep) {
        if (creep._role !== undefined) return creep._role

        return (creep._role = this.roleName(creep.name))
    }

    static customIDName(creepName: string) {
        const expandedName = this.expandName(creepName)
        return parseInt(expandedName[1])
    }

    static findEnergySpentOnConstruction(
        creep: Creep,
        cSite: ConstructionSite,
        workParts: number = MyCreepUtils.parts(creep).work
    ) {
        const energySpent = Math.min(
            workParts * BUILD_POWER,
            // In private servers sometimes progress can be greater than progress total
            Math.max((cSite.progressTotal - cSite.progress) * BUILD_POWER, 0),
            creep.nextStore.energy
        )

        return energySpent
    }
    static findUpgradePosWeak(creep: Creep): RoomPosition | undefined {
        const upgradePos = creep.room.roomManager.upgradePositions.find(
            pos => arePositionsEqual(creep.pos, pos) &&
                !creep.room.roomManager.reservedCoords.has(packCoord(pos))
        )
        return upgradePos
    }
    static findUpgradePosStrong(creep: Creep): RoomPosition | undefined {
        const creepMemory = Memory.creeps[creep.name]
        // use our packed coord if we have one
        if (creepMemory[CreepMemoryKeys.packedCoord]) {
            return unpackCoordAsPos(creepMemory[CreepMemoryKeys.packedCoord], creep.room.name)
        }

        const upgradePos = creep.room.roomManager.upgradePositions.find(pos => {
            const packedCoord = packCoord(pos)

            // Iterate if the pos is used
            if (creep.room.roomManager.reservedCoords.get(packedCoord) > ReservedCoordTypes.dying) {
                return false
            }

            // Otherwise record packedPos in the creep's memory and in usedUpgradeCoords
            creepMemory[CreepMemoryKeys.packedCoord] = packedCoord
            creep.room.roomManager.reservedCoords.set(packedCoord, ReservedCoordTypes.important)

            return pos
        })

        return upgradePos
    }

    static findRoomLogisticsRequest(creep: Creep, args?: FindNewRoomLogisticsRequestArgs) {
        const creepMemory = Memory.creeps[creep.name]
        if (creepMemory[CreepMemoryKeys.roomLogisticsRequests][0]) {
            return creepMemory[CreepMemoryKeys.roomLogisticsRequests][0]
        }

        if (args) creep.noDelivery = args.noDelivery
        else creep.noDelivery = undefined

        const types = this.findRoomLogisticsRequestTypes(creep, args)
        if (types === Result.fail) return Result.fail

        let lowestScore = Infinity
        let bestRequest: RoomLogisticsRequest | 0

        for (const type of types) {
            for (const requestID in creep.room.roomLogisticsRequests[type]) {
                const request = creep.room.roomLogisticsRequests[type][requestID]

                delete request.delivery
                /*
                      // Make a personal amount based on existing amount plus estimated income for distance

                      request.personalAmount =
                          request.amount +
                          (request.income ? getRange(findObjectWithID(request.targetID).pos, creep.pos) * request.income : 0)
           */
                // Customizable conditions
                if (args) {
                    if (args.resourceTypes && !args.resourceTypes.has(request.resourceType)) continue
                    if (args.conditions && !args.conditions(request)) continue
                }

                // Default conditions
                if (!this.canAcceptRoomLogisticsRequest(creep, request.type, request.ID)) continue

                const targetPos = findObjectWithID(request.targetID).pos
                const score = request.priority + getRange(targetPos, creep.pos)

                if (score >= lowestScore) continue

                lowestScore = score
                bestRequest = request
            }
        }
        /*
          log('FINDING REQ', bestRequest + ', ' + Array.from(types), { position: 1 })
       */
        let creepRequest: CreepLogisticsRequest | 0

        if (!bestRequest) {
            creepRequest = this.createBackupStoringStructuresRoomLogisticsRequest(
                creep,
                types,
                args?.resourceTypes
            )

            if (creepRequest === Result.fail) return Result.fail
        }


        // Otherwise we found a request
        else {
            creepRequest = {
                [CreepLogisticsRequestKeys.type]: bestRequest.type,
                [CreepLogisticsRequestKeys.target]: bestRequest.targetID,
                [CreepLogisticsRequestKeys.resourceType]: bestRequest.resourceType,
                [CreepLogisticsRequestKeys.amount]: this.findRoomLogisticRequestAmount(creep, bestRequest),
                [CreepLogisticsRequestKeys.noReserve]: bestRequest.noReserve,
            }

            if (bestRequest.delivery) {
                // creep request will preceed the one we've accepted to provide for the delivery (withdraw task)
                let nextCreepRequest: CreepLogisticsRequest
                const storingStructure = findObjectWithID(bestRequest.delivery as Id<AnyStoreStructure>)

                if (storingStructure) {
                    const amount = Math.min(
                        storingStructure.reserveStore[bestRequest.resourceType],
                        Math.max(
                            RoomObjectUtils.freeNextStoreOf(creep, bestRequest.resourceType),
                            creepRequest[CreepLogisticsRequestKeys.amount]
                        )
                    )

                    nextCreepRequest = {
                        [CreepLogisticsRequestKeys.type]: RoomLogisticsRequestTypes.withdraw,
                        [CreepLogisticsRequestKeys.target]: storingStructure.id,
                        [CreepLogisticsRequestKeys.resourceType]: bestRequest.resourceType,
                        [CreepLogisticsRequestKeys.amount]: amount,
                        [CreepLogisticsRequestKeys.noReserve]: bestRequest.noReserve,
                        [CreepLogisticsRequestKeys.delivery]: true,
                    }

                    storingStructure.reserveStore[nextCreepRequest[CreepLogisticsRequestKeys.resourceType]] -=
                        nextCreepRequest[CreepLogisticsRequestKeys.amount]
                } else {
                    // The delivery provider is based on a request (withdraw)
                    const nextRequest = creep.room.roomLogisticsRequests[RoomLogisticsRequestTypes.withdraw][bestRequest.delivery] ||
                        creep.room.roomLogisticsRequests[RoomLogisticsRequestTypes.offer][bestRequest.delivery] ||
                        creep.room.roomLogisticsRequests[RoomLogisticsRequestTypes.pickup][bestRequest.delivery]

                    const amount = Math.min(
                        nextRequest.amount,
                        Math.max(
                            RoomObjectUtils.freeNextStoreOf(creep, bestRequest.resourceType),
                            creepRequest[CreepLogisticsRequestKeys.amount]
                        )
                    )

                    nextCreepRequest = {
                        [CreepLogisticsRequestKeys.type]: nextRequest.type,
                        [CreepLogisticsRequestKeys.target]: nextRequest.targetID,
                        [CreepLogisticsRequestKeys.resourceType]: nextRequest.resourceType,
                        [CreepLogisticsRequestKeys.amount]: amount,
                        [CreepLogisticsRequestKeys.noReserve]: creepRequest[CreepLogisticsRequestKeys.noReserve],
                        [CreepLogisticsRequestKeys.delivery]: true,
                    }

                    // Handle reservations for nextRequest
                    if (!creepRequest[CreepLogisticsRequestKeys.noReserve]) {
                        // delete the parent request if it has no more utility, otherwise, reduce its amount
                        if (nextRequest.amount === nextCreepRequest[CreepLogisticsRequestKeys.amount]) {
                            delete creep.room.roomLogisticsRequests[nextRequest.type][nextRequest.ID]
                        } else {
                            nextRequest.amount -= nextCreepRequest[CreepLogisticsRequestKeys.amount]
                        }

                        const target = findObjectWithID(nextRequest.targetID)

                        // Pickup type
                        if (target instanceof Resource) {
                            target.reserveAmount -= nextCreepRequest[CreepLogisticsRequestKeys.amount]
                        } else {
                            // Withdraw or offer type
                            target.reserveStore[nextCreepRequest[CreepLogisticsRequestKeys.resourceType]] -=
                                nextCreepRequest[CreepLogisticsRequestKeys.amount]
                        }
                    }
                }

                creepMemory[CreepMemoryKeys.roomLogisticsRequests].push(nextCreepRequest)
            }

            // delete the parent request if it has no more utility, otherwise, reduce its amount
            if (!creepRequest[CreepLogisticsRequestKeys.noReserve] &&
                bestRequest.amount === creepRequest[CreepLogisticsRequestKeys.amount]) {
                delete creep.room.roomLogisticsRequests[bestRequest.type][bestRequest.ID]
            } else {
                bestRequest.amount -= creepRequest[CreepLogisticsRequestKeys.amount]
            }
        }

        creepMemory[CreepMemoryKeys.roomLogisticsRequests].push(creepRequest)
        if (creepRequest[CreepLogisticsRequestKeys.noReserve]) {
            return creepMemory[CreepMemoryKeys.roomLogisticsRequests][0]
        }

        const target = findObjectWithID(creepRequest[CreepLogisticsRequestKeys.target])

        // Pickup type
        if (target instanceof Resource) {
            target.reserveAmount -= creepRequest[CreepLogisticsRequestKeys.amount]

            return creepMemory[CreepMemoryKeys.roomLogisticsRequests][0]
        }

        if (creepRequest[CreepLogisticsRequestKeys.type] === RoomLogisticsRequestTypes.transfer) {
            target.reserveStore[creepRequest[CreepLogisticsRequestKeys.resourceType]] +=
                creepRequest[CreepLogisticsRequestKeys.amount]

            return creepMemory[CreepMemoryKeys.roomLogisticsRequests][0]
        }

        // Withdraw or offer type
        target.reserveStore[creepRequest[CreepLogisticsRequestKeys.resourceType]] -=
            creepRequest[CreepLogisticsRequestKeys.amount]

        return creepMemory[CreepMemoryKeys.roomLogisticsRequests][0]
    }

    static findRoomLogisticsRequestTypes(creep: Creep, args: FindNewRoomLogisticsRequestArgs) {
        if (args && args.types) {
            if (args.types.has(RoomLogisticsRequestTypes.transfer) && creep.hasNonEnergyResource()) {
                /* if (args && args.noDelivery) return Result.fail */
                creep.noDelivery = true
                return new Set([RoomLogisticsRequestTypes.transfer])
            }

            // Make sure we have the right store values for our types
            if (creep.needsResources()) {
                args.types.delete(RoomLogisticsRequestTypes.transfer)
                return args.types
            }

            args.types.delete(RoomLogisticsRequestTypes.pickup)
            args.types.delete(RoomLogisticsRequestTypes.offer)
            args.types.delete(RoomLogisticsRequestTypes.withdraw)
            return args.types
        }

        if (creep.hasNonEnergyResource()) {
            if (args && args.noDelivery) return Result.fail

            creep.noDelivery = true
            return new Set([RoomLogisticsRequestTypes.transfer])
        }

        if (!creep.needsResources()) return new Set([RoomLogisticsRequestTypes.transfer])
        return new Set([
            RoomLogisticsRequestTypes.withdraw,
            RoomLogisticsRequestTypes.pickup,
            RoomLogisticsRequestTypes.transfer,
        ])
    }

    static canAcceptRoomLogisticsRequest(
        creep: Creep,
        requestType: RoomLogisticsRequestTypes,
        requestID: string
    ) {
        const request = creep.room.roomLogisticsRequests[requestType][requestID]
        const target = findObjectWithID(request.targetID)

        // Pickup type
        if (target instanceof Resource) {
            if (request.onlyFull) {
                // If the creep has enough space
                /* if (creep.freeNextStore >= target.reserveAmount) return true */
                if (target.reserveAmount >= creep.freeNextStore) return true
                return false
            }

            return true
        }

        if (request.type === RoomLogisticsRequestTypes.transfer) {
            // We don't have enough resource and we can deliver
            if (creep.nextStore[request.resourceType] <= 0) {
                if (creep.noDelivery) return false

                // There are no practical storing structures to deliver from
                if (creep.room.name !== creep.commune.name) return false

                // We don't have space to get any
                if (creep.freeNextStore <= 0) return false
                /*
                      // Try to find a sufficient withdraw or offer task

                      const types: RoomLogisticsRequestTypes[] = ['withdraw', 'pickup']

                      let lowestScore = Infinity
                      let bestRequest2

                      for (const type of types) {
                          for (const request2ID in creep.room.roomLogisticsRequests[type]) {
                              const request2 = creep.room.roomLogisticsRequests[type][request2ID]

                              if (request2.resourceType !== request.resourceType) continue

                              const target2Pos = findObjectWithID(request2.targetID).pos
                              const score = request2.priority + getRange(target2Pos, creep.pos) / 100

                              if (score >= lowestScore) continue

                              lowestScore = score
                              bestRequest2 = request2
                          }
                      }

                      if (bestRequest2) {
                          request.delivery = bestRequest2.ID as unknown as string
                          return true
                      }
           */
                // We aren't gonna deliver to a storing structure
                if (target instanceof Structure && storingStructureTypesSet.has(target.structureType))
                    return false

                let storingStructure

                // If energy, make sure there is enough to fill us to full
                if (request.resourceType === RESOURCE_ENERGY) {
                    const minAmount = creep.freeNextStore

                    storingStructure = CommuneUtils.storingStructures(creep.commune).find(
                        structure => structure.reserveStore[request.resourceType] >= minAmount
                    )
                } else {
                    const minAmount = Math.min(creep.freeNextStore, request.amount)

                    storingStructure = CommuneUtils.storingStructures(creep.commune).find(
                        structure => structure.reserveStore[request.resourceType] >= minAmount
                    )
                }

                if (!storingStructure) return false

                request.delivery = storingStructure.id
                return true
            }

            if (request.onlyFull) {
                // If the creep has enough resource
                /* creep.room.visual.text(Math.min(amount, target.store.getCapacity(request.resourceType) / 2).toString(), creep.pos) */
                //
                /* const creepEffectiveCapacity = creep.freeNextStore */
                const creepEffectiveCapacity = creep.store.getCapacity() -
                    creep.store.getUsedCapacity() +
                    creep.nextStore[request.resourceType]

                if (creep.nextStore[request.resourceType] >=
                    Math.min(
                        creep.nextStore[request.resourceType],
                        request.amount,
                        target.store.getCapacity(request.resourceType),
                        creepEffectiveCapacity
                    ))
                    return true
                return false
            }

            return true
        }

        // Withdraw or offer type
        if (request.onlyFull) {
            // If the creep has enough space
            if (target.reserveStore[request.resourceType] >= creep.freeNextStore) return true
            return false
        }

        return true
    }

    static createBackupStoringStructuresRoomLogisticsRequest(
        creep: Creep,
        types: Set<RoomLogisticsRequestTypes>,
        resourceTypes: Set<ResourceConstant>
    ) {
        if (creep.room.name !== creep.commune.name) return Result.fail

        if (types.has(RoomLogisticsRequestTypes.transfer)) {
            const result = this.createBackupStoringStructuresRoomLogisticsRequestTransfer(creep)
            if (result !== Result.fail) return result
        }

        if (creep.role === 'hauler') return Result.fail
        return this.createBackupStoringStructuresRoomLogisticsRequestWithdraw(creep, resourceTypes)
    }

    static createBackupStoringStructuresRoomLogisticsRequestTransfer(creep: Creep) {
        const storingStructures = CommuneUtils.storingStructures(creep.commune)
        if (!storingStructures.length) return Result.fail

        const creepNextStore = creep.nextStore
        let resourceType: ResourceConstant

        for (const key in creepNextStore) {
            // Energy is handled by storing structure logistics requests, not backup-created requests
            if (key === RESOURCE_ENERGY) continue
            if (creepNextStore[key as ResourceConstant] <= 0) continue

            resourceType = key as ResourceConstant
            break
        }

        if (!resourceType) return Result.fail

        const storingStructure = storingStructures.find(
            structure => RoomObjectUtils.freeReserveStoreOf(structure, resourceType) >= creepNextStore[resourceType]
        )
        if (!storingStructure) return Result.fail
        /* creep.room.visual.text((creep.nextStore[resourceType]).toString(), creep.pos.x, creep.pos.y, { color: customColors.red }) */
        return {
            [CreepLogisticsRequestKeys.type]: RoomLogisticsRequestTypes.transfer,
            [CreepLogisticsRequestKeys.target]: storingStructure.id,
            [CreepLogisticsRequestKeys.resourceType]: resourceType,
            [CreepLogisticsRequestKeys.amount]: creepNextStore[resourceType],
        }
    }

    static createBackupStoringStructuresRoomLogisticsRequestWithdraw(
        creep: Creep,
        resourceTypes: Set<ResourceConstant> = new Set([RESOURCE_ENERGY])
    ) {
        const storingStructures = CommuneUtils.storingStructures(creep.commune)
        if (!storingStructures.length) return Result.fail

        let resourceType: ResourceConstant
        let storingStructure: AnyStoreStructure

        for (resourceType of resourceTypes) {
            storingStructure = storingStructures.find(
                structure => structure.reserveStore[resourceType] >= RoomObjectUtils.freeNextStoreOf(creep, resourceType)
            )
            if (storingStructure) break
        }

        if (!storingStructure) return Result.fail

        /* creep.room.visual.text((creep.nextStore[resourceType]).toString(), creep.pos.x, creep.pos.y, { color: customColors.red }) */
        return {
            [CreepLogisticsRequestKeys.type]: RoomLogisticsRequestTypes.withdraw,
            [CreepLogisticsRequestKeys.target]: storingStructure.id,
            [CreepLogisticsRequestKeys.resourceType]: resourceType,
            [CreepLogisticsRequestKeys.amount]: RoomObjectUtils.freeNextStoreOf(creep, resourceType),
        }
    }

    static findRoomLogisticRequestAmount(creep: Creep, request: RoomLogisticsRequest) {
        const target = findObjectWithID(request.targetID)

        // Pickup type
        if (target instanceof Resource) {
            const creepFreeNextStore = RoomObjectUtils.freeNextStoreOf(creep, request.resourceType)
            return Math.min(creepFreeNextStore, request.amount)
        }

        if (request.type === RoomLogisticsRequestTypes.transfer) {
            const creepFreeNextStore = RoomObjectUtils.freeNextStoreOf(creep, request.resourceType)

            if (request.delivery) {
                // Take extra energy in case its needed
                /*         if (request.resourceType === RESOURCE_ENERGY) {
                  return creep.nextStore[request.resourceType] + creepFreeNextStore
                } */
                return Math.min(request.amount, creep.nextStore[request.resourceType] + creepFreeNextStore)
            }
            return Math.min(creep.nextStore[request.resourceType], request.amount)
        }

        // Withdraw or offer type
        const creepFreeNextStore = RoomObjectUtils.freeNextStoreOf(creep, request.resourceType)
        return Math.min(creepFreeNextStore, request.amount)
    }

    static findNewRampartRepairTarget(creep: Creep) {
        const ramparts = creep.room.roomManager.enemyAttackers.length
            ? creep.room.communeManager.defensiveRamparts
            : CommuneUtils.getRampartRepairTargets(creep.room)

        const [score, bestTarget] = findWithLowestScore(ramparts, structure => {
            if (structure.nextHits / structure.hitsMax > 0.9) return false

            // Score by range and hits
            return getRange(creep.pos, structure.pos) + structure.nextHits / 1000
        })

        if (!bestTarget) return false

        Memory.creeps[creep.name][CreepMemoryKeys.structureTarget] = bestTarget.id
        return bestTarget
    }

    static findNewRepairTarget(creep: Creep) {
        const enemyAttackers = !!creep.room.roomManager.enemyAttackers.length
        let repairThreshold = enemyAttackers ? 0.1 : 0.3

        let lowestScore = Infinity
        let bestTarget

        const structures = CommuneUtils.getGeneralRepairStructures(creep.room)
        for (const structure of structures) {
            // If above 30% of max hits
            if (structure.nextHits / structure.hitsMax > repairThreshold) continue

            const score = getRange(creep.pos, structure.pos) + (structure.nextHits / structure.hitsMax) * 20
            if (score >= lowestScore) continue

            lowestScore = score
            bestTarget = structure
        }

        if (!bestTarget) return false

        const creepMemory = Memory.creeps[creep.name]
        creepMemory[CreepMemoryKeys.structureTarget] = bestTarget.id
        return bestTarget
    }

    static findRepairTarget(creep: Creep) {
        const creepMemory = Memory.creeps[creep.name]
        if (creepMemory[CreepMemoryKeys.structureTarget]) {
            const repairTarget = findObjectWithID(creep.memory[CreepMemoryKeys.structureTarget])
            if (repairTarget) return repairTarget
        }

        return this.findNewRepairTarget(creep) || this.findNewRampartRepairTarget(creep)
    }

    static findFastFillerCoord(creep: Creep) {
        const creepMemory = Memory.creeps[creep.name]
        if (creepMemory[CreepMemoryKeys.packedCoord]) {
            return unpackCoord(creepMemory[CreepMemoryKeys.packedCoord])
        }

        return this.findNewFastFillerCoord(creep, creepMemory)
    }

    /**
     * Find the closest open fast filler coord, if exists. Then assign it to the creep
     */
    static findNewFastFillerCoord(creep: Creep, creepMemory = Memory.creeps[creep.name]) {
        const fastFillerCoords = RoomUtils.getFastFillerCoords(creep.room)
        if (!fastFillerCoords.length) return false

        const reservedCoords = creep.room.roomManager.reservedCoords

        const result = this.findOpenFastFillerCoord(creep, reservedCoords)
        if (result === Result.fail) return false

        creepMemory[CreepMemoryKeys.packedCoord] = result.packedCoord
        reservedCoords.set(result.packedCoord, ReservedCoordTypes.important)

        return result.coord
    }

    private static findOpenFastFillerCoord(
        creep: Creep,
        reservedCoords: Map<string, ReservedCoordTypes>
    ) {
        const packedFastFillerCoords = roomData[creep.room.name].fastFillerCoords

        let lowestScore = Infinity
        let bestCoord: Coord
        let bestPackedCoord: string
        let bestIndex: number

        for (let i = 0; i < packedFastFillerCoords.length; i++) {
            const packedCoord = packedFastFillerCoords[i]

            if (reservedCoords.get(packedCoord) === ReservedCoordTypes.important) {
                continue
            }

            const coord = unpackCoord(packedCoord)

            const score = getRange(coord, creep.pos)
            if (score >= lowestScore) continue

            lowestScore = score
            bestCoord = coord
            bestPackedCoord = packedCoord
            bestIndex = i
        }
        if (!bestCoord) return Result.fail

        return {
            coord: bestCoord,
            packedCoord: bestPackedCoord,
            index: bestIndex,
        }
    }
}
