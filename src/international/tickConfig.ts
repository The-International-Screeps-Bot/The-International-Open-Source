import { allyManager } from 'room/market/simpleAllies'
import { constants, remoteHarvesterRoles, remoteNeedsIndex, spawnByRoomRemoteRoles } from './constants'
import { createPackedPosMap, customLog, findCarryPartsRequired } from './generalFunctions'

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

        // For each role, construct an array for myCreeps

        for (const role of constants.creepRoles) room.myCreeps[role] = []

        room.myCreepsAmount = 0

        // Assign a position map

        room.creepPositions = createPackedPosMap()

        // Assign a 2d position map

        room.moveRequests = createPackedPosMap(true)

        room.roomObjects = {}

        room.creepsOfSourceAmount = {
            source1: 0,
            source2: 0,
        }

        if (!global[room.name].tasksWithoutResponders) global[room.name].tasksWithoutResponders = {}
        if (!global[room.name].tasksWithResponders) global[room.name].tasksWithResponders = {}

        // Iterate if there isn't a controller

        if (!controller) continue

        // Iterate if the controller is not mine

        if (!controller.my) continue

        // Set type to commune

        room.memory.type = 'commune'

        //

        if (!room.memory.remotes) room.memory.remotes = []

        // Loop through the name of each of the commune's remotes

        for (let index = 0; index < room.memory.remotes.length; index++) {

            // Get the name of the remote using the index

            const roomName = room.memory.remotes[index],

            // Get the room's memory using its name

            roomMemory = Memory.rooms[roomName]

            // If the room isn't a remote, remove it from the remotes array

            if (roomMemory.type != 'remote') room.memory.remotes.splice(index)

            // If needs don't yet exist

            if (!roomMemory.needs) {

                // Construct needs

                roomMemory.needs = []
            }

            // Initialize aspects of needs

            roomMemory.needs[remoteNeedsIndex.remoteReserver] = 1

            // Get the room using the roomName

            const remote = Game.rooms[roomName]

            // If there is visio in the room, the controller is reserved, it's reserved be me, and there is sufficient reservation left

            if (remote &&
                remote.controller.reservation &&
                remote.controller.reservation.username == constants.me &&
                remote.controller.reservation.ticksToEnd >= roomMemory.sourceEfficacies.reduce((a, b) => a + b)) {

                    // Set the reservation need to 0

                    roomMemory.needs[remoteNeedsIndex.remoteReserver] = 0
                }

            roomMemory.needs[remoteNeedsIndex.source1RemoteHarvester] = 3

            roomMemory.needs[remoteNeedsIndex.source2RemoteHarvester] = roomMemory.source2 ? 3 : 0

            roomMemory.needs[remoteNeedsIndex.remoteHauler] = 0
        }

        // Add roomName to commune list

        Memory.communes.push(roomName)

        room.creepsFromRoom = {}

        // For each role, construct an array for creepsFromRoom

        for (const role of constants.creepRoles) room.creepsFromRoom[role] = []

        room.creepsFromRoomAmount = 0

        room.creepsFromRoomWithRemote = {}

        // For each remoteName in the room's recorded remotes

        for (const remoteName of room.memory.remotes) {

            // Intialize an array for this room's creepsFromRoomWithRemote

            room.creepsFromRoomWithRemote[remoteName] = {}

            // For each role, construct an array for the role in creepsFromWithRemote

            for (const role of spawnByRoomRemoteRoles) room.creepsFromRoomWithRemote[remoteName][role] = []
        }

        room.storedResources = {}
    }
}
