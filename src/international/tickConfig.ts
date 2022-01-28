import { constants } from './constants'

/**
 * Configures tick important or tick-only pre-roomManager settings required to run the bot
 */
export function tickConfig() {

    // Memory

    // General

    Memory.communes = []

    Memory.energy = 0

    Memory.boosts = {}

    // CPU

    Memory.cpuUsage = 0
    Memory.cpuLimit = Game.cpu.limit
    Memory.cpuBucket = Game.cpu.bucket

    // Memory memory

    Memory.memoryUsage = Math.floor(RawMemory.get().length / 1000)

    //

    Memory.GCLPercent = (Game.gcl.progress / Game.gcl.progressTotal * 100).toFixed(2)
    Memory.totalGCL = (Math.pow(Game.gcl.level - 1, 2.4) * 1000000 + Game.gcl.progress).toFixed(2)

    Memory.GPLPercent = (Game.gpl.progress / Game.gpl.progressTotal * 100).toFixed(2)
    Memory.totalGPL = (Math.pow(Game.gpl.level - 1, 2) * 1000 + Game.gpl.progress).toFixed(2)

    //

    Memory.energyHarvested = 0
    Memory.controlPoints = 0
    Memory.energySpentOnBuilding = 0
    Memory.energySpentOnRepairing = 0
    Memory.energySpentOnBarricades = 0

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

        room.creepPositions = {}
        room.moveRequests = {}

        //

        for (const role of constants.creepRoles) {

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

        room.creepsFromRoom = {}
        room.creepsFromRoomAmount = 0

        if (!global[room.name].tasksWithoutResponders) global[room.name].tasksWithoutResponders = {}
        if (!global[room.name].tasksWithResponders) global[room.name].tasksWithResponders = {}

        room.storedResources = {}

        room.actionableTowers = room.get('tower')
    }
}
