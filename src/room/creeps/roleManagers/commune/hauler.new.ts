class HaulerManager {

    role: CreepRoles = 'hauler'

    run(room: Room) {

        for (const creepName of room.myCreeps[this.role]) {

            this.runCreep(Game.creeps[creepName])
        }
    }

    private runCreep(creep: Creep) {

        creep.passiveRenew()
        creep.runRoomLogisticsRequestsAdvanced()
    }
}

export const haulerManager = new HaulerManager()
