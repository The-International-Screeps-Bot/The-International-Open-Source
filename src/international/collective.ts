import { packXYAsNum, randomIntRange, roundTo, Utils } from '../utils/utils'

import {
  WorkRequestKeys,
  mmoShardNames,
  roomDimensions,
  RoomMemoryKeys,
  minerals,
  haulerUpdateDefault,
} from '../constants/general'
import { CommuneUtils } from 'room/commune/communeUtils'

const periodicUpdateInterval = randomIntRange(100, 200)

/**
 * Handles inter room and non-room matters
 */
export class CollectiveManager {
  /**
   * Antifa creeps by combat request name, then by role with an array of creep names
   */
  static creepsByCombatRequest: {
    [requestName: string]: Partial<{ [key in CreepRoles]: string[] }>
  }

  static creepsByHaulRequest: { [requestName: string]: string[] }

  static unspawnedPowerCreepNames: string[]

  static terminalRequests: { [ID: string]: TerminalRequest }

  static tickID: number
  static customCreepIDs: true[]
  static customCreepIDIndex: number

  static internationalDataVisuals: boolean

  static terminalCommunes: string[]

  /**
   * The aggregate number of each mineral nodes we have access to
   */
  static mineralNodes: Partial<{ [key in MineralConstant]: number }>

  /**
   * The name of the room that is safemoded, if there is one
   */
  static safemodedCommuneName: string | undefined
  /**
   * An intra-tick collection of commands we wish to issue
   */
  static myCommands: any[]
  static constructionSiteCount = 0
  static creepCount: number
  static powerCreepCount: number
  /**
   * A string to console log as rich text
   */
  static logs = ''
  /**
   * Room names that have controllers we own
   */
  static communes: Set<string>
  static communesForWorkRequests: Set<string>
  static communesForCombatRequests: Set<string>
  static communesForHaulRequests: Set<string>

  /**
   * Updates values to be present for CollectiveManager tick
   */
  static update() {
    // initalize or re-initialize

    this.creepsByCombatRequest = {}
    this.creepsByHaulRequest = {}
    this.unspawnedPowerCreepNames = []
    this.terminalRequests = {}
    this.terminalCommunes = []

    this.tickID = 0
    this.customCreepIDs = []
    this.customCreepIDIndex = 0
    this.mineralNodes = {}
    for (const mineralType of minerals) {
      this.mineralNodes[mineralType] = 0
    }
    this.myCommands = []
    this.logs = ''
    this.creepCount = 0
    this.powerCreepCount = 0
    this.communes = new Set()
    this.communesForWorkRequests = new Set()
    this.communesForCombatRequests = new Set()
    this.communesForHaulRequests = new Set()

    // delete

    this.safemodedCommuneName = undefined
    this._workRequestsByScore = undefined
    this._defaultMinCacheAmount = undefined
    this.internationalDataVisuals = undefined

    //

    this.updateMinHaulerCost()

    // Run CollectiveManager stuff every so often

    if (Utils.isTickInterval(periodicUpdateInterval)) {
      // delete

      this._funnelOrder = undefined
      this._funnelingRoomNames = undefined
      this._minCredits = undefined
      this._resourcesInStoringStructures = undefined
      this._maxCSitesPerRoom = undefined
    }

    //
  }

  static newCustomCreepID() {
    // Try to use an existing unused ID index

    for (; this.customCreepIDIndex < this.customCreepIDs.length; this.customCreepIDIndex++) {
      if (this.customCreepIDs[this.customCreepIDIndex]) continue

      this.customCreepIDs[this.customCreepIDIndex] = true
      this.customCreepIDIndex += 1
      return this.customCreepIDIndex - 1
    }

    // All previous indexes are being used, add a new index

    this.customCreepIDs.push(true)
    this.customCreepIDIndex += 1
    return this.customCreepIDIndex - 1
  }

  static advancedGeneratePixel() {
    if (!global.settings.pixelGeneration) return

    // Stop if the bot is not running on MMO
    if (!mmoShardNames.has(Game.shard.name)) return

    // Stop if the cpu bucket isn't full
    if (Game.cpu.bucket !== 10000) return

    Game.cpu.generatePixel()
  }

  static updateMinHaulerCost() {
    if (Game.time - Memory.minHaulerCostUpdate < haulerUpdateDefault) return

    // cpu limit is potentially variable if GCL changes
    const targetCPUPercent = (Game.cpu.limit * 0.9) / Game.cpu.limit
    // How far off we are from our ideal cpu usage
    Memory.minHaulerCostError = roundTo(targetCPUPercent - Memory.stats.cpu.usage / Game.cpu.limit, 4)

    Memory.minHaulerCost -= Math.floor((Memory.minHaulerCost * Memory.minHaulerCostError) / 2)

    Memory.minHaulerCost = Math.max(
      Memory.minHaulerCost,
      BODYPART_COST[CARRY] * 2 + BODYPART_COST[MOVE],
    )

    // don't let it exceed the max possible cost by too much (otherwise will take awhile to match delta in some circumstances)
    Memory.minHaulerCost = Math.min(
      Memory.minHaulerCost,
      BODYPART_COST[MOVE] * MAX_CREEP_SIZE * 1.2,
    )

    Memory.minHaulerCostUpdate = Game.time
  }

  static newTickID() {
    return (this.tickID += 1).toString()
  }

  static _minCredits: number
  static get minCredits() {
    if (this._minCredits !== undefined) return this._minCredits

    return (this._minCredits = this.communes.size * 10000)
  }

  static _workRequestsByScore: (string | undefined)[]
  static get workRequestsByScore(): (string | undefined)[] {
    if (this._workRequestsByScore) return this._workRequestsByScore

    return (this._workRequestsByScore = Object.keys(Memory.workRequests).sort(
      (a, b) =>
        (Memory.workRequests[a][WorkRequestKeys.priority] ??
          Memory.rooms[a][RoomMemoryKeys.score] + Memory.rooms[a][RoomMemoryKeys.dynamicScore]) -
        (Memory.workRequests[b][WorkRequestKeys.priority] ??
          Memory.rooms[b][RoomMemoryKeys.score] + Memory.rooms[b][RoomMemoryKeys.dynamicScore]),
    ))
  }

  static _defaultMinCacheAmount: number
  static get defaultMinPathCacheTime() {
    if (this._defaultMinCacheAmount !== undefined) return this._defaultMinCacheAmount

    const avgCPUUsagePercent = Memory.stats.cpu.usage / Game.cpu.limit

    return (this._defaultMinCacheAmount = Math.floor(Math.pow(avgCPUUsagePercent * 10, 2.2)) + 1)
  }

  static _maxCommunes: number
  static get maxCommunes() {
    return (this._maxCommunes = Math.round(Game.cpu.limit / 10))
  }

  static _avgCommunesPerMineral: number
  static get avgCommunesPerMineral() {
    let sum = 0

    for (const mineralType in this.mineralNodes) {
      sum += this.mineralNodes[mineralType as MineralConstant]
    }

    const avg = roundTo(sum / minerals.length, 2)
    return (this._avgCommunesPerMineral = avg)
  }

  static _compoundPriority: Partial<{ [key in MineralCompoundConstant]: number }>
  static get compoundPriority() {
    if (this._compoundPriority) return this._compoundPriority

    this._compoundPriority = {}

    return this._compoundPriority
  }

  static _funnelOrder: string[]
  /**
   * Commune names sorted by funnel priority
   */
  static getFunnelOrder() {
    if (this._funnelOrder) return this._funnelOrder

    let funnelOrder: string[] = []

    // organize RCLs 1-7

    const communesByLevel: { [level: string]: [string, number][] } = {}
    for (let i = 6; i < 8; i++) communesByLevel[i] = []

    for (const roomName of this.communes) {
      const room = Game.rooms[roomName]
      if (!room.terminal) continue

      const { controller } = room
      if (!communesByLevel[controller.level]) continue

      communesByLevel[controller.level].push([
        roomName,
        controller.progressTotal / controller.progress,
      ])
    }

    for (const level in communesByLevel) {
      // Sort by score

      communesByLevel[level].sort((a, b) => {
        return a[1] - b[1]
      })

      funnelOrder = funnelOrder.concat(communesByLevel[level].map(tuple => tuple[0]))
    }

    return (this._funnelOrder = funnelOrder)
  }

  static _funnelingRoomNames: Set<string>
  /**
   * The unordered names of rooms currently being funneled. Does 2 passes.
   * For a room to be in CollectiveManager list, it must be part of a censecutive line starting from index 0.
   * Take an example where x means the room is not wanting to be funneled and y means they are:
   * {y, y, y, x, y}.
   * The last room wants to be funneled, however, only the first 3 rooms will be, excluding the last 2: {y, y, y, x, x}.
   */
  /* static getFunnelingRoomNames() {
    if (this._funnelingRoomNames) return this._funnelingRoomNames


    const funnelOrder = this.getFunnelOrder()
    // Rooms that want to get funneled might not get to be if they aren't in line for funneling
    const funnelWanters = this.getFunnelWanters(funnelOrder)

    const funnelingRoomNames = new Set<string>()

    for (const roomName of funnelOrder) {
      if (!funnelWanters.has(roomName)) {
        break
      }

      // Consider it funneled

      funnelingRoomNames.add(roomName)
    }

    this._funnelingRoomNames = funnelingRoomNames
    return funnelingRoomNames
  } */

  /**
   * Qualifying rooms either want to be funneled, or the room next in line to get funneled wants to be funneled.
   * Take a line where x means the rooms don't independently want to be funneled, and y means they do {x, x, y, y, x}.
   * CollectiveManager function will work from back to front so that if a previous room wants to be funneled, so will the proceeding one.
   * In CollectiveManager example, the set should convert to {y, y, y, y, x}
   */
  /* private static getFunnelWanters(funnelOrder: string[]) {
    const funnelWanters = new Set<string>()
    let previousWantsToBeIndependentlyFunneled: boolean

    // Find what rooms want to get funneled

    for (let i = funnelOrder.length - 1; i >= 0; i -= 1) {
      const roomName = funnelOrder[i]
      const room = Game.rooms[roomName]

      const wantsToBeFunneledIndependent = CommuneUtils.getUpgradeCapacity(room)

      if (!(previousWantsToBeIndependentlyFunneled && wantsToBeFunneledIndependent)) {
        previousWantsToBeIndependentlyFunneled = false
      }

      previousWantsToBeIndependentlyFunneled = wantsToBeFunneledIndependent

      funnelWanters.add(roomName)
    }

    return funnelWanters
  } */

  static getFunnelingRoomNames() {

    const funnelTargets = new Set<string>()
    // How much energy we are allowed to distribute each tick of funneling
    let funnelDistribution = 0
    const funnelTargetQuotas: {[roomName: string]: number} = {}

    for (const roomName of CollectiveManager.communes) {
      const room = Game.rooms[roomName]

      const desiredStrength = CommuneUtils.getDesiredUpgraderStrength(room)
      const maxUpgradeStrength = CommuneUtils.getMaxUpgradeStrength(room)
      // We do not have enough desire
      if (desiredStrength > maxUpgradeStrength) {

        funnelDistribution += desiredStrength - maxUpgradeStrength
        continue
      }

      funnelTargetQuotas[roomName] = maxUpgradeStrength
    }

    if (funnelDistribution === 0) return funnelTargets

    for (const roomName in funnelTargetQuotas) {
      const funnelQuota = funnelTargetQuotas[roomName]

      funnelTargets.add(roomName)

      funnelDistribution -= funnelQuota
      if (funnelDistribution <= 0) break
    }

    return funnelTargets
  }

  static _resourcesInStoringStructures: Partial<{ [key in ResourceConstant]: number }>
  static get resourcesInStoringStructures() {
    if (this._resourcesInStoringStructures) return this._resourcesInStoringStructures

    this._resourcesInStoringStructures = {}

    for (const roomName of this.communes) {
      const room = Game.rooms[roomName]
      const resources = room.roomManager.resourcesInStoringStructures

      for (const key in resources) {
        const resource = key as unknown as ResourceConstant

        if (!this._resourcesInStoringStructures[resource]) {
          this._resourcesInStoringStructures[resource] = resources[resource]
          continue
        }

        this._resourcesInStoringStructures[resource] += resources[resource]
      }
    }

    return this._resourcesInStoringStructures
  }

  static _maxCSitesPerRoom: number
  /**
   * The largest amount of construction sites we can try to have in a room
   */
  static get maxCSitesPerRoom() {
    if (this._maxCSitesPerRoom) return this._maxCSitesPerRoom

    return Math.max(Math.min(MAX_CONSTRUCTION_SITES / this.communes.size, 20), 3)
  }
}
