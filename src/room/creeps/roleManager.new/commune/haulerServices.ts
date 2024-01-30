import { HaulerProcs } from "./haulerProcs";

export class HaulerServices {
  static runCreeps(creepNames: string[]) {

    for (const creepName of creepNames) {

      const creep = Game.creeps[creepName]
      HaulerProcs.runCreep(creep)
    }
  }
}
