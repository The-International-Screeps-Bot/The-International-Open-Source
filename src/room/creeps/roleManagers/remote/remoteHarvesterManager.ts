import { remoteNeedsIndex } from 'international/constants'
import { RoomTask } from 'room/roomTasks'
import { RemoteHarvester } from '../../creepClasses'

export function remoteHarvesterManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: RemoteHarvester = Game.creeps[creepName]

        //

        if (!creep.memory.remoteName) {

            const remoteNamesByEfficacy: string[] = Game.rooms[creep.memory.communeName]?.get('remoteNamesByEfficacy')

            for (const roomName of remoteNamesByEfficacy) {

                const roomMemory = Memory.rooms[roomName]

                if (roomMemory.needs[remoteNeedsIndex.remoteHarvester] >= 6 * roomMemory.sourceEfficacies.length * 2) continue

                creep.memory.remoteName = roomName
                roomMemory.needs[remoteNeedsIndex.remoteHarvester] -= creep.partsOfType('work') * HARVEST_POWER
            }
        }

        // If the creep needs resources

        if (creep.needsResources()) {

            if (room.name == creep.memory.remoteName) {

                const sources = room.find(FIND_SOURCES_ACTIVE),

                closestSource = creep.pos.findClosestByRange(sources)

                if (creep.pos.getRangeTo(closestSource.pos) > 1) {

                    creep.say('⏩')

                    creep.createMoveRequest({
                        origin: creep.pos,
                        goal: { pos: closestSource.pos, range: 1 },
                        avoidEnemyRanges: true,
                        weightGamebjects: {
                            1: room.get('road')
                        }
                    })

                    continue
                }

                creep.advancedHarvestSource(closestSource)
                continue
            }

            creep.createMoveRequest({
                origin: creep.pos,
                goal: { pos: new RoomPosition(25, 25, creep.memory.remoteName), range: 25 },
                avoidEnemyRanges: true,
                weightGamebjects: {
                    1: room.get('road')
                }
            })

            continue
        }

        // Otherwise

        if (room.name == creep.memory.communeName) {

            // If creep has a task

            if (global[creep.id] && global[creep.id].respondingTaskID) {

                // Try to filfill task

                const fulfillTaskResult = creep.fulfillTask()

                // Iterate if the task wasn't fulfilled

                if (!fulfillTaskResult) continue

                // Otherwise find the task

                const task: RoomTask = global[room.name].tasksWithResponders[global[creep.id].respondingTaskID]

                // Delete it

                task.delete()
            }

            // Try to find a new task

            const findTaskResult = creep.findTask(new Set([
                'transfer',
            ]))

            // If a task wasn't found, iterate

            if (!findTaskResult) continue

            // Try to filfill task

            const fulfillTaskResult = creep.fulfillTask()

            // Iterate if the task wasn't fulfilled

            if (!fulfillTaskResult) continue

            // Otherwise find the task

            const task: RoomTask = global[room.name].tasksWithResponders[global[creep.id].respondingTaskID]

            // Delete it and iterate

            task.delete()
            continue
        }

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: new RoomPosition(25, 25, creep.memory.communeName), range: 25 },
            avoidEnemyRanges: true,
            weightGamebjects: {
                1: room.get('road')
            }
        })
    }
}
