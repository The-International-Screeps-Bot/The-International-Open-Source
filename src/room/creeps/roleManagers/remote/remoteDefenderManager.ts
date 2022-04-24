import { RemoteDefender } from "room/creeps/creepClasses"
import './remoteDefenderFunctions'

export function remoteDefenderManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: RemoteDefender = Game.creeps[creepName]

        // Try to find a remote

        if (!creep.findRemote()) {

            // If the room is the creep's commune

            if (room.name == creep.memory.communeName) {

                // Advanced recycle and iterate

                creep.advancedRecycle()
                continue
            }

            // Otherwise, have the creep make a moveRequest to its commune and iterate

            creep.createMoveRequest({
                origin: creep.pos,
                goal: { pos: new RoomPosition(25, 25, creep.memory.communeName), range: 25 }
            })

            continue
        }

        creep.say(creep.memory.remoteName)

        // Try to heal nearby creeps

        creep.advancedHeal()

        // Try to attack enemyAttackers, iterating if there are none or one was attacked

        if (creep.advancedAttackAttackers()) continue

        // If the creep is its remote

        if (room.name == creep.memory.remoteName) {

            // Otherwise, remove the remote from the creep

            delete creep.memory.remoteName
            continue
        }

        // Otherwise, create a moveRequest to its remote

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: new RoomPosition(25, 25, creep.memory.remoteName), range: 25 }
        })
    }
}
