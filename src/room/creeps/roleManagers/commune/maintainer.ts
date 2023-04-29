import { CreepMemoryKeys, RESULT_FAIL, roomDimensions } from 'international/constants'
import { updateStat } from 'international/statsManager'
import { findCoordsInsideRect, findObjectWithID, getRange } from 'international/utils'
import { packCoord } from 'other/codec'

export class Maintainer extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    preTickManager() {
        this.avoidEnemyThreatCoords()
    }

    hasSufficientStoredEnergy?() {
        if (!this.room.communeManager.storingStructures.length) return true

        if (this.room.resourcesInStoringStructures.energy < 1000) {
            return false
        }

        return true
    }

    advancedMaintain?(): boolean {
        const { room } = this

        if (this.needsResources()) {
            if (!this.hasSufficientStoredEnergy()) return false

            delete this.memory[CreepMemoryKeys.structureTarget]

            this.runRoomLogisticsRequestsAdvanced({
                types: new Set(['withdraw', 'offer', 'pickup']),
                resourceTypes: new Set([RESOURCE_ENERGY]),
            })

            if (this.needsResources()) return false
        }

        // Otherwise if we don't need resources and can maintain

        const workPartCount = this.parts.work
        let repairTarget = this.findRepairTarget()

        if (!repairTarget) {
            this.message = '❌🔧'
            return false
        }

        this.message = '⏩🔧'
        room.targetVisual(this.pos, repairTarget.pos)

        this.actionCoord = repairTarget.pos

        // Move to target if out of range

        if (getRange(this.pos, repairTarget.pos) > 3) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: repairTarget.pos, range: 3 }],
                avoidEnemyRanges: true,
                weightCostMatrix: 'defaultCostMatrix',
            })

            return false
        }

        if (this.worked) return true

        const repairResult = this.repair(repairTarget)
        if (repairResult !== OK) return false

        // Find the repair amount by finding the smaller of the this's work and the progress left for the cSite divided by repair power

        const energySpentOnRepairs = Math.min(
            workPartCount,
            (repairTarget.hitsMax - repairTarget.hits) / REPAIR_POWER,
            this.store.energy,
        )

        if (repairTarget.structureType === STRUCTURE_RAMPART || repairTarget.structureType === STRUCTURE_WALL) {
            updateStat(this.room.name, 'eorwr', energySpentOnRepairs)
            this.message = `🧱${energySpentOnRepairs * REPAIR_POWER}`
        } else {
            updateStat(this.room.name, 'eoro', energySpentOnRepairs)
            this.message = `🔧${energySpentOnRepairs * REPAIR_POWER}`
        }

        // Implement the results of the repair pre-emptively

        repairTarget.nextHits = Math.min(repairTarget.nextHits + workPartCount * REPAIR_POWER, repairTarget.hitsMax)

        // If the structure is a rampart, continue repairing it

        if (repairTarget.structureType === STRUCTURE_RAMPART) return true
        // Otherwise if it isn't a rampart and it will be viable to repair next tick
        else if (repairTarget.hitsMax - repairTarget.nextHits >= workPartCount * REPAIR_POWER) return true

        // Otherwise we need a new target

        delete this.memory[CreepMemoryKeys.structureTarget]

        // Find a target next tick, we can't do more

        if (this.moved) return true

        // Find repair targets that don't include the current target, informing true if none were found

        repairTarget = this.findNewRepairTarget() || this.findNewRampartRepairTarget()
        if (!repairTarget) return true

        // We are already in viable range

        if (getRange(this.pos, repairTarget.pos) <= 3) return true

        // Make a move request to it

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: repairTarget.pos, range: 3 }],
            avoidEnemyRanges: true,
            weightCostMatrix: 'defaultCostMatrix',
        })

        return true
    }

    maintainNearby?(): boolean {
        const { room } = this

        // If the this has no energy, inform false

        if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) return false

        const workPartCount = this.parts.work

        const structure = this.room.roomManager.generalRepairStructures.find(structure => {
            return (
                getRange(structure.pos, this.pos) <= 3 &&
                structure.hitsMax - structure.hits >= workPartCount * REPAIR_POWER
            )
        })
        if (!structure) return false

        if (this.repair(structure) !== OK) return false

        // Otherwise we repaired successfully

        // Find the repair amount by finding the smaller of the this's work and the progress left for the cSite divided by repair power

        const energySpentOnRepairs = Math.min(workPartCount, (structure.hitsMax - structure.hits) / REPAIR_POWER)

        // Show it tried to repair

        this.message = `🗺️🔧${energySpentOnRepairs * REPAIR_POWER}`
        return true
    }

    run?() {
        const cSiteTarget = this.room.roomManager.cSiteTarget
        if (cSiteTarget && cSiteTarget.structureType === STRUCTURE_SPAWN) {
            this.advancedBuild()

            return
        }
        /*
        const rampartCSite = this.room.find(FIND_MY_CONSTRUCTION_SITES).find(site => site.structureType === STRUCTURE_RAMPART)
        if (rampartCSite && this.advancedBuildCSite(rampartCSite) !== RESULT_FAIL) return
        */
        if (this.advancedMaintain()) return
        if (this.maintainNearby()) return
    }

    static roleManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: Maintainer = Game.creeps[creepName]
            creep.run()
        }
    }
}
