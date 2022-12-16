import { creepClasses } from 'room/creeps/creepClasses'
import { customColors, remoteRoles } from './constants'
import { customLog } from './utils'
import { InternationalManager } from './internationalManager'
import { packCoord } from 'other/packrat'
import { globalStatsUpdater } from './statsManager'

class CreepOrganizer {
    constructor() {}

    public run() {
        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging === true) var managerCPUStart = Game.cpu.getUsed()

        // Loop through all of my creeps

        for (const creepName in Memory.creeps) {
            this.processCreep(creepName)
        }

        if (Memory.CPULogging === true) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('Creep Organizer', cpuUsed.toFixed(2), {
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
            })
            const statName: InternationalStatNames = 'cocu'
            globalStatsUpdater('', statName, cpuUsed, true)
        }
    }

    private processCreep(creepName: string) {
        let creep = Game.creeps[creepName]

        // If creep doesn't exist

        if (!creep) {
            // Delete creep from memory and iterate

            delete Memory.creeps[creepName]
            return
        }

        // Get the creep's role

        const { role } = creep
        if (!role || role.startsWith('shard')) return

        // Assign creep a class based on role

        const creepClass = creepClasses[role]
        if (!creepClass) return

        creep = Game.creeps[creepName] = new creepClass(creep.id)

        // Get the creep's current room and the room it's from

        const { room } = creep

        // Organize creep in its room by its role

        room.myCreeps[role].push(creepName)

        // Record the creep's presence in the room

        room.myCreepsAmount += 1

        // Add the creep's name to the position in its room

        if (!creep.spawning) room.creepPositions.set(packCoord(creep.pos), creep.name)

        // Get the commune the creep is from

        const commune = creep.commune

        // If there is not vision in the commune, stop

        if (!commune) return

        if (!commune.controller.my) {
            creep.suicide()
            return
        }

        creep.preTickManager()

        creep.reservationManager()

        // If the creep isn't dying, organize by its roomFrom and role

        if (!creep.dying) commune.creepsFromRoom[role].push(creepName)

        // Record that the creep's existence in its roomFrom

        commune.creepsFromRoomAmount += 1
    }
}

export const creepOrganizer = new CreepOrganizer()
