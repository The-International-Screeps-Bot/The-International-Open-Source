import { Result, RoomLogisticsRequestTypes } from 'international/constants'
import { DefaultRoleManager } from 'room/creeps/defaultRoleManager'
import { customLog } from 'utils/logging'
import { findObjectWithID, getRange } from 'utils/utils'

class BuilderManager extends DefaultRoleManager {
    role: CreepRoles = 'hauler'
    // Allows for the pattern: instance.manager.run(instance)
    manager = this

    runInitial(room: Room) {
        for (const creepName of room.myCreeps[this.role]) {
            this.runInitialCreep(Game.creeps[creepName])
        }
    }

    runInitialCreep(creep: Creep) {
        if (!creep.room.roomManager.cSiteTarget) return
        if (!creep.room.communeManager.buildersMakeRequests) return
        if (creep.usedReserveStore > creep.store.getCapacity() * 0.5) return

        creep.room.roomManager.room.createRoomLogisticsRequest({
            target: creep,
            type: RoomLogisticsRequestTypes.transfer,
            priority: 8,
        })
    }

    run(room: Room) {
        for (const creepName of room.myCreeps[this.role]) {
            this.runCreep(Game.creeps[creepName])
        }
    }

    runCreep(creep: Creep) {
        if (creep.advancedBuild() === Result.fail) {
            creep.advancedRecycle()
        }
    }
}

export const builderManager = new BuilderManager()
