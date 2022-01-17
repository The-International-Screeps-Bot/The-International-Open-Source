import { generalFuncs } from 'international/generalFunctions'
import { Hauler } from '../creepClasses'
import './haulerFunctions'

export function haulerManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: Hauler = Game.creeps[creepName]

        // If creep has a task

        if (global[creep.id] && global[creep.id].respondingTaskIDs && global[creep.id].respondingTaskIDs.length > 0) {

            // Try to filfill task and stop

            creep.fulfillTask()
            continue
        }

        // Try to find a new task

        const findTaskResult = creep.findTask(new Set([
            'transfer',
            'withdraw',
            'pull'
        ]))

        // Stop if the creep wasn't able to find a task

        if (!findTaskResult) continue

        // Otherwise try to fulfill task

        creep.fulfillTask()
    }
}
