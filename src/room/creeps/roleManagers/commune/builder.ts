import { RESULT_FAIL, RESULT_SUCCESS } from 'international/constants'
import { customLog, findObjectWithID, getRange } from 'international/utils'

export class Builder extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    preTickManager() {
        // If there is a sufficient storing structure

        const needsOwnRequest =
            (this.room.fastFillerContainerLeft ||
                this.room.fastFillerContainerRight ||
                this.room.storage ||
                this.room.terminal) !== undefined

        if (needsOwnRequest) {
            this.room.roomManager.room.createRoomLogisticsRequest({
                target: this,
                type: 'transfer',
                priority: 5,
                threshold: this.store.getCapacity() * 0.5,
            })
        }
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
