import {
    CreepMemoryKeys,
    ReservedCoordTypes,
    Result,
    RoomLogisticsRequestTypes,
    RoomMemoryKeys,
    creepRoles,
    packedCoordLength,
    packedPosLength,
    roomLogisticsRoles,
} from 'international/constants'
import { statsManager } from 'international/statsManager'
import { arePositionsEqual, getRange } from 'utils/utils'
import { CreepRoleManager } from './creepRoleManager'
import { packCoord, unpackCoordAsPos, unpackPosAt } from 'other/codec'
import { RoomManager } from 'room/room'
import { collectiveManager } from 'international/collective'
import { creepClasses } from './creepClasses'

export class CreepUtils {
    expandName(creepName: string) {
        return creepName.split('_')
    }
    roleName(creepName: string) {
        return creepRoles[parseInt(creepName[0])]
    }
    roleCreep(creep: Creep) {
        if (creep._role) return creep._role

        return (creep._role = this.roleName(creep.name))
    }
    /**
     * Overhead logic ran for dead creeps
     */
    runDead(creepName: string) {
        const creepMemory = Memory.creeps[creepName]
        const role = this.roleName(creepName)
    }
    runRepair(creep: Creep, target: Structure) {
        // If we've already schedhuled a work intent, don't try to do another
        if (creep.worked) return Result.noAction
        if (creep.repair(target) !== OK) return Result.fail

        const workParts = creep.parts.work
        // Estimate the repair cost, assuming it goes through
        const energySpentOnRepair = Math.min(
            workParts,
            // Sometimes hitsMax can be more than hits
            Math.max((target.hitsMax - target.hits) / REPAIR_POWER, 0),
            creep.store.energy,
        )

        // Record the repair attempt in different places for barricades than other structures
        if (target.structureType === STRUCTURE_RAMPART || target.structureType === STRUCTURE_WALL) {
            statsManager.updateStat(creep.room.name, 'eorwr', energySpentOnRepair)
            creep.message = `🧱${energySpentOnRepair * REPAIR_POWER}`
        } else {
            statsManager.updateStat(creep.room.name, 'eoro', energySpentOnRepair)
            creep.message = `🔧${energySpentOnRepair * REPAIR_POWER}`
        }

        // Estimate the target's nextHits so we can target creeps accordingly
        target.nextHits = Math.min(target.nextHits + workParts * REPAIR_POWER, target.hitsMax)
        return Result.success
    }
    repairCommune(creep: Creep) {
        if (creep.needsResources()) {
            if (
                creep.room.communeManager.storingStructures.length &&
                creep.room.roomManager.resourcesInStoringStructures.energy < 3000
            )
                return Result.fail

            // Reset target so when we are full we search again
            delete Memory.creeps[creep.name][CreepMemoryKeys.structureTarget]

            creep.runRoomLogisticsRequestsAdvanced({
                types: new Set<RoomLogisticsRequestTypes>([
                    RoomLogisticsRequestTypes.withdraw,
                    RoomLogisticsRequestTypes.offer,
                    RoomLogisticsRequestTypes.pickup,
                ]),
                resourceTypes: new Set([RESOURCE_ENERGY]),
            })

            if (creep.needsResources()) return false
        }

        // Otherwise if we don't need resources and can maintain

        const workPartCount = creep.parts.work
        let repairTarget = creep.findRepairTarget()

        if (!repairTarget) {
            creep.message = '❌🔧'
            return false
        }

        creep.message = '⏩🔧'
        creep.room.targetVisual(creep.pos, repairTarget.pos)

        creep.actionCoord = repairTarget.pos

        // Move to target if out of range

        if (getRange(creep.pos, repairTarget.pos) > 3) {
            creep.createMoveRequest({
                origin: creep.pos,
                goals: [{ pos: repairTarget.pos, range: 3 }],
                avoidEnemyRanges: true,
                defaultCostMatrix(roomName) {
                    const roomManager = RoomManager.roomManagers[roomName]
                    if (!roomManager) return false

                    return roomManager.defaultCostMatrix
                },
            })

            return false
        }

        if (this.runRepair(creep, repairTarget) !== Result.success) return Result.fail

        // If the structure is a rampart, continue repairing it

        if (repairTarget.structureType === STRUCTURE_RAMPART) return true
        // Otherwise if it isn't a rampart and it will be viable to repair next tick
        else if (repairTarget.hitsMax - repairTarget.nextHits >= workPartCount * REPAIR_POWER)
            return true

        // Otherwise we need a new target
        delete Memory.creeps[creep.name][CreepMemoryKeys.structureTarget]
        delete creep.actionCoord

        // We already repaired so we can only move to a target, so if we've already done that, it's not worth continueing
        if (creep.moved) return true

        // Find repair targets that don't include the current target, informing true if none were found

        repairTarget = creep.findNewRepairTarget() || creep.findNewRampartRepairTarget()
        if (!repairTarget) return true

        creep.actionCoord = repairTarget.pos

        // We are already in repair range, no need to move closer
        if (getRange(creep.pos, repairTarget.pos) <= 3) return true

        // Make a move request to it

        creep.createMoveRequest({
            origin: creep.pos,
            goals: [{ pos: repairTarget.pos, range: 3 }],
            avoidEnemyRanges: true,
            defaultCostMatrix(roomName) {
                const roomManager = RoomManager.roomManagers[roomName]
                if (!roomManager) return false

                return roomManager.defaultCostMatrix
            },
        })

        return true
    }
    repairCommuneStationary(creep: Creep) {}
    repairNearby(creep: Creep) {
        // If the this has no energy, inform false

        if (creep.nextStore.energy <= 0) return Result.noAction

        creep.message += '🗺️'

        const workPartCount = creep.parts.work
        // At some point we should compare this search with flat searching positions around the creep
        const structure = creep.room.roomManager.generalRepairStructures.find(structure => {
            return (
                getRange(structure.pos, creep.pos) <= 3 &&
                structure.hitsMax - structure.hits >= workPartCount * REPAIR_POWER
            )
        })
        if (!structure) return Result.noAction

        if (this.runRepair(creep, structure) !== Result.success) return Result.fail

        // Otherwise we repaired successfully

        return Result.success
    }
    findEnergySpentOnConstruction(creep: Creep, cSite: ConstructionSite, workParts: number) {
        const energySpent = Math.min(
            workParts * BUILD_POWER,
            // In private servers sometimes progress can be greater than progress total
            Math.max((cSite.progressTotal - cSite.progress) * BUILD_POWER, 0),
            creep.nextStore.energy,
        )

        return energySpent
    }
    advancedUpgradeController(creep: Creep) {

        const creepMemory = Memory.creeps[creep.name]
        const controller = creep.room.controller
        creepMemory[CreepMemoryKeys.targetID] = controller.id

        // Assign either the controllerLink or controllerContainer as the controllerStructure

        let controllerStructure: StructureLink | StructureContainer | false = creep.room.roomManager.controllerContainer
        const controllerLink = creep.room.communeManager.controllerLink

        if (!controllerStructure && controllerLink && controllerLink.isRCLActionable)
            controllerStructure = controllerLink

        // If there is a controllerContainer

        if (controllerStructure) {
            // If we're not on a viable upgrade pos

            const upgradePos = this.findUpgradePosWeak(creep)
            if (!upgradePos) {
                const upgradePos = this.findUpgradePosStrong(creep)
                if (!upgradePos) return false

                if (getRange(creep.pos, upgradePos) > 0) {
                    creep.createMoveRequest({
                        origin: creep.pos,
                        goals: [
                            {
                                pos: upgradePos,
                                range: 0,
                            },
                        ],
                        avoidEnemyRanges: true,
                        defaultCostMatrix(roomName) {
                            const roomManager = RoomManager.roomManagers[roomName]
                            if (!roomManager) return false

                            return roomManager.defaultCostMatrix
                        },
                    })

                    creep.message += '➡️'
                }
            }

            creep.actionCoord = creep.room.roomManager.centerUpgradePos

            const workPartCount = creep.parts.work
            const controllerRange = getRange(creep.pos, controller.pos)

            if (controllerRange <= 3 && creep.nextStore.energy > 0) {
                if (creep.upgradeController(controller) === OK) {
                    creep.nextStore.energy -= workPartCount

                    const controlPoints = workPartCount * UPGRADE_CONTROLLER_POWER

                    statsManager.updateStat(creep.room.name, 'eou', controlPoints)
                    creep.message += `🔋${controlPoints}`
                }
            }

            const controllerStructureRange = getRange(creep.pos, controllerStructure.pos)
            if (controllerStructureRange <= 3) {
                // If the controllerStructure is a container and is in need of repair

                if (
                    controllerStructure.structureType === STRUCTURE_CONTAINER &&
                    creep.nextStore.energy > 0 &&
                    controllerStructure.hitsMax - controllerStructure.hits >=
                        workPartCount * REPAIR_POWER
                ) {
                    // If the repair worked

                    if (creep.repair(controllerStructure) === OK) {
                        // Find the repair amount by finding the smaller of the creep's work and the progress left for the cSite divided by repair power

                        const energySpentOnRepairs = Math.min(
                            workPartCount,
                            (controllerStructure.hitsMax - controllerStructure.hits) / REPAIR_POWER,
                            creep.nextStore.energy,
                        )

                        creep.nextStore.energy -= energySpentOnRepairs

                        // Add control points to total controlPoints counter and say the success

                        statsManager.updateStat(creep.room.name, 'eoro', energySpentOnRepairs)
                        creep.message += `🔧${energySpentOnRepairs * REPAIR_POWER}`
                    }
                }

                if (controllerStructureRange <= 1 && creep.nextStore.energy <= 0) {
                    // Withdraw from the controllerContainer, informing false if the withdraw failed

                    if (creep.withdraw(controllerStructure, RESOURCE_ENERGY) !== OK) return false

                    creep.nextStore.energy += Math.min(
                        creep.store.getCapacity(),
                        controllerStructure.nextStore.energy,
                    )
                    controllerStructure.nextStore.energy -= creep.nextStore.energy

                    delete creepMemory[CreepMemoryKeys.targetID]
                    creep.message += `⚡`
                }
            }

            return true
        }

        // If the creep needs resources

        if (creep.needsResources()) {
            creep.runRoomLogisticsRequestsAdvanced({
                types: new Set<RoomLogisticsRequestTypes>([
                    RoomLogisticsRequestTypes.withdraw,
                    RoomLogisticsRequestTypes.pickup,
                    RoomLogisticsRequestTypes.offer,
                ]),
                conditions: request => request.resourceType === RESOURCE_ENERGY,
            })

            if (creep.needsResources()) return false

            delete creepMemory[CreepMemoryKeys.targetID]

            creep.createMoveRequest({
                origin: creep.pos,
                goals: [{ pos: controller.pos, range: 3 }],
                avoidEnemyRanges: true,
                defaultCostMatrix(roomName) {
                    const roomManager = RoomManager.roomManagers[roomName]
                    if (!roomManager) return false

                    return roomManager.defaultCostMatrix
                },
            })
            return false
        }

        // Otherwise if the creep doesn't need resources

        // If the controller is out of upgrade range

        creep.actionCoord = controller.pos

        if (getRange(creep.pos, controller.pos) > 3) {
            // Make a move request to it

            creep.createMoveRequest({
                origin: creep.pos,
                goals: [{ pos: controller.pos, range: 3 }],
                avoidEnemyRanges: true,
                defaultCostMatrix(roomName) {
                    const roomManager = RoomManager.roomManagers[roomName]
                    if (!roomManager) return false

                    return roomManager.defaultCostMatrix
                },
            })

            // Inform false

            return false
        }

        // Try to upgrade the controller, and if it worked

        if (creep.upgradeController(controller) === OK) {
            // Add control points to total controlPoints counter and say the success

            const energySpentOnUpgrades = Math.min(
                creep.nextStore.energy,
                creep.parts.work * UPGRADE_CONTROLLER_POWER,
            )

            statsManager.updateStat(creep.room.name, 'eou', energySpentOnUpgrades)
            creep.message = `🔋${energySpentOnUpgrades}`

            // Inform true

            return true
        }

        // Inform false

        return false
    }
    findUpgradePosWeak(creep: Creep): RoomPosition | undefined {

        const upgradePos = creep.room.roomManager.upgradePositions.find(
            pos =>
                arePositionsEqual(creep.pos, pos) &&
                !creep.room.roomManager.reservedCoords.has(packCoord(pos))
        )
        return upgradePos
    }
    findUpgradePosStrong(creep: Creep): RoomPosition | undefined {

        const creepMemory = Memory.creeps[creep.name]
        // use our packed coord if we have one
        if (creepMemory[CreepMemoryKeys.packedCoord]) {
            return unpackCoordAsPos(creepMemory[CreepMemoryKeys.packedCoord], creep.room.name)
        }

        const upgradePos = creep.room.roomManager.upgradePositions.find(
            pos => {

                const packedCoord = packCoord(pos)

                // Iterate if the pos is used
                if (creep.room.roomManager.reservedCoords.get(packedCoord) > ReservedCoordTypes.dying) {

                    return false
                }

                // Otherwise record packedPos in the creep's memory and in usedUpgradeCoords

                creepMemory[CreepMemoryKeys.packedCoord] = packedCoord
                creep.room.roomManager.reservedCoords.set(packedCoord, ReservedCoordTypes.important)

                return pos
            }
        )

        return upgradePos
    }
}

export const creepUtils = new CreepUtils()
