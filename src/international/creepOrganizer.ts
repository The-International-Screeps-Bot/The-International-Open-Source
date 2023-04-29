import { creepClasses } from 'room/creeps/creepClasses'
import { customColors, remoteRoles, roomLogisticsRoles } from './constants'
import { customLog } from './utils'
import { internationalManager, InternationalManager } from './international'
import { packCoord } from 'other/codec'
import { updateStat } from './statsManager'

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
            updateStat('', statName, cpuUsed, true)
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

        // Organize creep in its room by its role

        creep.room.myCreeps[role].push(creepName)
        creep.room.myCreepsAmount += 1

        internationalManager.customCreepIDs[creep.customID] = true

        // Add the creep's name to the position in its room

        if (!creep.spawning) creep.room.creepPositions[packCoord(creep.pos)] = creep.name

        if (roomLogisticsRoles.has(role)) creep.roomLogisticsRequestManager()

        // Get the commune the creep is from

        const commune = creep.commune
        if (!commune) return

        if (!commune.controller.my) {
            creep.suicide()
            return
        }

        creep.preTickManager()

        // If the creep isn't isDying, organize by its roomFrom and role

        if (!creep.isDying()) commune.creepsFromRoom[role].push(creepName)
        commune.creepsFromRoomAmount += 1
    }
}

export const creepOrganizer = new CreepOrganizer()
