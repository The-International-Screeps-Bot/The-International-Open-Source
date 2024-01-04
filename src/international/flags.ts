import { Dashboard, Rectangle, Table } from 'screeps-viz'
import {
  Result,
  RoomLogisticsRequestTypes,
  RoomMemoryKeys,
  RoomTypes,
  WorkRequestKeys,
  customColors,
  ourImpassibleStructuresSet,
} from './constants'
import { collectiveManager } from './collective'
import { CombatRequestTypes } from 'types/internationalRequests'
import { roomNameUtils } from 'room/roomNameUtils'
import { packCoord } from 'other/codec'
import { findObjectWithID, isAlly } from 'utils/utils'
import { customLog } from 'utils/logging'
import { spawnRequestConstructorsByType } from 'room/commune/spawning/spawningStructures'
import { roomUtils } from 'room/roomUtils'

export class FlagManager {
  run() {
    for (const flagName in Game.flags) {
      const flagNameParts = flagName.split(' ')

      if (!this[flagNameParts[0] as keyof FlagManager]) continue
      this[flagNameParts[0] as keyof FlagManager](flagName, flagNameParts)
    }
  }

  /**
   * Tricks typescript into accepting the dynamic function call in run()
   */
  public doNothing(flagName: string, flagNameParts: string[]) {}

  private internationalDataVisuals(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const room = Game.rooms[roomName]
    if (!room) {
      flag.setColor(COLOR_RED)
      return
    }

    flag.setColor(COLOR_GREEN)
    room.roomManager.roomVisualsManager.internationalDataVisuals()
  }

  private incomingTransactions(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const room = Game.rooms[roomName]
    if (!room) {
      flag.setColor(COLOR_RED)
      return
    }

    flag.setColor(COLOR_GREEN)

    const headers = ['sender', '', 'receiver', 'resource', 'amount', 'ticks since']

    const data: any[][] = []

    for (const transaction of Game.market.incomingTransactions) {
      const roomFromMemory = Memory.rooms[transaction.from] || ({} as RoomMemory)
      const roomToMemory = Memory.rooms[transaction.to] || ({} as RoomMemory)

      data.push([
        transaction.from +
          ' (' +
          (roomFromMemory[RoomMemoryKeys.type] === RoomTypes.commune
            ? Memory.me
            : roomFromMemory[RoomMemoryKeys.owner] || 'unknown') +
          ')',
        '-->',
        transaction.to +
          ' (' +
          (roomToMemory[RoomMemoryKeys.type] === RoomTypes.commune
            ? Memory.me
            : roomToMemory[RoomMemoryKeys.owner] || 'unknown') +
          ')',
        transaction.resourceType,
        transaction.amount,
        Game.time - transaction.time,
      ])
    }

    const height = 3 + data.length

    Dashboard({
      config: {
        room: room.roomManager.room.name,
      },
      widgets: [
        {
          pos: {
            x: 1,
            y: 1,
          },
          width: 47,
          height,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: 'Incoming Transactions',
                headers,
              },
            })),
          }),
        },
      ],
    })
  }

  private outgoingTransactions(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const room = Game.rooms[roomName]
    if (!room) {
      flag.setColor(COLOR_RED)
      return
    }

    flag.setColor(COLOR_GREEN)

    const headers = ['sender', '', 'receiver', 'resource', 'amount', 'ticks since']

    const data: any[][] = []

    for (const transaction of Game.market.outgoingTransactions) {
      const roomFromMemory = Memory.rooms[transaction.from] || ({} as RoomMemory)
      const roomToMemory = Memory.rooms[transaction.to] || ({} as RoomMemory)

      data.push([
        transaction.from +
          ' (' +
          (roomFromMemory[RoomMemoryKeys.type] === RoomTypes.commune
            ? Memory.me
            : roomFromMemory[RoomMemoryKeys.owner] || 'unknown') +
          ')',
        '-->',
        transaction.to +
          ' (' +
          (roomToMemory[RoomMemoryKeys.type] === RoomTypes.commune
            ? Memory.me
            : roomToMemory[RoomMemoryKeys.owner] || 'unknown') +
          ')',
        transaction.resourceType,
        transaction.amount,
        Game.time - transaction.time,
      ])
    }

    const height = 3 + data.length

    Dashboard({
      config: {
        room: room.roomManager.room.name,
      },
      widgets: [
        {
          pos: {
            x: 1,
            y: 1,
          },
          width: 47,
          height,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: 'Outgoing Transactions',
                headers,
              },
            })),
          }),
        },
      ],
    })
  }

  private abandonCommune(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const roomMemory = Memory.rooms[roomName]
    if (!roomMemory) {
      flag.setColor(COLOR_RED)
      return
    }

    if (roomMemory[RoomMemoryKeys.type] !== RoomTypes.commune) {
      flag.setColor(COLOR_RED)
      return
    }

    flag.remove()
    roomMemory[RoomMemoryKeys.abandonCommune] = true
  }

  private claim(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const roomMemory = Memory.rooms[roomName]
    const communeName = flagNameParts[2] || undefined
    const score = flagNameParts[3] ? parseInt(flagNameParts[3]) : undefined

    if (!roomMemory) {
      flag.setColor(COLOR_RED)
      return
    }
    if (roomMemory[RoomMemoryKeys.communePlanned] !== true) {
      flag.setColor(COLOR_RED)
      return
    }

    if (communeName) {
      const communeMemory = Memory.rooms[communeName]
      if (!communeMemory) {
        flag.setColor(COLOR_RED)
        return
      }
    }

    global.claim(roomName, communeName, score)

    flag.remove()
  }

  private deleteClaim(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const roomMemory = Memory.rooms[roomName]

    if (!roomMemory) {
      flag.setColor(COLOR_RED)
      return
    }

    global.deleteWorkRequest(roomName)

    flag.remove()
  }

  private combat(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const communeName = flagNameParts[2] || undefined
    const type: CombatRequestTypes = (flagNameParts[3] as CombatRequestTypes) || 'attack'

    flag.setColor(COLOR_RED)
    return

    if (communeName) {
      if (!Memory.rooms[communeName]) {
        flag.setColor(COLOR_RED)
        return
      }
    }

    global.combat(roomName, type, undefined, communeName)
  }

  private attack(flagName: string, flagNameParts: string[]) {
    flagNameParts.push('attack')
    this.combat(flagName, flagNameParts)
  }

  private harass(flagName: string, flagNameParts: string[]) {
    flagNameParts.push('harass')
    this.combat(flagName, flagNameParts)
  }

  private defend(flagName: string, flagNameParts: string[]) {
    flagNameParts.push('defend')
    this.combat(flagName, flagNameParts)
  }

  private deleteCombat(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName

    global.deleteCombatRequest(roomName)

    flag.remove()
  }

  private defenceFloodAnchor(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const room = Game.rooms[roomName]
    if (!room) {
      flag.setColor(COLOR_RED)
      return
    }

    const anchor = room.roomManager.anchor
    if (!anchor) {
      throw Error('no anchor')
    }

    const terrain = Game.map.getRoomTerrain(room.name)
    const rampartPlans = room.roomManager.rampartPlans
    roomNameUtils.floodFillFor(room.name, [anchor], coord => {
      // Ignore terrain that protects us
      if (terrain.get(coord.x, coord.y) === TERRAIN_MASK_WALL) return false

      const planData = rampartPlans.getXY(coord.x, coord.y)
      if (planData) {
        // Filter out non-mincut ramparts
        if (planData.buildForNuke || planData.coversStructure) {
          room.coordVisual(coord.x, coord.y)
          return true
        }

        // Don't flood past mincut ramparts
        return false
      }
      room.coordVisual(coord.x, coord.y)
      // See if there is an enemy creep
      const enemyCreepID = room.roomManager.enemyCreepPositions[packCoord(coord)]
      if (!enemyCreepID) return true

      const enemyCreep = findObjectWithID(enemyCreepID)
      if (isAlly(enemyCreep.owner.username)) return true
      // If it can deal damage, safemode
      if (
        enemyCreep.combatStrength.ranged > 0 ||
        enemyCreep.combatStrength.melee > 0 ||
        enemyCreep.combatStrength.dismantle > 0
      )
        return Result.stop

      return true
    })
  }

  private defenceFloodController(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const room = Game.rooms[roomName]
    if (!room) {
      flag.setColor(COLOR_RED)
      return
    }

    const terrain = Game.map.getRoomTerrain(room.name)
    roomNameUtils.floodFillFor(room.name, [room.controller.pos], (coord, packedCoord, depth) => {
      // See if we should even consider the coord

      // Ignore terrain that protects us
      if (terrain.get(coord.x, coord.y) === TERRAIN_MASK_WALL) return false

      // Don't go out of range 2 from controller
      if (depth > 2) return false

      // Ignore structures that protect us
      if (room.coordHasStructureTypes(coord, ourImpassibleStructuresSet)) return false

      // Past this point we should always add this coord to the next generation
      room.coordVisual(coord.x, coord.y)
      // See if there is an enemy creep
      const enemyCreepID = room.roomManager.enemyCreepPositions[packCoord(coord)]
      if (!enemyCreepID) return true

      const enemyCreep = findObjectWithID(enemyCreepID)
      if (isAlly(enemyCreep.owner.username)) return true
      // We only need to protect our controller from claim creeps
      if (!enemyCreep.parts.claim) return true

      // We identified an enemy claimed near our controller!
      return Result.stop
    })
  }

  private communeSourceVisuals(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const room = Game.rooms[roomName]
    if (!room) {
      flag.setColor(COLOR_RED)
      return
    }

    const roomMemory = Memory.rooms[room.name]
    if (roomMemory[RoomMemoryKeys.type] !== RoomTypes.commune) return

    const sourceIDs = roomMemory[RoomMemoryKeys.communeSources]
    for (let sourceIndex = 0; sourceIndex < sourceIDs.length; sourceIndex++) {
      const source = findObjectWithID(sourceIDs[sourceIndex])
      room.visual.text(sourceIndex.toString(), source.pos)
    }

    const stampAnchors = room.roomManager.stampAnchors
    if (stampAnchors) {
      for (let sourceIndex = 0; sourceIndex < stampAnchors.sourceLink.length; sourceIndex++) {
        const coord = stampAnchors.sourceLink[sourceIndex]
        room.visual.text(sourceIndex.toString(), coord.x, coord.y)
      }
    }
  }

  private communeSourceStructureVisuals(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const room = Game.rooms[roomName]
    if (!room) {
      flag.setColor(COLOR_RED)
      return
    }

    const roomMemory = Memory.rooms[room.name]
    if (roomMemory[RoomMemoryKeys.type] !== RoomTypes.commune) return

    const containers = room.roomManager.sourceContainers
    for (let sourceIndex = 0; sourceIndex < containers.length; sourceIndex++) {
      const container = containers[sourceIndex]
      room.visual.text(sourceIndex.toString(), container.pos)
    }

    const stampAnchors = room.roomManager.stampAnchors
    if (!stampAnchors) return

    customLog('sourceLinks stampAnchors', JSON.stringify(stampAnchors.sourceLink))

    const links = room.communeManager.sourceLinks
    customLog('sourceLinks', links)
    for (let sourceIndex = 0; sourceIndex < links.length; sourceIndex++) {
      const link = links[sourceIndex]
      if (!link) continue
      room.visual.text(sourceIndex.toString(), link.pos)
    }
  }

  private remoteSourceVisuals(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const room = Game.rooms[roomName]
    if (!room) {
      flag.setColor(COLOR_RED)
      return
    }

    const roomMemory = Memory.rooms[room.name]
    if (roomMemory[RoomMemoryKeys.type] !== RoomTypes.remote) return

    const sourceIDs = roomMemory[RoomMemoryKeys.remoteSources]
    for (let sourceIndex = 0; sourceIndex < sourceIDs.length; sourceIndex++) {
      const source = findObjectWithID(sourceIDs[sourceIndex])
      room.visual.text(sourceIndex.toString(), source.pos)
    }
  }

  private calculateDynamicScore(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName

    const dynamicScore = roomNameUtils.findDynamicScore(roomName)
    customLog('dynamic score for ' + roomName, dynamicScore)
  }

  private spawnRequestVisuals(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const room = Game.rooms[roomName]
    if (!room) {
      flag.setColor(COLOR_RED)
      return
    }

    const headers = ['role', 'priority', 'cost', 'parts']
    const data: any[][] = []

    const spawnRequestsArgs = room.communeManager.spawnRequestsManager.run()

    for (const requestArgs of spawnRequestsArgs) {
      const spawnRequests = spawnRequestConstructorsByType[requestArgs.type](room, requestArgs)

      for (const request of spawnRequests) {
        const row: any[] = []
        row.push(requestArgs.role)
        row.push(requestArgs.priority)
        row.push(`${request.cost} / ${room.communeManager.nextSpawnEnergyAvailable}`)

        data.push(row)
      }
    }

    const height = 3 + data.length

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
          height,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: 'Spawn Requests',
                headers,
              },
            })),
          }),
        },
      ],
    })
  }

  private labDataVisuals(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const room = Game.rooms[roomName]
    if (!room) {
      flag.setColor(COLOR_RED)
      return
    }

    const headers = ['output', 'input 1', 'input 2', 'reverse', 'target amount']
    const data: any[][] = []

    const labManager = room.communeManager.labManager
    const row = [
      labManager.outputResource,
      labManager.inputResources[0],
      labManager.inputResources[1],
      labManager.isReverse,
      labManager.targetAmount,
    ]
    data.push(row)

    const height = 3 + data.length

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
          height,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: 'Lab Data',
                headers,
              },
            })),
          }),
        },
      ],
    })
  }

  private labVisuals(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const room = Game.rooms[roomName]
    if (!room) {
      flag.setColor(COLOR_RED)
      return
    }

    const labManager = room.communeManager.labManager

    const inputLabs = labManager.inputLabs
    for (let i = 0; i < inputLabs.length; i++) {
      const lab = inputLabs[i]

      room.visual.resource(labManager.inputResources[i], lab.pos.x, lab.pos.y)
    }

    const outputLabs = labManager.outputLabs
    for (const lab of outputLabs) {

      room.visual.resource(labManager.outputResource, lab.pos.x, lab.pos.y)
    }
  }

  private roomLogisticsDataVisuals(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const room = Game.rooms[roomName]
    if (!room) {
      flag.setColor(COLOR_RED)
      return
    }

    const headers = ['type', 'resourceType', 'amount', 'priority', 'position']
    const data: any[][] = []

    for (const key in room.roomLogisticsRequests) {
      const requestType = key as unknown as RoomLogisticsRequestTypes
      const requests = room.roomLogisticsRequests[requestType]
      for (const ID in requests) {
        const request = requests[ID]
        const row: any[] = [
          request.type,
          request.resourceType,
          request.amount,
          request.priority,
          findObjectWithID(request.targetID).pos,
        ]
        data.push(row)
      }
    }

    const height = 3 + data.length

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
          height,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: 'Room Logistics Requests',
                headers,
              },
            })),
          }),
        },
      ],
    })
  }

  private workRequestVisuals(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const room = Game.rooms[roomName]
    if (!room) {
      flag.setColor(COLOR_RED)
      return
    }

    const headers = ['roomName', 'static score', 'dynamic score', 'responder', 'abandon']
    const data: any[][] = []

    const workRequests = Object.keys(Memory.workRequests).sort((a, b) => {
      const aScore =
        Memory.rooms[a][RoomMemoryKeys.score] + Memory.rooms[a][RoomMemoryKeys.dynamicScore]

      const bScore =
        Memory.rooms[b][RoomMemoryKeys.score] + Memory.rooms[b][RoomMemoryKeys.dynamicScore]

      return aScore - bScore
    })

    for (const requestRoomName of workRequests) {
      const roomMemory = Memory.rooms[requestRoomName]
      const request = Memory.workRequests[requestRoomName]

      const row = [
        requestRoomName,
        roomMemory[RoomMemoryKeys.score],
        roomMemory[RoomMemoryKeys.dynamicScore],
        request[WorkRequestKeys.responder],
        request[WorkRequestKeys.abandon],
      ]
      data.push(row)
    }

    const height = 3 + data.length

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
          height,
          widget: Rectangle({
            data: Table(() => ({
              data,
              config: {
                label: 'Work Requests',
                headers,
              },
            })),
          }),
        },
      ],
    })
  }

  private diagonalCoords(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const room = Game.rooms[roomName]
    if (!room) {
      flag.setColor(COLOR_RED)
      return
    }

    const roomMemory = Memory.rooms[room.name]
    if (!roomMemory || !roomMemory[RoomMemoryKeys.commune]) {
      flag.setColor(COLOR_RED)
      return
    }

    const commune = Game.rooms[roomMemory[RoomMemoryKeys.commune]]
    if (!commune) {
      flag.setColor(COLOR_RED)
      return
    }

    const diagonalCoords = roomNameUtils.diagonalCoords(room.name, commune)
    room.visualizeCoordMap(diagonalCoords)
  }

  private controllerStructure(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const room = Game.rooms[roomName]
    if (!room) {
      flag.setColor(COLOR_RED)
      return
    }

    if (!room.communeManager) {
      flag.setColor(COLOR_RED)
      return
    }

    const controllerStructure = room.communeManager.upgradeStructure
    if (!controllerStructure) {
      const centerUpgradePos = room.roomManager.centerUpgradePos
      room.visual.text('X', centerUpgradePos)
      return
    }

    // There is a controller structure

    room.visual.text('CS', controllerStructure.pos)
  }

  private creepUsedStore(flagName: string, flagNameParts: string[]) {
    const flag = Game.flags[flagName]
    const roomName = flagNameParts[1] || flag.pos.roomName
    const room = Game.rooms[roomName]
    if (!room) {
      flag.setColor(COLOR_RED)
      return
    }

    for (const creep of room.myCreeps) {
      room.visual.text(creep.usedNextStore.toString(), creep.pos)
    }
  }
}

export const flagManager = new FlagManager()
