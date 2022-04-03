import { remoteNeedsIndex } from 'international/constants'
import { RoomTask } from 'room/roomTasks'
import { RemoteHarvester } from '../../creepClasses'

export function remoteHarvesterManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: RemoteHarvester = Game.creeps[creepName]

        //

        if (!creep.memory.remoteName) {

            for (const roomName in Memory.rooms[creep.memory.communeName].remotes) {

                const roomMemory = Memory.rooms[roomName]

                if (roomMemory.needs[remoteNeedsIndex.remoteHarvester] <= 0) continue

                creep.memory.remoteName = roomName
                roomMemory.needs -= creep.partsOfType('work') * HARVEST_POWER
            }
        }

        // If the creep needs resources

        if (creep.needsResources()) {

            if (creep.room.name == creep.memory.remoteName) {

                const sources: Source[] = room.get('sources'),

                closestSource = creep.pos.findClosestByRange(sources)

                if (creep.pos.getRangeTo(closestSource) > 1) {

                    creep.createMoveRequest({
                        origin: creep.pos,
                        goal: { pos: closestSource.pos, range: 1 },
                        avoidImpassibleStructures: true,
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
                goal: { pos: new RoomPosition(25, 25, creep.memory.remoteName), range: 0 },
                avoidImpassibleStructures: true,
                avoidEnemyRanges: true,
                weightGamebjects: {
                    1: room.get('road')
                }
            })

            continue
        }

        // Otherwise

        if (creep.room.name == creep.memory.communeName) {

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
            goal: { pos: new RoomPosition(25, 25, creep.memory.communeName), range: 0 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
            weightGamebjects: {
                1: room.get('road')
            }
        })
    }
}
