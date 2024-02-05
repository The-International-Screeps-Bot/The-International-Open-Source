import { customColors, powerCreepClassNames } from '../../constants/general'
import { statsManager } from 'international/stats'
import { LogOps } from 'utils/logOps'
import { RoomManager } from 'room/room'
import { Operator } from './powerCreeps/operator'

const managers: { [key in PowerClassConstant]: Function } = {
  [POWER_CLASS.OPERATOR]: Operator.operatorManager,
}

export class PowerCreepRoleManager {
  roomManager: RoomManager

  constructor(roomManager: RoomManager) {
    this.roomManager = roomManager
  }

  public run() {
    const { room } = this.roomManager

    for (const className of powerCreepClassNames) this.runManager(className)
  }

  private runManager(className: PowerClassConstant) {
    const roleCPUStart = Game.cpu.getUsed()

    // Get the amount of creeps with the role

    const creepsOfRoleAmount = this.roomManager.room.myPowerCreepsByRole[className].length

    // If there are no creeps for this manager, iterate

    if (!this.roomManager.room.myPowerCreepsByRole[className].length) return

    // Run manager

    managers[className](this.roomManager.room, this.roomManager.room.myPowerCreepsByRole[className])

    // Log className cpu

    LogOps.log(
      `${className}s`,
      `Creeps: ${creepsOfRoleAmount}, CPU: ${(Game.cpu.getUsed() - roleCPUStart).toFixed(
        2,
      )}, CPU Per Creep: ${((Game.cpu.getUsed() - roleCPUStart) / creepsOfRoleAmount).toFixed(2)}`,
      undefined,
    )
  }
}
