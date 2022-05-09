import { Scout } from "../../creepClasses"

Scout.prototype.findScoutTarget = function() {

    const creep = this,
        room = creep.room,
        commune = Game.rooms[creep.memory.communeName],

        // Construct storage of exit information

        scoutedRooms: string[] = [],
        unscoutedRooms: string[] = [],

        // Get information about the room's exits

        exits = Game.map.describeExits(room.name)

    // Loop through each exit type

    for (const exitType in exits) {

        // Get the roomName using the exitType

        const roomName = exits[exitType as ExitKey]

        // Iterate if the room statuses aren't the same

        if (Game.map.getRoomStatus(roomName).status != Game.map.getRoomStatus(room.name).status) continue

        // If a scout already has this room as a target

        if (commune.scoutTargets.has(roomName)) continue

        // If the room has memory and a lastScout

        if (Memory.rooms[roomName] && Memory.rooms[roomName].lastScout) {

            // Add it to scoutedRooms and iterate

            scoutedRooms.push(roomName)
            continue
        }

        // Otherwise add it to unscouted rooms

        unscoutedRooms.push(roomName)
    }

    const scoutTarget = unscoutedRooms.length ?
        unscoutedRooms.sort((a, b) => Game.map.getRoomLinearDistance(creep.memory.communeName, a) - Game.map.getRoomLinearDistance(creep.memory.communeName, b))[0] :
        scoutedRooms.sort((a, b) => Memory.rooms[a].lastScout - Memory.rooms[b].lastScout)[0]

    if (!scoutTarget) return

    creep.memory.scoutTarget = scoutTarget
    commune.scoutTargets.add(scoutTarget)
}
