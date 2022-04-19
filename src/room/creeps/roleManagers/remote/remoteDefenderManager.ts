import { RemoteDefender } from "room/creeps/creepClasses"
import './remoteDefenderFunctions'

export function remoteDefenderManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: RemoteDefender = Game.creeps[creepName]

        // Try to find a remote, iterating if none were found

        if (!creep.findRemote()) continue

        // Try to attack enemyAttackers, iterating if there are none or one was attacked

        if (creep.advancedAttackAttackers()) continue
    }
}
