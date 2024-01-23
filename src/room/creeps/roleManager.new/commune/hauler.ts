import { CreepProcs } from 'room/creeps/creepProcs'
import { DefaultRoleManager } from 'room/creeps/defaultRoleManager'

class HaulerManager extends DefaultRoleManager {
  role: CreepRoles = 'hauler'

  run(creep: Creep) {
    CreepProcs.passiveRenew(creep)
    CreepProcs.runRoomLogisticsRequestsAdvanced(creep)
  }
}

export const haulerManager = new HaulerManager()
