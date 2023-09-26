import { creepClasses } from 'room/creeps/creepClasses'
import { customColors, remoteRoles } from './constants'
import { customLog } from 'utils/logging'
import { collectiveManager, CollectiveManager } from './collective'
import { packCoord } from 'other/codec'
import { powerCreepClasses } from 'room/creeps/powerCreepClasses'
import { statsManager } from './statsManager'

class PowerCreepOrganizer {
    constructor() {}

    public run() {
        // Clear non-existent creeps from memory

        for (const creepName in Memory.powerCreeps) {
            // The creep has been deleted, delete it from memory

            if (!Game.powerCreeps[creepName]) delete Memory.powerCreeps[creepName]
        }

        // Process and organize existing creeps

        for (const creepName in Game.powerCreeps) {
            this.processCreep(creepName)
        }
    }

    private processCreep(creepName: string) {
        let creep = Game.powerCreeps[creepName]

        // If the creep isn't spawned

        if (!creep.ticksToLive) {
            collectiveManager.unspawnedPowerCreepNames.push(creep.name)
            return
        }

        collectiveManager.powerCreepCount

        // Get the creep's role

        const { className } = creep

        // Assign creep a class based on role

        const creepClass = powerCreepClasses[className]
        creep = Game.powerCreeps[creepName] = new creepClass(creep.id)

        // Get the creep's current room and the room it's from

        const { room } = creep

        room.powerCreepPositions[packCoord(creep.pos)] = creep.name

        // Organize creep in its room by its role

        room.myPowerCreeps[className].push(creepName)

        // Record the creep's presence in the room

        room.myPowerCreepsAmount += 1

        creep.initRun()
    }
}

export const powerCreepOrganizer = new PowerCreepOrganizer()
