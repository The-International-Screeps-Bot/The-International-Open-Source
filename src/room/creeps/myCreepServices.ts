import { customLog } from 'utils/logging'
import { HaulerServices } from './roles/commune/haulerServices'

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
          customLog('No server for role', role)
          /* throw Error(`No service for role ${role}`) */
      }
    }
  }
}
