import { Scout } from '../creepClasses'
import './scoutFunctions'

export function scoutManager(room: Room, creepsOfRole: string[]) {

    // Loop through the names of the creeps of the role

    for (const creepName of creepsOfRole) {

        // Get the creep using its name

        const creep: Scout = Game.creeps[creepName]

        // If the creep is in the scoutTarget

        if (creep.memory.scoutTarget == room.name) {

            // Get information about the room

            Game.rooms[creep.memory.communeName].findType(room)

            // Assign the room this tick as its scoutTick

            room.memory.scoutTick = Game.time

            // And delete the creep's scoutTarget

            delete creep.memory.scoutTarget
        }

        // If there is no scoutTarget, find one

        if (!creep.memory.scoutTarget) creep.findScoutTarget()

        // Say the scoutTarget

        creep.say(`${creep.memory.scoutTarget}`)

        // If there is a controller and it isn't in safeMode

        if (room.controller && !room.controller.safeMode) {

            // Try to sign the controller, stoping if there is failure

            if (!creep.advancedSignController()) return
        }

        // Try to go to the scoutTarget

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: new RoomPosition(25, 25, creep.memory.scoutTarget), range: 0 },
            avoidImpassibleStructures: true,
            avoidEnemyRanges: true,
            cacheAmount: 50,
            typeWeights: {}
        })
    }
}
