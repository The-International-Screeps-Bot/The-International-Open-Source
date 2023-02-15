import { roomDimensions } from 'international/constants'
import { globalStatsUpdater } from 'international/statsManager'
import { findCoordsInsideRect, findObjectWithID, getRangeOfCoords } from 'international/utils'
import { packCoord } from 'other/codec'

export class Maintainer extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    preTickManager() {
        this.avoidEnemyThreatCoords()
    }

    advancedMaintain?(): boolean {
        const { room } = this

        if (this.needsResources()) {
            delete this.memory.repairTarget

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

        // Move to target if out of range

        if (getRangeOfCoords(this.pos, repairTarget.pos) > 3) {
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
            globalStatsUpdater(this.room.name, 'eorwr', energySpentOnRepairs)
            this.message = `🧱${energySpentOnRepairs * REPAIR_POWER}`
        } else {
            globalStatsUpdater(this.room.name, 'eoro', energySpentOnRepairs)
            this.message = `🔧${energySpentOnRepairs * REPAIR_POWER}`
        }

        // Implement the results of the repair pre-emptively

        repairTarget.nextHits = Math.min(repairTarget.nextHits + workPartCount * REPAIR_POWER, repairTarget.hitsMax)

        // If the structure is a rampart, continue repairing it

        if (repairTarget.structureType === STRUCTURE_RAMPART) return true
        // Otherwise if it isn't a rampart and it will be viable to repair next tick
        else if (repairTarget.hitsMax - repairTarget.nextHits >= workPartCount * REPAIR_POWER) return true

        // Otherwise we need a new target

        delete this.memory.repairTarget

        // Find a target next tick, we can't do more

        if (this.moved) return true

        // Find repair targets that don't include the current target, informing true if none were found

        repairTarget = this.findNewRepairTarget() || this.findNewRampartRepairTarget()
        if (!repairTarget) return true

        // We are already in viable range

        if (getRangeOfCoords(this.pos, repairTarget.pos) <= 3) return true

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

        const structure = room.findStructureInsideRect(
            this.pos.x - 3,
            this.pos.y - 3,
            this.pos.x + 3,
            this.pos.y + 3,
            structure => {
                if (structure.structureType !== STRUCTURE_ROAD && structure.structureType !== STRUCTURE_CONTAINER)
                    return false

                // The structure has sufficient hits

                if (structure.hitsMax - structure.hits < workPartCount * REPAIR_POWER) return false

                return true
            },
        )
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
        const cSiteTarget = this.room.cSiteTarget
        if (cSiteTarget && cSiteTarget.structureType === STRUCTURE_SPAWN) {
            this.advancedBuild()

            return
        }

        if (this.advancedMaintain()) return
        if (this.maintainNearby()) return
    }

    static maintainerManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: Maintainer = Game.creeps[creepName]
            creep.run()
        }
    }
}
