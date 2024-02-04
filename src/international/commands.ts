import { RoomNameUtils } from 'room/roomNameUtils'
import { CollectiveManager } from './collective'
import {
  allStructureTypes,
  WorkRequestKeys,
  CombatRequestKeys,
  RoomMemoryKeys,
  RoomTypes,
  Result,
} from '../constants/general'

const importantStructures: StructureConstant[] = [STRUCTURE_SPAWN]

global.clearGlobal = function () {
  // Clear global and stop CPU usage for a tick

  Game.cpu?.halt()
}

/**
 * Delete properties in Memory
 * @param includeSettings Skip settings deletion unless specified
 */
global.clearMemory = function () {
  // Clear all properties in memory

  for (const key in Memory) {
    delete Memory[key as keyof typeof Memory]
  }

  return 'Cleared all of Memory'
}

global.killCreeps = function (roles?) {
  // Cancel spawning in communes

  for (const roomName in Game.rooms) {
    const room = Game.rooms[roomName]

    if (!room.controller || !room.controller.my) continue

    for (const spawnName in Game.spawns) {
      const spawn = Game.spawns[spawnName]
      if (!spawn.spawning) continue

      // If there are specific role requirements and the creep doesn't meet them

      if (roles && !roles.includes(Game.creeps[spawn.spawning.name].role)) continue

      spawn.spawning.cancel()
    }
  }

  const filteredCreeps = Object.values(Game.creeps).filter(creep => {
    return !roles || roles.includes(creep.role)
  })

  let killedCreepCount = 0

  for (const creep of filteredCreeps) if (creep.suicide() === OK) killedCreepCount += 1

  return `Killed an total of ${killedCreepCount} creeps ${roles ? `with the roles ${roles}` : ''}`
}

global.killPowerCreeps = function () {
  let killedCreeps = 0

  for (const creepName in Game.powerCreeps) {
    const creep = Game.powerCreeps[creepName]

    creep.suicide()
    killedCreeps += 1
  }

  return `Killed a total of ${killedCreeps} creeps`
}

global.removeCSites = function (removeInProgress, types?) {
  let removedCSCount = 0

  for (const cSiteID in Game.constructionSites) {
    const cSite = Game.constructionSites[cSiteID]

    if (cSite.progress && removeInProgress) continue

    if (types && !types.includes(cSite.structureType)) continue

    if (cSite.remove() === OK) removedCSCount += 1
  }

  return `Removed a total of ${removedCSCount} construction sites ${
    types ? `with the types ${types}` : ''
  }`
}

global.destroyStructures = function (roomName, types?) {
  if (!roomName) {
    if (CollectiveManager.communes.size > 1) return 'Provide a room name'

    roomName = Array.from(CollectiveManager.communes)[0]
  }

  // Get the room with the roomName

  const room = Game.rooms[roomName]
  if (!room) return `You have no vision in ${roomName}`

  // Count and destroy structures of types

  let destroyedStructureCount = 0
  for (const structureType of allStructureTypes) {
    // If types is constructed and the part isn't in types, iterate

    if (
      (types && !types.includes(structureType)) ||
      (importantStructures.includes(structureType) && !types)
    )
      continue

    // Get the structures of the type and destroy

    const structures = room.roomManager.structures[structureType]
    for (const structure of structures) {
      if (structure.destroy() === OK) destroyedStructureCount += 1
    }
  }

  // Inform the result

  return `Destroyed a total of ${destroyedStructureCount} structures in ${roomName} ${
    types ? `with the types ${types}` : ''
  }`
}

global.destroyCommuneStructures = function (types?) {
  let log = ``
  let destroyedStructureCount: number

  for (const roomName of CollectiveManager.communes) {
    // Get the room with the roomName

    const room = Game.rooms[roomName]

    // Otherwise loop through each structureType

    destroyedStructureCount = 0

    for (const structureType of allStructureTypes) {
      // If types is constructed and the part isn't in types, iterate

      if (
        (types && !types.includes(structureType)) ||
        (importantStructures.includes(structureType) && !types)
      )
        continue

      // Get the structures of the type

      const structures = room.roomManager.structures[structureType]

      // Loop through the structures

      for (const structure of structures) {
        if (structure.destroy() === OK) destroyedStructureCount += 1
      }

      log += `Destroyed a total of ${destroyedStructureCount} structures in ${roomName}
               `
    }
  }

  // Inform the result

  return log + ` ${types ? `with the types ${types}` : ''}`
}

global.claim = function (requestName, communeName, priority = 0, override?: boolean) {
  if (!Memory.rooms[requestName]) return 'No roomMemory for ' + requestName
  if (Memory.rooms[requestName][RoomMemoryKeys.communePlanned] !== Result.success) {
    return 'Planning not completed for ' + requestName
  }

  if (!Memory.workRequests[requestName]) {
    Memory.workRequests[requestName] = {
      [WorkRequestKeys.responder]: communeName,
    }
  }

  const request = Memory.workRequests[requestName]

  request[WorkRequestKeys.priority] = priority
  delete request[WorkRequestKeys.abandon]

  if (communeName) {
    const roomMemory = Memory.rooms[communeName]
    if (!roomMemory) return `No memory for ${communeName}`

    if (roomMemory[RoomMemoryKeys.workRequest]) {
      delete Memory.workRequests[roomMemory[RoomMemoryKeys.workRequest]][WorkRequestKeys.responder]
    }

    roomMemory[RoomMemoryKeys.workRequest] = requestName
    request[WorkRequestKeys.responder] = communeName
  }

  if (override) {
    Memory.rooms[requestName][RoomMemoryKeys.type] = RoomTypes.neutral
    RoomNameUtils.cleanMemory(requestName)
  }

  return `${
    communeName ? `${communeName} is responding to the` : `created`
  } workRequest for ${requestName}`
}

global.deleteWorkRequest = function (roomName) {
  const request = Memory.workRequests[roomName]
  if (!request) return `There is so claim request for ${roomName}`

  if (request[WorkRequestKeys.responder]) {
    delete Memory.rooms[request[WorkRequestKeys.responder]][RoomMemoryKeys.workRequest]
  }

  delete Memory.workRequests[roomName]
  return `Deleted claim request for ${roomName}`
}

global.deleteWorkRequests = function () {
  let deleteCount = 0

  for (const requestName in Memory.workRequests) {
    const request = Memory.workRequests[requestName]

    deleteCount += 1
    if (request[WorkRequestKeys.responder])
      delete Memory.rooms[request[WorkRequestKeys.responder]][RoomMemoryKeys.workRequest]
    delete Memory.workRequests[requestName]
  }

  return `Deleted ${deleteCount} claim requests`
}

global.combat = function (requestName, type, opts, communeName) {
  if (!Memory.combatRequests[requestName]) {
    const request = (Memory.combatRequests[requestName] = {
      [CombatRequestKeys.type]: type || 'attack',
    })
  }

  let request = Memory.combatRequests[requestName]

  request[CombatRequestKeys.abandon] = 0
  request[CombatRequestKeys.inactionTimer] = 0

  Object.assign(request, opts)

  if (communeName) {
    const roomMemory = Memory.rooms[communeName]
    if (!roomMemory) return `No memory for ${communeName}`

    if (roomMemory[RoomMemoryKeys.type] !== RoomTypes.commune)
      return `${communeName} is not of room type commune`

    // Assign values

    request[CombatRequestKeys.responder] = communeName
    if (!roomMemory[RoomMemoryKeys.combatRequests].includes(requestName)) {
      roomMemory[RoomMemoryKeys.combatRequests].push(requestName)
    }
  }

  return `${
    communeName ? `${communeName} is responding to the` : `created`
  } combatRequest for ${requestName}`
}

global.deleteCombatRequest = function (requestName) {
  const request = Memory.combatRequests[requestName]
  if (!request) return 'No combatRequest for that room'

  // If responder, remove from its memory

  const responder = request[CombatRequestKeys.responder]
  if (responder)
    Memory.rooms[responder][RoomMemoryKeys.combatRequests].splice(
      Memory.rooms[responder][RoomMemoryKeys.combatRequests].indexOf(requestName),
      1,
    )

  delete Memory.combatRequests[requestName]

  return `deleted combatRequest for ${requestName}`
}

global.deleteBasePlans = function (roomName) {
  if (!roomName) {
    if (CollectiveManager.communes.size > 1) return 'Provide a room name'

    roomName = Array.from(CollectiveManager.communes)[0]
  }

  const room = Game.rooms[roomName]
  if (!room) return 'No vision in ' + roomName

  delete room.memory[RoomMemoryKeys.communePlanned]
  room.roomManager._basePlans = undefined

  return 'Deleted base plans for ' + roomName
}

global.usedHeap = function () {
  const usedHeap =
    Game.cpu.getHeapStatistics().total_heap_size / Game.cpu.getHeapStatistics().heap_size_limit
  return (usedHeap * 100).toFixed(2) + '%'
}
