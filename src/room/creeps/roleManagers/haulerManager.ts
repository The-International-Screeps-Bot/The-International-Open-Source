import './haulerFunctions'

export function haulerManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: Creep = Game.creeps[creepName]

        // If creep has a task

        if (creep.memory.taskID) {

            // Try to filfill task and stop

            creep.fulfillTask()
            continue
        }

        // Try to find a new task

        const findTaskResult = creep.findTask({
            deliver: true,
            pull: true,
        })

        // Stop if the creep wasn't able to find a task

        if (!findTaskResult) continue

        // Otherwise try to fulfill task

        creep.fulfillTask()
    }
}
