import { allyManager } from 'international/simpleAllies'
import { constants, myColors, remoteHarvesterRoles, remoteNeedsIndex, spawnByRoomRemoteRoles, stamps } from './constants'
import { createPackedPosMap, customLog, findCarryPartsRequired } from './generalFunctions'
import { InternationalManager } from './internationalManager'
import { statsManager } from './statsManager'

let managerCPUStart: number

let roomName
let room
let controller
let role
let type
let claimTarget

InternationalManager.prototype.tickConfig = function () {

     // If CPU logging is enabled, get the CPU used at the start

     if (Memory.cpuLogging) managerCPUStart = Game.cpu.getUsed()

     // General

     Memory.communes = []
     statsManager.internationalPreTick()

     // global

     global.constructionSitesCount = Object.keys(Game.constructionSites).length
     global.logs = ``

     // Other

     // Configure rooms

     for (roomName in Game.rooms) {
          room = Game.rooms[roomName]

          controller = room.controller

          // Single tick properties

          room.myCreeps = {}

          // For each role, construct an array for myCreeps

          for (role of constants.creepRoles) room.myCreeps[role] = []

          room.myCreepsAmount = 0

          if (room.find(FIND_MY_CREEPS).length) {

               // Assign a position map

               room.creepPositions = createPackedPosMap()

               // Assign a 2d position map

               room.moveRequests = createPackedPosMap(true)
          }

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

          for (role of constants.creepRoles) room.creepsFromRoom[role] = []

          room.creepsFromRoomAmount = 0

          // If there is an existing claimRequest and it's invalid, delete it from the room memory

          if (room.memory.claimRequest && !Memory.claimRequests[room.memory.claimRequest])
               delete room.memory.claimRequest

          if (!room.memory.stampAnchors) {
               room.memory.stampAnchors = {}

               for (type in stamps) room.memory.stampAnchors[type as StampTypes] = []
          }

          room.scoutTargets = new Set()

          if (!room.memory.deposits) room.memory.deposits = {}
     }

     for (roomName in Memory.claimRequests) {
          claimTarget = Memory.claimRequests[roomName]

          if (claimTarget.abadon > 0) {
               claimTarget.abadon -= 1
               continue
          }

          claimTarget.abadon = undefined
     }

     if (Memory.cpuLogging)
          customLog(
               'Tick Config',
               (Game.cpu.getUsed() - managerCPUStart).toFixed(2),
               undefined,
               myColors.midGrey,
          )
}
