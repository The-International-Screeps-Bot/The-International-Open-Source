import { customLog, findObjectWithID, getRange } from 'international/generalFunctions'

export class Builder extends Creep {
    getEnergy?(): boolean {
        const { room } = this

        if (!this.needsResources()) {
            this.message += '✨'
            return false
        }

        // If there are no sourceHarvesters in the room, harvest a source

        if (!(room.myCreeps.source1Harvester.length + room.myCreeps.source2Harvester?.length || 0)) {
            const sources = room.find(FIND_SOURCES_ACTIVE)
            if (!sources.length) return true

            const source = this.pos.findClosestByPath(sources, {
                ignoreCreeps: true,
            })

            if (getRange(this.pos.x, source.pos.x, this.pos.y, source.pos.y) > 1) {
                this.createMoveRequest({
                    origin: this.pos,
                    goals: [{ pos: source.pos, range: 1 }],
                    avoidEnemyRanges: true,
                })

                return true
            }

            this.advancedHarvestSource(source)
            return true
        }

        if (!room.fastFillerContainerLeft && !room.fastFillerContainerRight) return false

        // If there are fastFiller containers

        if (!this.memory.reservations || !this.memory.reservations.length) this.reserveWithdrawEnergy()

        if (!this.fulfillReservation()) {
            this.say(this.message)
            return true
        }

        this.reserveWithdrawEnergy()

        if (!this.fulfillReservation()) {
            this.say(this.message)
            return true
        }

        /*
        // I don't think this is needed anymore
        // If there are no fastFiller containers and not enough energy

        else if (this.store.energy < this.parts.work * BUILD_POWER)
        */
        return false
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static builderManager(room: Room, creepsOfRole: string[]) {
        const cSiteTarget = room.cSiteTarget

        // Loop through creep names of creeps of the manager's role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: Builder = Game.creeps[creepName]

            if (!cSiteTarget) {
                creep.advancedRecycle()
                continue
            }

            if (creep.getEnergy()) {
                creep.say(creep.message)
                continue
            }

            // If there is a cSite, try to build it and iterate

            if (creep.advancedBuildCSite()) creep.getEnergy()

            creep.say(creep.message)
        }
    }
}
