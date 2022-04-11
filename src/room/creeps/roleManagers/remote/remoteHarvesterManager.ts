import { remoteNeedsIndex } from 'international/constants'
import './remoteHarvesterFunctions'
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

        creep.say(creep.memory.remoteName)

        // If the creep needs resources

        if (room.name == creep.memory.remoteName) {

            // If the creep cannot find a sourceName, iterate

            if (!creep.findOptimalRemoteSourceName()) continue

            // Try to move to source. If creep moved then iterate

            if (creep.travelToSource()) continue

            // Get the creeps sourceName

            const sourceName = creep.memory.sourceName

            // Try to normally harvest. Iterate if creep harvested

            if (creep.advancedHarvestSource(room.get(sourceName))) continue

            
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
