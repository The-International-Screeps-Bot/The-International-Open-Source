/**
 * Configures tick important or tick-only pre-roomManager settings required to run the bot
 */
export function tickConfig() {

    //

    // Configure rooms

    for (const roomName in Game.rooms) {

        const room = Game.rooms[roomName]

        const controller = room.controller

        // Add roomName to global if it isn't already there

        if (!global[room.name]) global[room.name] = {}

        // Iterate if there isn't a controller

        if (!controller) continue

        // Iterate if the controller is not mine

        if (!controller.my) continue

        // Add roomName to commune list

        Memory.communes.push(roomName)

        // Single tick properties

        room.myCreeps = {}
        room.creepCount = {}

        //

        for (const role of global.creepRoles) {

            //

            room.myCreeps[role] = []
            room.creepCount[role] = 0
        }

        room.creepsOfSourceAmount = {
            source1: 0,
            source2: 0,
        }

        //

        if (!global[room.name].tasks) global[room.name].tasks = {}
    }
}
