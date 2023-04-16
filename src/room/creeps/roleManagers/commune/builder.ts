import { RESULT_FAIL, RESULT_SUCCESS } from 'international/constants'
import { customLog, findObjectWithID, getRange } from 'international/utils'

export class Builder extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    preTickManager() {
        if (!this.room.roomManager.cSiteTarget) return
        if (!this.room.communeManager.buildersMakeRequests) return
        if (this.usedReserveStore > this.store.getCapacity() * 0.5) return

        this.room.roomManager.room.createRoomLogisticsRequest({
            target: this,
            type: 'transfer',
            priority: 8,
        })
    }

    run?() {
        if (this.advancedBuild() === RESULT_FAIL) this.advancedRecycle()
    }

    static roleManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: Builder = Game.creeps[creepName]
            creep.run()
        }
    }
}
