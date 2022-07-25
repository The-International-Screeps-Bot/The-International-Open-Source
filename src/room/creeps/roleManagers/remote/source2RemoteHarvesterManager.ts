import { remoteNeedsIndex } from 'international/constants'
import './remoteHarvesterFunctions'
import { RemoteHarvester } from '../../creepClasses'

export function source2RemoteHarvesterManager(room: Room, creepsOfRole: string[]) {
    for (const creepName of creepsOfRole) {
        const creep: RemoteHarvester = Game.creeps[creepName]

        // Try to find a remote. If one couldn't be found, iterate

        if (!creep.findRemote()) continue

        creep.say(creep.memory.remote)

        // If the creep needs resources

        if (room.name === creep.memory.remote) {
            // Define the creep's sourceName

            const sourceIndex = 1

            // Try to move to source. If creep moved then iterate

            if (creep.travelToSource(sourceIndex)) continue

            // Try to normally harvest. Iterate if creep harvested

            if (creep.advancedHarvestSource(room.sources[sourceIndex])) continue

            continue
        }

        creep.createMoveRequest({
            origin: creep.pos,
            goal: {
                pos: new RoomPosition(25, 25, creep.memory.remote),
                range: 25,
            },
            avoidEnemyRanges: true,
        })
    }
}
