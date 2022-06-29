import { allyManager } from 'international/simpleAllies'
import { constants, remoteHarvesterRoles, remoteNeedsIndex, spawnByRoomRemoteRoles, stamps } from './constants'
import { createPackedPosMap, customLog, findCarryPartsRequired } from './generalFunctions'
import { InternationalManager } from './internationalManager'
import { statsManager } from './statsManager'

InternationalManager.prototype.tickConfig = function () {
     // General

     Memory.communes = []

     // global

     global.constructionSitesCount = Object.keys(Game.constructionSites).length
     global.logs = ``

     // Other

     let room
     let controller

     // Configure rooms

     for (const roomName in Game.rooms) {
          room = Game.rooms[roomName]

          controller = room.controller

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

          Memory.stats.energy += room.findStoredResourceAmount(RESOURCE_ENERGY)

          room.creepsFromRoom = {}

          // For each role, construct an array for creepsFromRoom

          for (const role of constants.creepRoles) room.creepsFromRoom[role] = []

          room.creepsFromRoomAmount = 0

          // If there is an existing claimRequest and it's invalid, delete it from the room memory

          if (room.memory.claimRequest && !Memory.claimRequests[room.memory.claimRequest])
               delete room.memory.claimRequest

          if (!room.memory.stampAnchors) {
               room.memory.stampAnchors = {}

               for (const type in stamps) room.memory.stampAnchors[type as StampTypes] = []
          }

          room.scoutTargets = new Set()

          if (!room.memory.deposits) room.memory.deposits = {}
     }

     let claimTarget

     for (const roomName in Memory.claimRequests) {
          claimTarget = Memory.claimRequests[roomName]

          if (claimTarget.abadon > 0) {
               claimTarget.abadon -= 1
               continue
          }

          claimTarget.abadon = undefined
     }
}
