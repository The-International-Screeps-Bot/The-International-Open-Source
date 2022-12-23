import { RESULT_FAIL, RESULT_SUCCESS } from 'international/constants'
import { customLog, findObjectWithID, getRange } from 'international/utils'

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

        if (
            !room.fastFillerContainerLeft &&
            !room.fastFillerContainerRight &&
            (!room.storage || !room.storage.RCLActionable) &&
            (!room.terminal || !room.terminal.RCLActionable)
        )
            return false

        // If there are fastFiller containers

        if (!this.memory.Rs || !this.memory.Rs.length) this.reserveWithdrawEnergy()

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

    run?() {
        if (this.advancedBuild() === RESULT_FAIL) this.advancedRecycle()

        this.say(this.message)
    }

    static builderManager(room: Room, creepsOfRole: string[]) {

        for (const creepName of creepsOfRole) {
            const creep: Builder = Game.creeps[creepName]
            creep.run()
        }
    }
}
