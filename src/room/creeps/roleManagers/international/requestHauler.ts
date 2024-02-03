import { CreepMemoryKeys } from '../../../../constants/general'
import { CollectiveManager } from 'international/collective'

export class RequestHauler extends Creep {
  constructor(creepID: Id<Creep>) {
    super(creepID)
  }

  initRun() {
    if (Memory.haulRequests[this.memory[CreepMemoryKeys.haulRequest]]) {
      CollectiveManager.creepsByHaulRequest[this.memory[CreepMemoryKeys.haulRequest]].push(
        this.name,
      )
    }
  }

  static roleManager(room: Room, creepsOfRole: string[]) {
    for (const creepName of creepsOfRole) {
      const creep: RequestHauler = Game.creeps[creepName]
    }
  }
}
