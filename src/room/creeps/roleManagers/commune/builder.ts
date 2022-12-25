import { RESULT_FAIL, RESULT_SUCCESS } from 'international/constants'
import { customLog, findObjectWithID, getRange } from 'international/utils'

export class Builder extends Creep {

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
