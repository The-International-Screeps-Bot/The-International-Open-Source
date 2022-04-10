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

                if (roomMemory.needs[remoteNeedsIndex.remoteHarvester] <= 0) continue

                creep.memory.remoteName = roomName
                roomMemory.needs[remoteNeedsIndex.remoteHarvester] -= creep.partsOfType(WORK)
                break
            }
        }

        //

        if (!creep.memory.remoteName) continue

        // If the creep needs resources

        if (room.name == creep.memory.remoteName) {

            const sources = room.find(FIND_SOURCES_ACTIVE)
            if (!sources.length) continue

            const closestSource = creep.pos.findClosestByRange(sources)

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
    }
}
