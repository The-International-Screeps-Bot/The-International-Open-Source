import { RESULT_FAIL, RESULT_SUCCESS } from 'international/constants'
import { customLog, findObjectWithID, getRange } from 'international/utils'

export class BuilderManager {

    role: CreepRoles = 'hauler'
    // Allows for the pattern: instance.manager.run(instance)
    manager = this

    initialRun(room: Room) {

        for (const creepName of room.myCreeps[this.role]) {

            this.initialRunCreep(Game.creeps[creepName])
        }
    }

    private initialRunCreep(creep: Creep) {

        if (!creep.room.roomManager.cSiteTarget) return
        if (!creep.room.communeManager.buildersMakeRequests) return
        if (creep.usedReserveStore > creep.store.getCapacity() * 0.5) return

        creep.room.roomManager.room.createRoomLogisticsRequest({
            target: creep,
            type: 'transfer',
            priority: 8,
        })
    }

    run(room: Room) {

        for (const creepName of room.myCreeps[this.role]) {

            this.runCreep(Game.creeps[creepName])
        }
    }

    private runCreep(creep: Creep) {

        if (creep.advancedBuild() === RESULT_FAIL) {

            creep.advancedRecycle()
        }
    }
}

export const builderManager = new BuilderManager()
