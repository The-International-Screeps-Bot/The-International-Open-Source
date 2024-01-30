import {
  RoomMemoryKeys,
  roomTypesUsedForStats,
  creepRoles,
  powerCreepClassNames,
  RoomLogisticsRequestTypes,
  RoomTypes,
  roomDimensions,
} from 'international/constants'
import { StatsManager } from 'international/stats'
import { Dashboard, Rectangle, Table } from 'screeps-viz'
import { packXYAsNum, randomTick } from 'utils/utils'
import { RoomNameUtils } from './roomNameUtils'
import { CommuneManager } from './commune/commune'
import { CommuneProcs } from './commune/communeProcs'
import { LogisticsProcs } from './logisticsProcs'
import { customLog } from 'utils/logging'
import { unpackCoord } from 'other/codec'
import { HaulerServices } from './creeps/roles/haulerServices'
import { HaulerOps } from './creeps/roles/haulerOps'
import { roomData } from './roomData'

export class RoomOps {
  static update(room: Room) {
    const roomManager = room.roomManager

    delete roomManager._structureUpdate
    delete roomManager.checkedCSiteUpdate
    delete roomManager._communeSources
    delete roomManager._remoteSources
    delete roomManager._mineral
    delete roomManager.checkedCSiteUpdate
    delete roomManager._structures
    delete roomManager._cSites
    delete roomManager._notMyCreeps
    delete roomManager._enemyAttackers
    delete roomManager._myDamagedCreeps
    delete roomManager._myDamagedPowerCreeps
    delete roomManager._allyDamagedCreeps
    roomManager._enemyCreepPositions = undefined
    delete roomManager._notMyConstructionSites
    delete roomManager._allyConstructionSitesByType
    delete roomManager._dismantleTargets
    delete roomManager._destructibleStructures
    delete roomManager._combatStructureTargets
    delete roomManager._remoteNamesByEfficacy
    delete roomManager._remoteSourceIndexesByEfficacy

    roomManager._sourceContainers = undefined
    roomManager._fastFillerContainers = undefined
    roomManager._controllerContainer = undefined
    roomManager._mineralContainer = undefined
    roomManager._fastFillerLink = undefined
    roomManager._hubLink = undefined
    roomManager._droppedEnergy = undefined
    roomManager._droppedResources = undefined
    roomManager._actionableWalls = undefined
    roomManager._quadCostMatrix = undefined
    roomManager._quadBulldozeCostMatrix = undefined
    roomManager._enemyDamageThreat = undefined
    roomManager._enemyThreatCoords = undefined
    roomManager._enemyThreatGoals = undefined
    /* this._flags = undefined */
    roomManager._resourcesInStoringStructures = undefined
    roomManager._unprotectedEnemyCreeps = undefined
    roomManager._exitCoords = undefined
    roomManager._advancedLogistics = undefined
    roomManager._defaultCostMatrix = undefined
    roomManager._totalEnemyCombatStrength = undefined
    roomManager._factory = undefined
    roomManager._powerSpawn = undefined
    roomManager._nuker = undefined
    roomManager._observer = undefined

    if (randomTick()) {
      delete roomManager._nukeTargetCoords
      roomManager.roomLogisticsBlacklistCoords = new Set()
    }

    roomManager.reservedCoords = new Map()

    roomManager.room = room
    const roomMemory = room.memory

    // If it hasn't been scouted for 100~ ticks
    if (Game.time - roomMemory[RoomMemoryKeys.lastScout] > Math.floor(Math.random() * 200)) {
      room.basicScout()
      RoomNameUtils.cleanMemory(room.name)
    }

    const roomType = roomMemory[RoomMemoryKeys.type]
    if (roomTypesUsedForStats.includes(roomType)) {
      StatsManager.roomInitialRun(room.name, roomType)
    }

    room.moveRequests = {}
    room.creepPositions = {}
    room.powerCreepPositions = {}

    // Single tick properties

    room.myCreeps = []
    room.myPowerCreeps = []

    room.myCreepsByRole = {}
    for (const role of creepRoles) room.myCreepsByRole[role] = []

    room.myPowerCreepsByRole = {}
    for (const className of powerCreepClassNames) room.myPowerCreepsByRole[className] = []

    room.powerRequests = {}

    room.creepsOfSource = []
    for (const index in room.find(FIND_SOURCES)) room.creepsOfSource.push([])

    room.squadRequests = new Set()

    room.roomLogisticsRequests = {
      [RoomLogisticsRequestTypes.transfer]: {},
      [RoomLogisticsRequestTypes.withdraw]: {},
      [RoomLogisticsRequestTypes.offer]: {},
      [RoomLogisticsRequestTypes.pickup]: {},
    }

    if (!room.controller) return

    // There is a controller

    if (this.updatePotentialCommune(room) === true) return

    // The room isn't a commune
  }

  /**
   *
   * @returns wether or not the room is a commune
   */
  private static updatePotentialCommune(room: Room): boolean {
    const roomMemory = Memory.rooms[room.name]

    if (!room.controller.my) {
      if (roomMemory[RoomMemoryKeys.type] === RoomTypes.commune) {
        roomMemory[RoomMemoryKeys.type] = RoomTypes.neutral
        RoomNameUtils.cleanMemory(room.name)
      }
      return false
    }

    // If the type isn't a commune, make it so and clean its memory

    if (roomMemory[RoomMemoryKeys.type] !== RoomTypes.commune) {
      roomMemory[RoomMemoryKeys.type] = RoomTypes.commune
      RoomNameUtils.cleanMemory(room.name)
    }

    // If there is no communeManager for the room yet, make one and assign them together

    room.communeManager = CommuneManager.communeManagers[room.name]
    if (!room.communeManager) {
      room.communeManager = new CommuneManager()
      CommuneManager.communeManagers[room.name] = room.communeManager
    }

    CommuneProcs.update(room)
    return true
  }

  static initRun(room: Room) {
    if (room.communeManager) {
      CommuneProcs.initRun(room)
      return
    }
  }

  static run(room: Room) {
    const roomMemory = Memory.rooms[room.name]
    if (roomMemory[RoomMemoryKeys.type] === RoomTypes.commune) {
      CommuneProcs.run(room)
      return
    }

    if (roomMemory[RoomMemoryKeys.type] === RoomTypes.remote) {
      LogisticsProcs.createRemoteContainerLogisticsRequests(room)
      LogisticsProcs.createRemoteDroppedResourceLogisticsRequests(room)
      LogisticsProcs.createRemoteTombstoneLogisticsRequests(room)
      LogisticsProcs.createRemoteRuinLogisticsRequests(room)
    }

    const roomManager = room.roomManager

    roomManager.creepRoleManager.run()
    roomManager.powerCreepRoleManager.run()
    roomManager.endTickCreepManager.run()
    roomManager.roomVisualsManager.run()

    this.test(room)
  }

  private static test(room: Room) {}

  /**
   * Debug
   */
  visualizeReservedCoords(room: Room) {
    const roomManager = room.roomManager

    customLog('reservedCoords', JSON.stringify([...roomManager.reservedCoords]))
    for (const [packedCoord, reserveType] of roomManager.reservedCoords) {
      const coord = unpackCoord(packedCoord)
      room.coordVisual(coord.x, coord.y, `hsl(${200}${reserveType * 50}, 100%, 60%)`)
    }
  }

  static tableVisual(room: Room, title: string, headers: string[], data: string[][]) {
    Dashboard({
      config: {
        room: room.name,
      },
      widgets: [
        {
          pos: {
            x: 1,
            y: 1,
          },
          width: 47,
          height: 3 + data.length,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: title,
                headers,
              },
            })),
          }),
        },
      ],
    })
  }

  /**
   * Creates a new terrain binary: 0 = not wall, 255 = wall.
   * Callers of this function are responsible for caching the data themselves (or not, if preferred).
   */
  static createTerrainBinary(roomName: string) {
    const terrainBinary = new Uint8Array(2500)

    const terrain = Game.map.getRoomTerrain(roomName)

    for (let x = 0; x < roomDimensions; x += 1) {
      for (let y = 0; y < roomDimensions; y += 1) {
        terrainBinary[packXYAsNum(x, y)] = terrain.get(x, y) === TERRAIN_MASK_WALL ? 255 : 0
      }
    }

    return terrainBinary
  }

  /**
   * A temporaly-discrete cached terrain binary. 0 = not wall, 255 = wall
   */
  static getTerrainBinary(roomName: string) {
    const data = roomData[roomName]
    if (data.terrainBinary !== undefined) {
      return data.terrainBinary
    }

    const terrainBinary = this.createTerrainBinary(roomName)

    data.terrainBinary = terrainBinary
    return terrainBinary
  }
}
