/**
 * Configures tick important or tick-only pre-roomManager settings required to run the bot
 */
export function tickConfig() {

    // Memory

    // General

    Memory.communes = []

    Memory.energy = 0

    Memory.boosts = {}

    Memory.creepCount = 0
    Memory.powerCreepCount = 0

    // CPU

    Memory.cpuUsage = 0
    Memory.cpuLimit = Game.cpu.limit
    Memory.cpuBucket = Game.cpu.bucket

    // Memory memory

    Memory.memorUsage = Math.floor(RawMemory.get().length / 1000)

    // global

    global.constructionSitesCount = Object.keys(Game.constructionSites).length
    global.logs = ``

    // Other

    // Configure rooms

    for (const roomName in Game.rooms) {

        const room = Game.rooms[roomName]

        const controller = room.controller

        // Add roomName to global if it isn't already there

        if (!global[room.name]) global[room.name] = {}

        // Single tick properties

        room.myCreeps = {}
        room.creepCount = {}

        room.storedResources = {}
        room.constructionSites = {}

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

        // Iterate if there isn't a controller

        if (!controller) continue

        // Iterate if the controller is not mine

        if (!controller.my) continue

        // Set type to commune

        room.memory.type = 'commune'

        // Add roomName to commune list

        Memory.communes.push(roomName)

        //

        if (!global[room.name].tasks) global[room.name].tasks = {}

        //

        room.creepsFromRoom = {}
        room.creepsFromRoomAmount = 0

        room.actionableTowers = room.get('tower')
    }
}
