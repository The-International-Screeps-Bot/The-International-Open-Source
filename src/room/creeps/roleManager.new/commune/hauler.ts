import { creepProcs } from "room/creeps/creepProcs"
import { DefaultRoleManager } from "room/creeps/defaultRoleManager"

class HaulerManager extends DefaultRoleManager {

    role: CreepRoles = 'hauler'

    run(creep: Creep) {

        creepProcs.passiveRenew(creep)
        creepProcs.runRoomLogisticsRequestsAdvanced(creep)
    }
}

export const haulerManager = new HaulerManager()
