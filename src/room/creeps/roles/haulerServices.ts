import { HaulerOps } from './haulerOps'

export class HaulerServices {
  static runCreeps(creepNames: string[]) {
    for (const creepName of creepNames) {
      const creep = Game.creeps[creepName]
      HaulerOps.runCreep(creep)
    }
  }
}
