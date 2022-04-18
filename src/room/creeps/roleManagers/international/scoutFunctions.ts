import { Scout } from "../../creepClasses"

Scout.prototype.findScoutTarget = function() {

    const creep = this,
    room = creep.room,

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

        // If the room has memory and a lastScout

        if (Memory.rooms[roomName] && Memory.rooms[roomName].lastScout) {

            // Add it to scoutedRooms and iterate

            scoutedRooms.push(roomName)
            continue
        }

        // Otherwise add it to unscouted rooms

        unscoutedRooms.push(roomName)
    }

    // If unscoutedRooms has elements

    if (unscoutedRooms.length) {

        // Sort unscoutedRooms by their distance from the creep's room, selecting the closest

        const preferedUnscoutedRoom = unscoutedRooms.sort((a, b) => Game.map.getRoomLinearDistance(creep.memory.communeName, a) - Game.map.getRoomLinearDistance(creep.memory.communeName, b))[0]

        // Record the preferedUnscoutedRoom in the creep's memory and stop

        creep.memory.scoutTarget = preferedUnscoutedRoom
        return
    }

    // Otherwise sort the scoutedRooms by their lastScout, selecting the oldest one

    const oldestScoutedRoom = scoutedRooms.sort((a, b) => Memory.rooms[a].lastScout - Memory.rooms[b].lastScout)[0]

    // Record the oldestScoutedRoom in the creep's memory

    creep.memory.scoutTarget = oldestScoutedRoom
}
