import { customColors, powerCreepClassNames } from 'international/constants'
import { updateStat } from 'international/statsManager'
import { customLog } from 'international/utils'
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
        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        for (const className of powerCreepClassNames) this.runManager(className)

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            const cpuUsed2 = this.roomManager.room.myCreepsAmount
                ? (Game.cpu.getUsed() - managerCPUStart) / this.roomManager.room.myCreepsAmount
                : 0
            customLog('Power Role Manager', `CPU: ${cpuUsed.toFixed(2)}, CPU Per Creep: ${cpuUsed2.toFixed(2)}`, {
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
            })
            const statName: RoomCommuneStatNames = 'prmcu'
            const statName2: RoomCommuneStatNames = 'prmpccu'
            updateStat(room.name, statName, cpuUsed)
            updateStat(room.name, statName2, cpuUsed2)
        }
    }

    private runManager(className: PowerClassConstant) {
        const roleCPUStart = Game.cpu.getUsed()

        // Get the amount of creeps with the role

        const creepsOfRoleAmount = this.roomManager.room.myPowerCreeps[className].length

        // If there are no creeps for this manager, iterate

        if (!this.roomManager.room.myPowerCreeps[className].length) return

        // Run manager

        managers[className](this.roomManager.room, this.roomManager.room.myPowerCreeps[className])

        // Log className cpu

        customLog(
            `${className}s`,
            `Creeps: ${creepsOfRoleAmount}, CPU: ${(Game.cpu.getUsed() - roleCPUStart).toFixed(2)}, CPU Per Creep: ${(
                (Game.cpu.getUsed() - roleCPUStart) /
                creepsOfRoleAmount
            ).toFixed(2)}`,
            undefined,
        )
    }
}
