import { chant, customColors, powerCreepClassNames } from 'international/constants'
import { updateStat } from 'international/statsManager'
import { customLog, randomRange, randomTick } from 'international/utils'
import { RoomManager } from '../room'

export class EndTickCreepManager {
    roomManager: RoomManager

    constructor(roomManager: RoomManager) {
        this.roomManager = roomManager
    }

    public run() {
        const { room } = this.roomManager
        if (!this.roomManager.room.myCreepsAmount) return

        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        // Power creeps go first

        for (const className of powerCreepClassNames) {
            for (const creepName of this.roomManager.room.myPowerCreeps[className]) {
                const creep = Game.powerCreeps[creepName]

                creep.endTickManager()
                creep.recurseMoveRequest()

                if (Memory.creepSay && creep.message.length) creep.say(creep.message)
            }
        }

        // Normal creeps go second

        for (const role in this.roomManager.room.myCreeps) {
            for (const creepName of this.roomManager.room.myCreeps[role as CreepRoles]) {
                const creep = Game.creeps[creepName]

                creep.endTickManager()
                creep.recurseMoveRequest()

                if (Memory.creepSay && creep.message.length) creep.say(creep.message)
            }
        }

        this.runChant()

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('End Tick Creep Manager', cpuUsed.toFixed(2), {
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
            })
            const statName: RoomCommuneStatNames = 'etcmcu'
            updateStat(room.name, statName, cpuUsed)
        }
    }

    /**
     * If enabled and there is a chant this tick, have a random creeps that isn't on an exit say the chant
     */
    private runChant() {
        if (!Memory.creepChant) return

        const currentChant = chant[Memory.chantIndex]
        if (!currentChant) return

        let creeps: (Creep | PowerCreep)[] = this.roomManager.room.find(FIND_MY_POWER_CREEPS, {
            filter: creep => !creep.isOnExit,
        })
        creeps = creeps.concat(
            this.roomManager.room.find(FIND_MY_CREEPS, {
                filter: creep => !creep.isOnExit,
            }),
        )
        if (!creeps.length) return

        creeps[Math.floor(Math.random() * creeps.length)].say(currentChant, true)
    }
}
