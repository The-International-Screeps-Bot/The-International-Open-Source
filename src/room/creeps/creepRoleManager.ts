import './creepPrototypes/creepFunctions'
import './creepPrototypes/creepMoveFunctions'

import { creepRoles, customColors } from 'international/constants'
import { customLog } from 'utils/logging'
import { RoomManager } from 'room/room'
import { statsManager } from 'international/statsManager'
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

        for (const role of creepRoles) this.runManager(role)
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
            `Creeps: ${creepsOfRoleAmount}, CPU: ${(Game.cpu.getUsed() - roleCPUStart).toFixed(
                2,
            )}, CPU Per Creep: ${((Game.cpu.getUsed() - roleCPUStart) / creepsOfRoleAmount).toFixed(
                2,
            )}`,
            {
                position: 3,
            },
        )
    }
}
