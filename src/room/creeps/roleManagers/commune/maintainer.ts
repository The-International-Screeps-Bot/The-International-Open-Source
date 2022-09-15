import { findObjectWithID } from 'international/generalFunctions'

export class Maintainer extends Creep {
    advancedMaintain?(): boolean {
        const { room } = this

        this.say('⏩🔧')

        // If the this needs resources

        if (this.needsResources()) {
            if (!this.memory.reservations || !this.memory.reservations.length) this.reserveWithdrawEnergy()

            if (!this.fulfillReservation()) {
                this.say(this.message)
                return false
            }

            this.reserveWithdrawEnergy()

            if (!this.fulfillReservation()) {
                this.say(this.message)
                return false
            }

            if (this.needsResources()) return false
        }

        // Otherwise if the this doesn't need resources

        // Get the this's work part count

        const workPartCount = this.parts.work

        // Find a repair target based on the thiss work parts. If none are found, inform false

        const repairTarget: Structure | false =
            findObjectWithID(this.memory.repairTarget) ||
            this.findRepairTarget() ||
            this.findRampartRepairTarget(workPartCount)
        if (!repairTarget) return false

        // Add the repair target to memory

        this.memory.repairTarget = repairTarget.id

        // If roomVisuals are enabled

        if (Memory.roomVisuals)
            room.visual.text(repairTarget.structureType === STRUCTURE_RAMPART ? '🧱' : '🔧', repairTarget.pos)

        // If the repairTarget is out of repair range

        if (this.pos.getRangeTo(repairTarget.pos) > 3) {
            // Make a move request to it

            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: repairTarget.pos, range: 3 }],
                avoidEnemyRanges: true,
            })

            // Inform false

            return false
        }

        // Otherwise

        // Try to repair the target

        const repairResult = this.repair(repairTarget)

        // If the repair failed, inform false

        if (repairResult !== OK) return false

        // Find the repair amount by finding the smaller of the this's work and the progress left for the cSite divided by repair power

        const energySpentOnRepairs = Math.min(workPartCount, (repairTarget.hitsMax - repairTarget.hits) / REPAIR_POWER)

        if (repairTarget.structureType === STRUCTURE_RAMPART) {
            if (global.roomStats.commune[this.room.name])
                (global.roomStats.commune[this.room.name] as RoomCommuneStats).eorwr += energySpentOnRepairs
            this.say(`🧱${energySpentOnRepairs * REPAIR_POWER}`)
        } else {
            if (global.roomStats.commune[this.room.name])
                (global.roomStats.commune[this.room.name] as RoomCommuneStats).eoro += energySpentOnRepairs
            else if (global.roomStats.remote[this.room.name])
                global.roomStats.remote[this.room.name].reoro += energySpentOnRepairs
            this.say(`🔧${energySpentOnRepairs * REPAIR_POWER}`)
        }

        // Implement the results of the repair pre-emptively

        repairTarget.realHits = repairTarget.hits + workPartCount * REPAIR_POWER

        // If the structure is a rampart

        if (repairTarget.structureType === STRUCTURE_RAMPART) {
            // If the repairTarget will be below or equal to expectations next tick, inform true

            if (repairTarget.realHits <= this.memory.quota + workPartCount * REPAIR_POWER * 25) return true
        }

        // Otherwise if it isn't a rampart and it will be viable to repair next tick, inform true
        else if (repairTarget.hitsMax - repairTarget.realHits >= workPartCount * REPAIR_POWER) return true

        // Otherwise

        // Delete the target from memory

        delete this.memory.repairTarget

        // Find repair targets that don't include the current target, informing true if none were found

        const newRepairTarget = this.findRepairTarget(new Set([repairTarget.id]))
        if (!newRepairTarget) return true

        // Make a move request to it

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: newRepairTarget.pos, range: 3 }],
            avoidEnemyRanges: true,
        })

        // Inform false

        return true
    }

    maintainNearby?(): boolean {
        const { room } = this

        // If the this has no energy, inform false

        if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) return false

        // Otherwise, look at the this's pos for structures

        const structuresAsPos = this.pos.lookFor(LOOK_STRUCTURES)

        // Get the this's work parts

        const workPartCount = this.parts.work

        let structure

        // Loop through structuresAtPos

        for (structure of structuresAsPos) {
            // If the structure is not a road, iterate

            if (structure.structureType !== STRUCTURE_ROAD && structure.structureType !== STRUCTURE_CONTAINER) continue

            // If the structure is sufficiently repaired, inform false

            if (structure.hitsMax - structure.hits < workPartCount * REPAIR_POWER) break

            // Otherwise, try to repair the structure, informing false if failure

            if (this.repair(structure) !== OK) return false

            // Otherwise

            // Find the repair amount by finding the smaller of the this's work and the progress left for the cSite divided by repair power

            const energySpentOnRepairs = Math.min(workPartCount, (structure.hitsMax - structure.hits) / REPAIR_POWER)

            // Show the this tried to repair

            this.say(`👣🔧${energySpentOnRepairs * REPAIR_POWER}`)
            return true
        }

        const adjacentStructures = room.lookForAtArea(
            LOOK_STRUCTURES,
            Math.max(Math.min(this.pos.y - 3, -1), 1),
            Math.max(Math.min(this.pos.x - 3, -1), 1),
            Math.max(Math.min(this.pos.y + 3, -1), 1),
            Math.max(Math.min(this.pos.x + 3, -1), 1),
            true,
        )

        for (const adjacentPosData of adjacentStructures) {
            structure = adjacentPosData.structure

            // If the structure is not a road, iterate

            if (structure.structureType !== STRUCTURE_ROAD && structure.structureType !== STRUCTURE_CONTAINER) continue

            // If the structure is sufficiently repaired, inform false

            if (structure.hitsMax - structure.hits < workPartCount * REPAIR_POWER) continue

            // Otherwise, try to repair the structure, informing false if failure

            if (this.repair(structure) !== OK) return false

            // Otherwise

            // Find the repair amount by finding the smaller of the this's work and the progress left for the cSite divided by repair power

            const energySpentOnRepairs = Math.min(workPartCount, (structure.hitsMax - structure.hits) / REPAIR_POWER)

            // Show the this tried to repair

            this.say(`🗺️🔧${energySpentOnRepairs * REPAIR_POWER}`)
            return true
        }

        // If no road to repair was found, inform false

        return false
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static maintainerManager(room: Room, creepsOfRole: string[]) {
        // Loop through creep names of creeps of the manager's role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: Maintainer = Game.creeps[creepName]

            // Try to maintain structures, iterating if success

            if (creep.advancedMaintain()) continue

            // Otherwise, try to maintain at feet, iterating if success

            if (creep.maintainNearby()) continue
        }
    }
}
