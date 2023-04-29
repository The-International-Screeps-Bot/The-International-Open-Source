import './creepPrototypes/creepFunctions'
import './creepPrototypes/creepMoveFunctions'

import { creepRoles, customColors } from 'international/constants'
import { customLog } from 'international/utils'
import { RoomManager } from 'room/room'
import { updateStat } from 'international/statsManager'
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
        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        for (const role of creepRoles) this.runManager(role)

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            const cpuUsed2 = this.roomManager.room.myCreepsAmount ? cpuUsed / this.roomManager.room.myCreepsAmount : 0
            customLog('Role Manager', `CPU: ${cpuUsed.toFixed(2)}, CPU Per Creep: ${cpuUsed2.toFixed(2)}`, {
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
            })
            const statName: RoomCommuneStatNames = 'rolmcu'
            const statName2: RoomCommuneStatNames = 'rolmpccu'
            updateStat(room.name, statName, cpuUsed)
            updateStat(room.name, statName2, cpuUsed2)
        }
    }

    private runManager(role: CreepRoles) {
        // If there are no creeps for this manager, iterate

        if (!this.roomManager.room.myCreeps[role].length) return

        const roleCPUStart = Game.cpu.getUsed()

        creepClasses[role].roleManager(this.roomManager.room, this.roomManager.room.myCreeps[role])

        // Log role stats

        const creepsOfRoleAmount = this.roomManager.room.myCreeps[role].length

        customLog(
            `${role}s`,
            `Creeps: ${creepsOfRoleAmount}, CPU: ${(Game.cpu.getUsed() - roleCPUStart).toFixed(2)}, CPU Per Creep: ${(
                (Game.cpu.getUsed() - roleCPUStart) /
                creepsOfRoleAmount
            ).toFixed(2)}`,
            {
                superPosition: 3,
            },
        )
    }
}
