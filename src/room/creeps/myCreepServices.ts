import { LogOps } from 'utils/logOps'
import { HaulerServices } from './roles/haulerServices'

export class MyCreepServices {
  static runCreeps(room: Room) {
    for (const role in room.myCreepsByRole) {
      const creepNames = room.myCreepsByRole[role as CreepRoles]
      if (!creepNames) continue

      switch (role) {
        case 'hauler':
          HaulerServices.runCreeps(creepNames)
          break
        default:
          LogOps.log('No server for role', role)
        /* throw Error(`No service for role ${role}`) */
      }
    }
  }
}
