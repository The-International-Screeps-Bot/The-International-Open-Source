import { creepClasses } from 'room/creeps/creepClasses'
import { customColors, remoteRoles, roomLogisticsRoles } from './constants'
import { customLog } from 'utils/logging'
import { collectiveManager, CollectiveManager } from './collective'
import { packCoord } from 'other/codec'
import { statsManager } from './statsManager'
import { creepUtils } from 'room/creeps/creepUtils'
import { creepDataManager } from 'room/creeps/creepData'
import { creepProcs } from 'room/creeps/creepProcs'
import { creepLogiProcs } from 'room/creeps/creepLogiProcs'

export class CreepOrganizer {
    constructor() {}

    public run() {
        // Loop through all of my creeps

        for (const creepName in Memory.creeps) {
            this.organizeCreep(creepName)
        }

        // Initial run after all creeps have been updated
        for (const creepName in Game.creeps) {
            Game.creeps[creepName].initRun()
        }
    }
    private organizeCreep(creepName: string) {

        let creep = Game.creeps[creepName]

        // If creep doesn't exist

        if (!creep) {
            // Delete creep from memory and iterate

            delete Memory.creeps[creepName]
            return
        }

        collectiveManager.creepCount += 1

        // Get the creep's role

        const { role } = creep
        if (!role || role.startsWith('shard')) return

        // Assign creep a class based on role

        const creepClass = creepClasses[role]
        if (!creepClass) return

        creep = Game.creeps[creepName] = new creepClass(creep.id)

        // Organize creep in its room by its role

        creep.room.myCreeps.push(creep)
        creep.room.myCreepsByRole[role].push(creepName)

        collectiveManager.customCreepIDs[creep.customID] = true

        // Add the creep's name to the position in its room

        if (!creep.spawning) creep.room.creepPositions[packCoord(creep.pos)] = creep.name

        if (roomLogisticsRoles.has(role)) {
            creepLogiProcs.updateLogisticsRequests(creep)
        }

        // Get the commune the creep is from

        const commune = creep.commune
        if (!commune) return

        if (!commune.controller.my) {
            creep.suicide()
            return
        }

        // initialize inter-tick data for the creep if it isn't already
        creepDataManager.creepsData[creep.name] ??= {}

        creep.update()

        // If the creep isn't isDying, organize by its roomFrom and role

        if (!creep.isDying()) commune.creepsFromRoom[role].push(creepName)
        commune.creepsFromRoomAmount += 1
    }
}

export const creepOrganizer = new CreepOrganizer()
