import { RESULT_FAIL, RESULT_SUCCESS } from 'international/constants'
import { customLog, findObjectWithID, getRange } from 'international/utils'

export class Builder extends Creep {

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    preTickManager() {

        if (!this.room.cSiteTarget) return

        this.room.roomManager.room.createRoomLogisticsRequest({
            target: this,
            type: 'transfer',
            priority: 8,
            threshold: this.store.getCapacity() * 0.5,
        })
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
