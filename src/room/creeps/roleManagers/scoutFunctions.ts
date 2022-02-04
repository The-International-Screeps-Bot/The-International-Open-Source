import { Scout } from "../creepClasses";

Scout.prototype.findScoutTarget = function() {

    const creep = this
    const room = creep.room

    // Construct storage of exit information

    const scoutedRooms = []
    const unscoutedRooms = []

    // Get information about the room's exits

    const exits = Game.map.describeExits(room.name)

    // Loop through each exit type

    for (const exitType in exits) {

        // Get the roomName using the exitType

        const roomName = exits[exitType as ExitKey]

        // Iterate if the room status isn't normal

        if (Game.map.getRoomStatus(roomName).status != "normal") continue

        // If the room has memory and a scoutTick

        if (Memory.rooms[roomName] && Memory.rooms[roomName].scoutTick) {

            // Add it to scoutedRooms and iterate

            scoutedRooms.push(roomName)
            continue
        }

        // Otherwise add it to unscouted rooms

        unscoutedRooms.push(roomName)
    }

    // If scoutedRooms has elements

    if (scoutedRooms.length > 0) {

        // Sort the scoutedRooms by their scoutTick, selecting the oldest one

        const oldestScoutedRoom = scoutedRooms.sort((a, b) => Memory[a].scoutTick - Memory[b].scoutTick)[0]

        // Record the oldestScoutedRoom in the creep's memory and stop

        creep.memory.scoutTarget = oldestScoutedRoom
        return
    }

    // Otherwise sort unscoutedRooms by their distance from the creep's room, selecting the closest

    const preferedUnscoutedRoom = unscoutedRooms.sort((a, b) => Game.map.getRoomLinearDistance(creep.memory.communeName, a) - Game.map.getRoomLinearDistance(creep.memory.communeName, b))[0]

    // Record the preferedUnscoutedRoom in the creep's memory

    creep.memory.scoutTarget = preferedUnscoutedRoom
}
