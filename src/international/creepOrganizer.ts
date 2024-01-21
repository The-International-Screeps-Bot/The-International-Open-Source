import { creepClasses } from 'room/creeps/creepClasses'
import { CreepMemoryKeys, customColors, remoteRoles, roomLogisticsRoles } from './constants'
import { customLog } from 'utils/logging'
import { collectiveManager, CollectiveManager } from './collective'
import { packCoord } from 'other/codec'
import { statsManager } from './statsManager'
import { creepUtils } from 'room/creeps/creepUtils'
import { creepDataManager } from 'room/creeps/creepData'
import { creepProcs } from 'room/creeps/creepProcs'

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

        // Kill the creep if it has no valid commune (we don't know what to do with it)

        const commune = creep.commune
        if (!commune || !commune.controller.my) {
            creep.suicide()
            return
        }

        //

        collectiveManager.creepCount += 1

        creepDataManager.initCreep(creepName)

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

        const customID = creepUtils.customIDCreep(creep)
        collectiveManager.customCreepIDs[customID] = true

        // Add the creep's name to the position in its room

        if (!creep.spawning) creep.room.creepPositions[packCoord(creep.pos)] = creep.name

        if (roomLogisticsRoles.has(role)) {
            creepProcs.updateLogisticsRequests(creep)
        }
        creepProcs.registerInterTickRepairTarget(creep)

        // initialize inter-tick data for the creep if it isn't already
        creepDataManager.data[creep.name] ??= {}

        creep.update()

        // If the creep isn't isDying, organize by its roomFrom and role

        if (!creep.isDying()) commune.creepsFromRoom[role].push(creepName)
        commune.creepsFromRoomAmount += 1
    }
}

export const creepOrganizer = new CreepOrganizer()
