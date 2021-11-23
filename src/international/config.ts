/**
Configures features needed to run the bot
*/
export function config() {

    // Configure rooms

    for (const roomName in Game.rooms) {

        const room = Game.rooms[roomName]

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

        // memory properties

        

        // global properties

        if (!global[room.name]) global[room.name] = {}


    }

    // Assign tick-only properties

    global.customLogs = ``
}
