import { allyManager } from 'international/simpleAllies'
import {
    CombatRequestData,
    creepRoles,
    haulerUpdateDefault,
    myColors,
    RemoteNeeds,
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
import { indexOf } from 'lodash'
import { CommuneManager } from 'room/communeManager'

class TickConfig {
    public run() {
        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

        this.configGlobal()
        statsManager.internationalPreTick()
        this.configRooms()
        this.configClaimRequests()
        this.configAllyCreepRequests()
        this.configCombatRequests()

        if (Memory.CPULogging)
            customLog('Tick Config', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.midGrey)
    }
    private configGlobal() {
        // General

        global.communes = new Set()

        // global

        global.constructionSitesCount = Object.keys(Game.constructionSites).length
        global.logs = ``
    }
    private configRooms() {
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

            room.squadRequests = new Set()

            this.configCommune(room)
        }
    }
    private configCommune(room: Room) {
        const { controller } = room
        if (!controller) return

        room.communeManager = global.communeManagers[room.name]

        if (!room.communeManager) {
            room.communeManager = new CommuneManager()
            global.communeManagers[room.name] = room.communeManager
        }

        room.communeManager.update(room)

        if (controller.my) room.memory.T = 'commune'

        if (room.memory.T != 'commune') return

        // Iterate if the controller is not mine

        if (!controller.my) {
            room.memory.T = 'neutral'
            return
        }

        // The room is a commune

        if (!room.memory.combatRequests) room.memory.combatRequests = []

        room.spawnRequests = {}

        if (!room.memory.remotes) room.memory.remotes = []

        // If there is no Hauler Size

        if (!room.memory.MHC) {
            room.memory.MHC = 0
            room.memory.HU = 0
        }

        room.haulerSizeManager()
        room.communeManager.remotesManager.stage1()

        // Add roomName to commune list

        global.communes.add(room.name)

        room.creepsFromRoomWithRemote = {}

        for (let index = room.memory.remotes.length - 1; index >= 0; index -= 1) {
            const remoteName = room.memory.remotes[index]
            room.creepsFromRoomWithRemote[remoteName] = {}
            for (const role of spawnByRoomRemoteRoles) room.creepsFromRoomWithRemote[remoteName][role] = []
        }

        // For each role, construct an array for creepsFromRoom

        room.creepsFromRoom = {}
        for (const role of creepRoles) room.creepsFromRoom[role] = []

        room.creepsFromRoomAmount = 0

        if (!room.memory.stampAnchors) {
            room.memory.stampAnchors = {}

            for (const type in stamps) room.memory.stampAnchors[type as StampTypes] = []
        }

        room.scoutTargets = new Set()

        if (!room.memory.deposits) room.memory.deposits = {}
    }
    private configClaimRequests() {
        let reservedGCL = Game.gcl.level - global.communes.size

        // Subtract the number of claimRequests with responders

        for (const roomName in Memory.claimRequests) {
            if (!Memory.claimRequests[roomName].responder) continue

            reservedGCL -= 1
        }

        const communesForResponding = []

        for (const roomName of global.communes) {
            if (Memory.rooms[roomName].claimRequest) continue

            if (Game.rooms[roomName].energyCapacityAvailable < 650) continue

            communesForResponding.push(roomName)
        }

        // Assign and abandon claimRequests, in order of score

        for (const roomName of internationalManager.claimRequestsByScore) {
            const request = Memory.claimRequests[roomName]

            if (!request) continue

            if (request.abandon > 0) {
                request.abandon -= 1
                continue
            }

            delete request.abandon

            if (request.responder && global.communes.has(request.responder)) continue

            if (!Memory.autoClaim) continue

            // If there is not enough reserved GCL to make a new request

            if (reservedGCL <= 0) continue

            // If the requested room is no longer neutral

            if (Memory.rooms[roomName].T !== 'neutral') {
                // Delete the request

                delete Memory.claimRequests[roomName]
                continue
            }

            const communeName = findClosestRoomName(roomName, communesForResponding)
            if (!communeName) break

            const maxRange = 10

            // Run a more simple and less expensive check, then a more complex and expensive to confirm. If the check fails, abandon the room for some time

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

            communesForResponding.splice(indexOf(communesForResponding, communeName), 1)
        }
    }
    private configAllyCreepRequests() {
        // Decrease abandonment for abandoned allyCreepRequests, and find those that aren't abandoned responders

        for (const roomName in Memory.allyCreepRequests) {
            const request = Memory.allyCreepRequests[roomName]

            if (request.abandon > 0) {
                request.abandon -= 1
                continue
            }

            request.abandon = undefined

            if (request.responder) continue

            const communes = []

            for (const roomName of global.communes) {
                if (Memory.rooms[roomName].allyCreepRequest) continue

                communes.push(roomName)
            }

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
    }
    private configCombatRequests() {
        // Assign and decrease abandon for combatRequests

        for (const roomName in Memory.combatRequests) {
            const request = Memory.combatRequests[roomName]

            if (request.data[CombatRequestData.abandon] > 0) {
                request.data[CombatRequestData.abandon] -= 1
                continue
            }

            if (request.responder) continue

            // Filter communes that don't have the combatRequest target already

            const communes = []

            for (const roomName of global.communes) {
                if (Memory.rooms[roomName].combatRequests.includes(roomName)) continue

                communes.push(roomName)
            }

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
                Memory.combatRequests[roomName].data[CombatRequestData.abandon] = 20000
                continue
            }

            // Otherwise assign the request to the room, and record as such in Memory

            Memory.rooms[communeName].combatRequests.push(roomName)
            Memory.combatRequests[roomName].responder = communeName
        }
    }
}

export const tickConfig = new TickConfig()
