import { myColors, powerCreepClassNames } from 'international/constants'
import { customLog, randomTick } from 'international/utils'
import { RoomManager } from '../roomManager'

export class EndTickCreepManager {
    roomManager: RoomManager

    constructor(roomManager: RoomManager) {
        this.roomManager = roomManager
    }

    public run() {
        if (!this.roomManager.room.myCreepsAmount) return

        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

        // Power creeps go first

        for (const className of powerCreepClassNames) {

            for (const creepName of this.roomManager.room.myPowerCreeps[className]) {
                const creep = Game.powerCreeps[creepName]

                creep.endTickManager()
                creep.recurseMoveRequest()
            }
        }

        // Normal creeps go second

        for (const role in this.roomManager.room.myCreeps)
            for (const creepName of this.roomManager.room.myCreeps[role as CreepRoles]) {
                const creep = Game.creeps[creepName]

                creep.endTickManager()
                creep.recurseMoveRequest()

                if (Game.time % 2 === 0) {

                    creep.say('MORE', true)
                }
                else {

                    creep.say('MALARKEY', true)
                }
            }

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging)
            customLog(
                'End Tick Creep Manager',
                (Game.cpu.getUsed() - managerCPUStart).toFixed(2),
                undefined,
                myColors.lightGrey,
            )
    }
}
