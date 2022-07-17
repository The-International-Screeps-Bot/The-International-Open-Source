import { allyManager } from 'international/simpleAllies'
import {
    creepRoles,
    myColors,
    remoteHarvesterRoles,
    remoteNeedsIndex,
    spawnByRoomRemoteRoles,
    stamps,
} from './constants'
import {
    advancedFindDistance,
    createPackedPosMap,
    customLog,
    findCarryPartsRequired,
    findClosestRoomName,
} from './generalFunctions'
import { InternationalManager } from './internationalManager'
import { statsManager } from './statsManager'

InternationalManager.prototype.tickConfig = function () {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.cpuLogging) var managerCPUStart = Game.cpu.getUsed()

    // General

    Memory.communes = []
    statsManager.internationalPreTick()

    // global

    global.constructionSitesCount = Object.keys(Game.constructionSites).length
    global.logs = ``

    // Other

    // Configure rooms

    for (const roomName in Game.rooms) {
        const room = Game.rooms[roomName]

        const { controller } = room

        // Single tick properties

        room.myCreeps = {}

        // For each role, construct an array for myCreeps

        for (const role of creepRoles) room.myCreeps[role] = []

        room.myCreepsAmount = 0

        room.roomObjects = {}

        room.creepsOfSourceAmount = {
            source1: 0,
            source2: 0,
        }

        if (!room.global.tasksWithoutResponders) room.global.tasksWithoutResponders = {}
        if (!room.global.tasksWithResponders) room.global.tasksWithResponders = {}

        if (!controller) continue

        if (controller.my) room.memory.type = 'commune'

        if (room.memory.type != 'commune') continue

        // Iterate if the controller is not mine

        if (!controller.my) {
            delete room.memory.type
            continue
        }

        //

        room.spawnRequests = {}

        if (!room.memory.remotes) room.memory.remotes = []

        room.creepsFromRoomWithRemote = {}

        room.remotesManager()

        // Add roomName to commune list

        Memory.communes.push(roomName)

        room.creepsFromRoom = {}

        // For each role, construct an array for creepsFromRoom

        for (const role of creepRoles) room.creepsFromRoom[role] = []

        room.creepsFromRoomAmount = 0

        // If there is an existing claimRequest and it's invalid, delete it from the room memory

        if (room.memory.claimRequest && !Memory.claimRequests[room.memory.claimRequest]) delete room.memory.claimRequest

        if (!room.memory.stampAnchors) {
            room.memory.stampAnchors = {}

            for (const type in stamps) room.memory.stampAnchors[type as StampTypes] = []
        }

        room.scoutTargets = new Set()

        if (!room.memory.deposits) room.memory.deposits = {}
    }

    // Decrease abandonment for abandoned claimRequests

    for (const roomName in Memory.claimRequests) {
        const request = Memory.claimRequests[roomName]

        if (request.abandon > 0) {
            request.abandon -= 1
            continue
        }

        request.abandon = undefined
    }

    // Decrease abandonment for abandoned allyCreepRequests, and find those that aren't abandoned responders

    for (const roomName in Memory.allyCreepRequests) {
        const request = Memory.allyCreepRequests[roomName]

        if (request.abandon > 0) {
            request.abandon -= 1
            continue
        }

        request.abandon = undefined

        if (request.responder) continue

        const communeName = findClosestRoomName(roomName, Memory.communes)
        if (!communeName) break

        const maxRange = 20

        // Run a more simple and less expensive check, then a more complex and expensive to confirm

        if (
            Game.map.getRoomLinearDistance(communeName, roomName) > maxRange ||
            advancedFindDistance(communeName, roomName, {
                keeper: Infinity,
                enemy: Infinity,
                enemyRemote: Infinity,
                ally: Infinity,
                allyRemote: Infinity,
            }) > maxRange
        ) {
            // If out of range, delete the request

            delete Memory.allyCreepRequests[roomName]
            continue
        }

        // Otherwise assign the request to the room, and record as such in Memory

        Memory.rooms[communeName].allyCreepRequest = roomName
        Memory.allyCreepRequests[roomName].responder = communeName
    }

    if (Memory.cpuLogging)
        customLog('Tick Config', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.midGrey)
}
