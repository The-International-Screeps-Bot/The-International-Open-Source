import { remoteNeedsIndex } from 'international/constants'
import { RoomTask } from 'room/roomTasks'
import { RemoteHarvester } from '../../creepClasses'

export function remoteHarvesterManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: RemoteHarvester = Game.creeps[creepName]

        //

        if (!creep.memory.remoteName) {

            for (const roomName of Memory.rooms[creep.memory.communeName].remotes) {

                const roomMemory = Memory.rooms[roomName]

                if (roomMemory.needs[remoteNeedsIndex.remoteHarvester] >= 10) continue

                creep.memory.remoteName = roomName
                roomMemory.needs[remoteNeedsIndex.remoteHarvester] -= creep.partsOfType('work') * HARVEST_POWER
            }
        }

        // If the creep needs resources

        if (creep.needsResources()) {

            if (room.name == creep.memory.remoteName) {

                const sources: Source[] = room.get('sources'),

                closestSource = creep.pos.findClosestByRange(sources)

                creep.say(creep.pos.getRangeTo(closestSource.pos).toString())

                if (creep.pos.getRangeTo(closestSource.pos) > 1) {

                    creep.say('⏩')

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
                goal: { pos: new RoomPosition(25, 25, creep.memory.remoteName), range: 25 },
                avoidImpassibleStructures: true,
                avoidEnemyRanges: true,
                weightGamebjects: {
                    1: room.get('road')
                }
            })

            continue
        }

        // Otherwise

        if (room.name == creep.memory.communeName) {

            const anchor: RoomPosition = room.get('anchor')

            //

            if (creep.isOnExit() || creep.pos.getRangeTo(anchor) > 12) {

                creep.createMoveRequest({
                    origin: creep.pos,
                    goal: { pos: anchor, range: 8 },
                    avoidImpassibleStructures: true,
                    avoidEnemyRanges: true,
                    weightGamebjects: {
                        1: room.get('road')
                    }
                })

                continue
            }

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
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
            weightGamebjects: {
                1: room.get('road')
            }
        })
    }
}
