import { RemoteDefender } from "room/creeps/creepClasses"
import './remoteDefenderFunctions'

export function remoteDefenderManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: RemoteDefender = Game.creeps[creepName]

        // Try to find a remote

        if (!creep.findRemote()) {

            // If none were found, have the creep make a moveRequest to its commune and iterate

            creep.createMoveRequest({
                origin: creep.pos,
                goal: { pos: new RoomPosition(25, 25, creep.memory.communeName), range: 1 }
            })

            continue
        }

        creep.say(creep.memory.remoteName)

        // If the creep is its remote

        if (room.name == creep.memory.remoteName) {

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
        }
    }
}
