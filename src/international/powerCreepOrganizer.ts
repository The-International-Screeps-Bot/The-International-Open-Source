import { creepClasses } from 'room/creeps/creepClasses'
import { myColors, remoteRoles } from './constants'
import { customLog } from './utils'
import { internationalManager, InternationalManager } from './internationalManager'
import { packCoord } from 'other/packrat'
import { powerCreepClasses } from 'room/creeps/powerCreepClasses'
import { globalStatsUpdater } from './statsManager'

class PowerCreepOrganizer {
    constructor() {}

    public run() {
        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        // Clear non-existent creeps from memory

        for (const creepName in Memory.powerCreeps) {
            // The creep has been deleted, delete it from memory

            if (!Game.creeps[creepName]) delete Memory.powerCreeps[creepName]
        }

        // Process and organize existing creeps

        for (const creepName in Game.powerCreeps) {
            try {
                this.processCreep(creepName)
            } catch (err) {
                customLog(
                    'Exception processing creep: ' + creepName + err,
                    (err as any).stack,
                    {
                        textColor: myColors.white,
                        bgColor: myColors.red
                    }
                )
            }
        }

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('Power Creep Organizer', cpuUsed.toFixed(2), {
                textColor: myColors.white,
                bgColor: myColors.lightBlue
            })
            const statName: InternationalStatNames = 'pccu'
            globalStatsUpdater('', statName, cpuUsed, true)
        }
    }

    private processCreep(creepName: string) {
        let creep = Game.powerCreeps[creepName]

        // If the creep isn't spawned

        if (!creep.ticksToLive) {
            internationalManager.unspawnedPowerCreepNames.push(creep.name)
            return
        }

        // Get the creep's role

        const { className } = creep

        // Assign creep a class based on role

        const creepClass = powerCreepClasses[className]
        creep = Game.powerCreeps[creepName] = new creepClass(creep.id)

        // Get the creep's current room and the room it's from

        const { room } = creep

        room.powerCreepPositions.set(packCoord(creep.pos), creep.name)

        // Organize creep in its room by its role

        room.myPowerCreeps[className].push(creepName)

        // Record the creep's presence in the room

        room.myPowerCreepsAmount += 1

        creep.preTickManager()
    }
}

export const powerCreepOrganizer = new PowerCreepOrganizer()
