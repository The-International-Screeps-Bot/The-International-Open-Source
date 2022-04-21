import { RemoteDefender } from "room/creeps/creepClasses"
import './remoteDefenderFunctions'

export function remoteDefenderManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: RemoteDefender = Game.creeps[creepName]

        // Try to find a remote, iterating if none were found

        if (!creep.findRemote()) continue

        creep.say(creep.memory.remoteName)

        // Try to heal nearby creeps

        creep.advancedHeal()

        // Try to attack enemyAttackers, iterating if there are none or one was attacked

        if (creep.advancedAttackAttackers()) continue

        // Otherwise have the creep recycle

        // If the room is the creep's commune

        if (room.name == creep.memory.communeName) {

            // Advanced recycle and iterate

            creep.advancedRecycle()
            continue
        }

        // Otherwise, have the creep make a moveRequest to its commune

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: new RoomPosition(25, 25, creep.memory.communeName), range: 1 }
        })
    }
}
