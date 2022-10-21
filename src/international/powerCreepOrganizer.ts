import { creepClasses } from 'room/creeps/creepClasses'
import { myColors, remoteRoles } from './constants'
import { customLog } from './utils'
import { InternationalManager } from './internationalManager'
import { packCoord } from 'other/packrat'
import { powerCreepClasses } from 'room/creeps/powerCreepClasses'

class PowerCreepOrganizer {

    constructor() {}

    public run() {
        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

        // Loop through all of my creeps

        for (const creepName in Memory.powerCreeps) {
            try {
                this.processCreep(creepName)
            } catch (err) {
                customLog(
                    'Exception processing creep: ' + creepName + err,
                    (err as any).stack,
                    myColors.white,
                    myColors.red,
                )
            }
        }

        if (Memory.CPULogging)
            customLog('Creep Organizer', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.midGrey)
    }

    private processCreep(creepName: string) {
        let creep = Game.powerCreeps[creepName]

        // If creep doesn't exist

        if (!creep) {
            // Delete creep from memory and iterate

            delete Memory.powerCreeps[creepName]
            return
        }

        // If the creep isn't spawned

        if (!creep.ticksToLive) return

        // Get the creep's role

        const { className } = creep

        // Assign creep a class based on role

        const creepClass = powerCreepClasses[className]
        if (!creepClass) return

        creep = Game.creeps[creepName] = new creepClass(creep.id)

        // Get the creep's current room and the room it's from

        const { room } = creep

        room.powerCreepPositions.set(packCoord(creep.pos), creep.name)

        // Organize creep in its room by its role

        room.myPowerCreeps[className].push(creepName)

        // Record the creep's presence in the room

        room.myCreepsAmount += 1

        creep.preTickManager()
    }
}

export const powerCreepOrganizer = new PowerCreepOrganizer()
