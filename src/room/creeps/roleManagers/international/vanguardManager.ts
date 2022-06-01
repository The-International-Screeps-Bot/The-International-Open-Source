import { claimRequestNeedsIndex } from 'international/constants'
import { Vanguard } from '../../creepClasses'
import './vanguardFunctions'

export function vanguardManager(room: Room, creepsOfRole: string[]) {
    // Loop through the names of the creeps of the role

    for (const creepName of creepsOfRole) {
        // Get the creep using its name

        const creep: Vanguard = Game.creeps[creepName]

        const claimTarget = Memory.rooms[creep.memory.communeName].claimRequest

        // If the creep has no claim target, stop

        if (!claimTarget) return

        Memory.claimRequests[
            Memory.rooms[creep.memory.communeName].claimRequest
        ].needs[claimRequestNeedsIndex.vanguard] -= creep.partsOfType(WORK)

        creep.say(claimTarget)

        if (room.name === claimTarget) {
            creep.buildRoom()
            continue
        }

        // Otherwise if the creep is not in the claimTarget

        // Move to it

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: new RoomPosition(25, 25, claimTarget), range: 25 },
            avoidEnemyRanges: true,
            cacheAmount: 200,
            typeWeights: {
                enemy: Infinity,
                ally: Infinity,
                keeper: Infinity,
                commune: 1,
                neutral: 1,
                highway: 1,
            },
        })
    }
}
