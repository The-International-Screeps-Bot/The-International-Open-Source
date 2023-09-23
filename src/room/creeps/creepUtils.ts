import { CreepMemoryKeys, ReservedCoordTypes, Result, RoomMemoryKeys, creepRoles, packedCoordLength, packedPosLength } from 'international/constants'
import { updateStat } from 'international/statsManager'
import { getRange } from 'utils/utils'
import { CreepRoleManager } from './creepRoleManager'
import { packCoord, unpackPosAt } from 'other/codec'

export const creepUtils = {
    expandName(creepName: string) {
        return creepName.split('_')
    },
    roleName(creepName: string) {
        return creepRoles[parseInt(creepName[0])]
    },
    roleCreep(creep: Creep) {
        if (creep._role) return creep._role

        return (creep._role = this.roleName(creep.name))
    },
    /**
     * Overhead logic ran for dead creeps
     */
    runDead(creepName: string) {
        const creepMemory = Memory.creeps[creepName]
        const role = this.roleName(creepName)
    },
    runRepair(creep: Creep, target: Structure) {
        // If we've already schedhuled a work intent, don't try to do another
        if (creep.worked) return Result.noAction
        if (creep.repair(target) !== OK) return Result.fail

        const workParts = creep.parts.work
        // Estimate the repair cost, assuming it goes through
        const energySpentOnRepair = Math.min(
            workParts,
            (target.hitsMax - target.hits) / REPAIR_POWER,
            creep.store.energy,
        )

        // Record the repair attempt in different places for barricades than other structures
        if (target.structureType === STRUCTURE_RAMPART || target.structureType === STRUCTURE_WALL) {
            updateStat(creep.room.name, 'eorwr', energySpentOnRepair)
            creep.message = `🧱${energySpentOnRepair * REPAIR_POWER}`
        } else {
            updateStat(creep.room.name, 'eoro', energySpentOnRepair)
            creep.message = `🔧${energySpentOnRepair * REPAIR_POWER}`
        }

        // Estimate the target's nextHits so we can target creeps accordingly
        target.nextHits = Math.min(target.nextHits + workParts * REPAIR_POWER, target.hitsMax)
        return Result.success
    },
    repairCommune(creep: Creep) {
        if (creep.needsResources()) {
            if (
                creep.room.communeManager.storingStructures.length &&
                creep.room.resourcesInStoringStructures.energy < 3000
            )
                return Result.fail

            // Reset target so when we are full we search again
            delete Memory.creeps[creep.name][CreepMemoryKeys.structureTarget]

            creep.runRoomLogisticsRequestsAdvanced({
                types: new Set(['withdraw', 'offer', 'pickup']),
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
                weightCostMatrix: 'defaultCostMatrix',
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
            weightCostMatrix: 'defaultCostMatrix',
        })

        return true
    },
    repairCommuneStationary(creep: Creep) {},
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
    },
    findEnergySpentOnConstruction(creep: Creep, cSite: ConstructionSite, workParts: number) {

        const energySpent = Math.min(
            workParts * BUILD_POWER,
            // In private servers sometimes progress can be greater than progress total
            Math.max((cSite.progressTotal - cSite.progress) * BUILD_POWER, 0),
            creep.nextStore.energy,
        )

        return energySpent
    }
}
