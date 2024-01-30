import { CreepProcs } from "room/creeps/creepProcs"

export class HaulerProcs {
  static runCreep(creep: Creep) {
    CreepProcs.passiveRenew(creep)
    CreepProcs.runRoomLogisticsRequestsAdvanced(creep)
  }
}
