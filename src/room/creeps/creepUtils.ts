import {
    CreepMemoryKeys,
    ReservedCoordTypes,
    Result,
    RoomLogisticsRequestTypes,
    RoomMemoryKeys,
    RoomStatsKeys,
    WorkTypes,
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
import { communeUtils } from 'room/commune/communeUtils'
import { myCreepUtils } from './myCreepUtils'

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
    findEnergySpentOnConstruction(creep: Creep, cSite: ConstructionSite, workParts: number = myCreepUtils.parts(creep).work) {
        const energySpent = Math.min(
            workParts * BUILD_POWER,
            // In private servers sometimes progress can be greater than progress total
            Math.max((cSite.progressTotal - cSite.progress) * BUILD_POWER, 0),
            creep.nextStore.energy,
        )

        return energySpent
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
    harvestSource(creep: Creep, source: Source, workParts: number = myCreepUtils.parts(creep).work) {
        if (creep.harvest(source) !== OK) {
            return Result.fail
        }

        creep.worked = WorkTypes.harvest

        // Find the presumed energy harvested this tick
        const energyHarvested = Math.min(workParts * HARVEST_POWER, source.energy)
        creep.nextStore.energy += energyHarvested
        // Record the harvest in stats
        statsManager.updateStat(creep.room.name, RoomStatsKeys.EnergyInputHarvest, energyHarvested)

        return Result.success
    }
}

export const creepUtils = new CreepUtils()
