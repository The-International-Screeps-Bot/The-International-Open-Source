import './creepPrototypes/creepFunctions'
import './creepPrototypes/creepMoveFunctions'

import { creepRoles, customColors } from '../../constants/general'
import { LogTypes, LogOps } from 'utils/logOps'
import { RoomManager } from 'room/room'
import { StatsManager } from 'international/stats'
import { creepClasses } from './creepClasses'

export class CreepRoleManager {
  roomManager: RoomManager

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager
  }

  public newRun() {
    for (const role in creepClasses) {
      creepClasses[role as CreepRoles].run()
    }
  }

  public run() {
    const { room } = this.roomManager

    for (const role of creepRoles) {
      this.runManager(role)
    }
  }

  private runManager(role: CreepRoles) {
    // If there are no creeps for this manager, iterate

    if (!this.roomManager.room.myCreepsByRole[role].length) return

    const roleCPUStart = Game.cpu.getUsed()
    console.log(role)
    creepClasses[role].roleManager(
      this.roomManager.room,
      this.roomManager.room.myCreepsByRole[role],
    )

    // Log role stats

    const creepsOfRoleAmount = this.roomManager.room.myCreepsByRole[role].length

    LogOps.log(
      `${role}s`,
      `Creeps: ${creepsOfRoleAmount}, CPU: ${(Game.cpu.getUsed() - roleCPUStart).toFixed(
        2,
      )}, CPU Per Creep: ${((Game.cpu.getUsed() - roleCPUStart) / creepsOfRoleAmount).toFixed(2)}`,
      {
        position: 3,
      },
    )
  }
}
