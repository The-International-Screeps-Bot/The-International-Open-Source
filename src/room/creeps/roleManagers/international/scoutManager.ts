import { Scout } from '../../creepClasses'
import './scoutFunctions'

export function scoutManager(room: Room, creepsOfRole: string[]) {

    // Loop through the names of the creeps of the role

    for (const creepName of creepsOfRole) {

        // Get the creep using its name

        const creep: Scout = Game.creeps[creepName],

            commune = Game.rooms[creep.memory.communeName]

        if (!commune) continue

        // If the creep is in the scoutTarget

        if (creep.memory.scoutTarget == room.name) {

            // Get information about the room

            room.findType(commune)

            // Clean the room's memory

            room.cleanMemory()

            // And delete the creep's scoutTarget

            delete creep.memory.scoutTarget
        }

        // If there is no scoutTarget, find one

        if (!creep.memory.scoutTarget) creep.findScoutTarget()

        // Say the scoutTarget

        creep.say('🔭' + creep.memory.scoutTarget.toString())

        // If there is a controller and it isn't in safeMode

        if (room.controller && !room.controller.safeMode) {

            // Try to sign the controller, iterating if there is success

            if (creep.advancedSignController()) continue
        }

        // Try to go to the scoutTarget

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: new RoomPosition(25, 25, creep.memory.scoutTarget), range: 25 },
            avoidEnemyRanges: true,
            plainCost: 1,
            swampCost: 1,
            cacheAmount: 200
        })
    }
}
