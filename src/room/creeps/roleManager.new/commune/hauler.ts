import { DefaultRoleManager } from "room/creeps/defaultRoleManager"

class HaulerManager extends DefaultRoleManager {

    role: CreepRoles = 'hauler'
    // Allows for the pattern: instance.manager.run(instance)
    manager = this

    run(room: Room) {

        for (const creepName of room.myCreeps[this.role]) {

            this.runCreep(Game.creeps[creepName])
        }
    }

    runCreep(creep: Creep) {

        creep.passiveRenew()
        creep.runRoomLogisticsRequestsAdvanced()
    }
}

export const haulerManager = new HaulerManager()
