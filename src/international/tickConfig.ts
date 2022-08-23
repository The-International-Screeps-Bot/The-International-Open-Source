import { allyManager } from 'international/simpleAllies'
import {
    creepRoles,
    haulerUpdateDefault,
    myColors,
    remoteHarvesterRoles,
    remoteNeedsIndex,
    spawnByRoomRemoteRoles,
    stamps,
} from './constants'
import {
    advancedFindDistance,
    createPosMap,
    customLog,
    findCarryPartsRequired,
    findClosestRoomName,
} from './generalFunctions'
import { internationalManager, InternationalManager } from './internationalManager'
import { statsManager } from './statsManager'
import '../room/haulerSize'

InternationalManager.prototype.tickConfig = function () {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

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

        room.moveRequests = new Map()
        room.creepPositions = new Map()

        // Single tick properties

        room.myCreeps = {}

        // For each role, construct an array for myCreeps

        for (const role of creepRoles) room.myCreeps[role] = []

        room.myCreepsAmount = 0

        room.roomObjects = {}

        room.creepsOfSourceAmount = []

        for (const index in room.sources) room.creepsOfSourceAmount.push(0)

        const { controller } = room
        if (!controller) continue

        if (controller.my) room.memory.T = 'commune'

        if (room.memory.T != 'commune') continue

        // Iterate if the controller is not mine

        if (!controller.my) {
            room.memory.T = 'neutral'
            continue
        }

        //

        if (!room.memory.attackRequests) room.memory.attackRequests = []

        room.spawnRequests = {}

        if (!room.memory.remotes) room.memory.remotes = []

        room.creepsFromRoomWithRemote = {}

        // If there is no Hauler Size

        if (!room.memory.HS) {
            room.memory.HS = 0
            room.memory.HU = 0
        }

        room.haulerSizeManager()

        room.remotesManager()

        // Add roomName to commune list

        Memory.communes.push(roomName)

        room.creepsFromRoom = {}

        // For each role, construct an array for creepsFromRoom

        for (const role of creepRoles) room.creepsFromRoom[role] = []

        room.creepsFromRoomAmount = 0

        if (!room.memory.stampAnchors) {
            room.memory.stampAnchors = {}

            for (const type in stamps) room.memory.stampAnchors[type as StampTypes] = []
        }

        room.scoutTargets = new Set()

        if (!room.memory.deposits) room.memory.deposits = {}
    }

    let reservedGCL = Game.gcl.level - Memory.communes.length

    reservedGCL -= Object.values(Memory.claimRequests).filter(request => {
        return request.responder
    }).length

    // Assign and abandon claimRequests, in order of score

    for (const roomName of internationalManager.claimRequestsByScore) {
        const request = Memory.claimRequests[roomName]

        if (!request) continue

        if (request.abandon > 0) {
            request.abandon -= 1
            continue
        }

        request.abandon = undefined

        if (request.responder) continue

        if (!Memory.autoClaim) continue

        // If there is not enough reserved GCL to make a new request

        if (reservedGCL <= 0) continue

        const communes = Memory.communes.filter(roomName => {
            return !Memory.rooms[roomName].claimRequest && Game.rooms[roomName].energyCapacityAvailable >= 750
        })

        const communeName = findClosestRoomName(roomName, communes)
        if (!communeName) break

        const maxRange = 10

        // Run a more simple and less expensive check, then a more complex and expensive to confirm

        if (
            Game.map.getRoomLinearDistance(communeName, roomName) > maxRange ||
            advancedFindDistance(communeName, roomName, {
                keeper: Infinity,
                enemy: Infinity,
                ally: Infinity,
            }) > maxRange
        ) {
            Memory.claimRequests[roomName].abandon = 20000
            continue
        }

        // Otherwise assign the request to the room, and record as such in Memory

        Memory.rooms[communeName].claimRequest = roomName
        Memory.claimRequests[roomName].responder = communeName

        reservedGCL -= 1
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

        const communes = Memory.communes.filter(roomName => {
            return !Memory.rooms[roomName].allyCreepRequest
        })

        const communeName = findClosestRoomName(roomName, communes)
        if (!communeName) break

        const maxRange = 25

        // Run a more simple and less expensive check, then a more complex and expensive to confirm

        if (
            Game.map.getRoomLinearDistance(communeName, roomName) > maxRange ||
            advancedFindDistance(communeName, roomName, {
                keeper: Infinity,
                enemy: Infinity,
                ally: Infinity,
            }) > maxRange
        ) {
            Memory.allyCreepRequests[roomName].abandon = 20000
            continue
        }

        // Otherwise assign the request to the room, and record as such in Memory

        Memory.rooms[communeName].allyCreepRequest = roomName
        Memory.allyCreepRequests[roomName].responder = communeName
    }

    // Assign and decrease abandon for attackRequests

    for (const roomName in Memory.attackRequests) {
        const request = Memory.attackRequests[roomName]

        if (request.abandon > 0) {
            request.abandon -= 1
            continue
        }

        if (request.responder) continue

        // Filter communes that don't have the attackRequest target already

        const communes = Memory.communes.filter(roomName => {
            return !Memory.rooms[roomName].attackRequests.includes(roomName)
        })

        const communeName = findClosestRoomName(roomName, communes)
        if (!communeName) break

        const maxRange = 15

        // Run a more simple and less expensive check, then a more complex and expensive to confirm

        if (
            Game.map.getRoomLinearDistance(communeName, roomName) > maxRange ||
            advancedFindDistance(communeName, roomName, {
                keeper: Infinity,
                enemy: Infinity,
                ally: Infinity,
            }) > maxRange
        ) {
            Memory.attackRequests[roomName].abandon = 20000
            continue
        }

        // Otherwise assign the request to the room, and record as such in Memory

        Memory.rooms[communeName].attackRequests.push(roomName)
        Memory.attackRequests[roomName].responder = communeName
    }

    if (Memory.CPULogging)
        customLog('Tick Config', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.midGrey)
}
