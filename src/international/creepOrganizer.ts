import { creepClasses } from 'room/creeps/creepClasses'
import { customColors, remoteRoles, roomLogisticsRoles } from './constants'
import { customLog } from 'utils/logging'
import { collectiveManager, CollectiveManager } from './collective'
import { packCoord } from 'other/codec'
import { statsManager } from './statsManager'
import { creepUtils } from 'room/creeps/creepUtils'

class CreepOrganizer {
    constructor() {}

    public run() {
        // Loop through all of my creeps

        for (const creepName in Memory.creeps) {
            creepUtils.organize(creepName)
        }

        // Initial run after all creeps have been updated
        for (const creepName in Game.creeps) {
            Game.creeps[creepName].initRun()
        }
    }
}

export const creepOrganizer = new CreepOrganizer()
