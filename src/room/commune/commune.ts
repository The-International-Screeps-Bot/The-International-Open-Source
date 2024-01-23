import {
  findObjectWithID,
  getRange,
  packAsNum,
  randomTick,
  findLowestScore,
  roundTo,
  forCoordsAroundRange,
  Utils,
} from 'utils/utils'
import './defence'
import './workRequest'
import './combatRequest'
import {
  creepRoles,
  RoomMemoryKeys,
  RoomTypes,
  rampartUpkeepCost,
  RemoteResourcePathTypes,
  ReservedCoordTypes,
  RoomStatsKeys,
} from 'international/constants'
import './factory'
import { LabManager } from './labs'
import './links'
import { RemotesManager } from './remotesManager'
import { WorkRequestManager } from './workRequest'
import { CombatRequestManager } from './combatRequest'
import { DefenceManager } from './defence'
import { HaulRequestManager } from './haulRequestManager'
import { HaulerNeedManager } from './haulerNeed'
import { packCoord, unpackPosAt } from 'other/codec'
import { LinkManager } from './links'
import { FactoryManager } from './factory'
import { SpawnRequestsManager } from './spawning/spawnRequests'
import { CollectiveManager } from 'international/collective'
import { ConstructionManager } from 'room/construction/construction'
import { RoomNameUtils } from 'room/roomNameUtils'
import { LogTypes, customLog } from 'utils/logging'
import { communeProcs } from './communeProcs'
import { StructureUtils } from 'room/structureUtils'
import { LogisticsProcs } from 'room/logisticsProcs'
import { towerProcs } from './towerProcs'
import { SourceProcs } from 'room/sourceProcs'
import { terminalProcs } from './terminal/terminalProcs'
import { SpawningStructureProcs } from './spawning/spawningStructureProcs'
import { observerProcs } from './observerProcs'
import { powerSpawnProcs } from './powerSpawnProcs'

export type ResourceTargets = {
  min: Partial<{ [key in ResourceConstant]: number }>
  max: Partial<{ [key in ResourceConstant]: number }>
}

export class CommuneManager {
  static communeManagers: { [roomName: string]: CommuneManager } = {}

  // Managers

  constructionManager: ConstructionManager
  defenceManager: DefenceManager

  linkManager: LinkManager
  labManager: LabManager
  spawnRequestsManager: SpawnRequestsManager

  remotesManager: RemotesManager

  workRequestManager: WorkRequestManager
  combatRequestManager: CombatRequestManager
  haulRequestManager: HaulRequestManager
  haulerNeedManager: HaulerNeedManager

  factoryManager: FactoryManager

  //

  room: Room
  nextSpawnEnergyAvailable: number
  /**
   * Organized by remote and sourceIndex
   */
  remoteSourceHarvesters: { [remote: string]: string[][] }
  communeHaulers: string[]
  /**
   * The total amount of carry parts for haulers
   */
  haulerCarryParts: number
  /**
   * The total amount of carry parts for haulers presently responding to requests in the commune
   */
  communeHaulerCarryParts: number
  towerAttackTarget: Creep
  /**
   * The carry parts needed to effectively run the commune
   */
  communeHaulerNeed: number
  mineralHarvestStrength: number
  upgradeStrength: number
  remoteResourcePathType: RemoteResourcePathTypes

  constructor() {
    this.constructionManager = new ConstructionManager(this)
    this.defenceManager = new DefenceManager(this)

    this.linkManager = new LinkManager(this)
    this.labManager = new LabManager(this)
    this.spawnRequestsManager = new SpawnRequestsManager(this)

    this.remotesManager = new RemotesManager(this)

    this.workRequestManager = new WorkRequestManager(this)
    this.combatRequestManager = new CombatRequestManager(this)
    this.haulRequestManager = new HaulRequestManager(this)
    this.haulerNeedManager = new HaulerNeedManager(this)

    this.factoryManager = new FactoryManager(this)
  }

  update(room: Room) {
    // non manager

    //

    delete this._minStoredEnergy
    delete this._storingStructures
    delete this._maxCombatRequests
    delete this._defensiveRamparts
    delete this._sourceLinks
    delete this._controllerLink
    delete this.towerAttackTarget
    delete this._actionableSpawningStructures
    delete this._spawningStructuresByPriority
    delete this._spawningStructuresByNeed

    if (randomTick()) {
      delete this._minRampartHits
      delete this._storedEnergyBuildThreshold
    }

    if (Utils.isTickInterval(100)) {
      delete this._upgradeStructure
      delete this._hasSufficientRoads
      delete this._resourceTargets
    }

    this.room = room
    const roomMemory = Memory.rooms[room.name]

    // If we should abandon the room

    if (roomMemory[RoomMemoryKeys.abandonCommune] === true) {
      room.controller.unclaim()
      roomMemory[RoomMemoryKeys.type] = RoomTypes.neutral
      RoomNameUtils.cleanMemory(room.name)

      for (const cSite of room.find(FIND_MY_CONSTRUCTION_SITES)) {
        cSite.remove()
      }
      return
    }

    CollectiveManager.communes.add(room.name)

    if (this.room.controller.safeMode) CollectiveManager.safemodedCommuneName = this.room.name

    if (!roomMemory[RoomMemoryKeys.greatestRCL]) {
      if (CollectiveManager.communes.size <= 1)
        roomMemory[RoomMemoryKeys.greatestRCL] = room.controller.level
      else if (
        room.controller.progress > room.controller.progressTotal ||
        room.find(FIND_MY_STRUCTURES, {
          filter: structure => structure.structureType !== STRUCTURE_CONTROLLER,
        }).length
      ) {
        roomMemory[RoomMemoryKeys.greatestRCL] = 8
      } else roomMemory[RoomMemoryKeys.greatestRCL] = room.controller.level
    } else if (room.controller.level > roomMemory[RoomMemoryKeys.greatestRCL]) {
      roomMemory[RoomMemoryKeys.greatestRCL] = room.controller.level
    }

    this.room.roomManager.communePlanner.attemptPlan(this.room)
    communeProcs.getRCLUpdate(room)

    if (!roomMemory[RoomMemoryKeys.combatRequests]) roomMemory[RoomMemoryKeys.combatRequests] = []
    if (!roomMemory[RoomMemoryKeys.haulRequests]) roomMemory[RoomMemoryKeys.haulRequests] = []

    this.upgradeStrength = 0
    this.mineralHarvestStrength = 0
    this.communeHaulerNeed = 0
    this.nextSpawnEnergyAvailable = room.energyAvailable

    if (!roomMemory[RoomMemoryKeys.remotes]) roomMemory[RoomMemoryKeys.remotes] = []
    if (roomMemory[RoomMemoryKeys.threatened] == undefined) {
      roomMemory[RoomMemoryKeys.threatened] = 0
    }

    room.usedRampartIDs = new Map()

    room.creepsOfRemote = {}
    this.haulerCarryParts = 0
    this.communeHaulerCarryParts = 0
    this.remoteSourceHarvesters = {}
    this.communeHaulers = []

    this.remotesManager.update()

    // For each role, construct an array for creepsFromRoom

    room.creepsFromRoom = {}
    for (const role of creepRoles) room.creepsFromRoom[role] = []

    room.creepsFromRoomAmount = 0

    room.scoutTargets = new Set()

    if (!roomMemory[RoomMemoryKeys.deposits]) roomMemory[RoomMemoryKeys.deposits] = {}

    room.attackingDefenderIDs = new Set()
    room.defenderEnemyTargetsWithDamage = new Map()
    room.defenderEnemyTargetsWithDefender = new Map()

    if (room.terminal && room.controller.level >= 6) {
      CollectiveManager.terminalCommunes.push(room.name)
    }

    CollectiveManager.mineralNodes[this.room.roomManager.mineral.mineralType] += 1
  }

  initRun() {
    this.preTickTest()

    const roomMemory = Memory.rooms[this.room.name]
    if (!roomMemory[RoomMemoryKeys.communePlanned]) return

    this.constructionManager.preTickRun()
    observerProcs.preTickRun(this.room)
    terminalProcs.preTickRun(this.room)
    this.remotesManager.initRun()
    this.haulRequestManager.preTickRun()
    this.workRequestManager.preTickRun()
  }

  run() {
    if (!this.room.memory[RoomMemoryKeys.communePlanned]) return

    this.defenceManager.run()
    towerProcs.run(this.room)
    this.defenceManager.manageThreat()
    this.defenceManager.manageDefenceRequests()

    terminalProcs.run(this.room)

    this.workRequestManager.run()
    this.combatRequestManager.run()
    this.haulRequestManager.run()

    SourceProcs.createPowerTasks(this.room)
    this.remotesManager.run()
    this.haulerNeedManager.run()

    SpawningStructureProcs.createRoomLogisticsRequests(this.room)
    LogisticsProcs.createCommuneStoringStructureLogisticsRequests(this.room)
    this.factoryManager.run()
    LogisticsProcs.createCommuneContainerLogisticsRequests(this.room)
    LogisticsProcs.createCommuneDroppedResourceLogisticsRequests(this.room)
    LogisticsProcs.createCommuneTombstoneLogisticsRequests(this.room)
    LogisticsProcs.createCommuneRuinLogisticsRequests(this.room)
    this.linkManager.run()
    this.labManager.run()
    powerSpawnProcs.run(this.room)
    SpawningStructureProcs.createPowerTasks(this.room)

    this.room.roomManager.creepRoleManager.run()
    this.room.roomManager.powerCreepRoleManager.run()

    communeProcs.tryUpdateMinHaulerCost(this.room)
    SpawningStructureProcs.tryRunSpawning(this.room)

    SpawningStructureProcs.tryRegisterSpawningMovement(this.room)
    this.room.roomManager.endTickCreepManager.run()
    this.room.roomManager.roomVisualsManager.run()

    this.test()
  }

  private preTickTest() {
    return

    let CPUUsed = Game.cpu.getUsed()

    customLog('CPU TEST 1 ' + this.room.name, Game.cpu.getUsed() - CPUUsed, {
      type: LogTypes.info,
    })
  }

  private test() {
    /* this.room.visualizeCostMatrix(this.room.defaultCostMatrix) */

    /*
        const array = new Array(2500)

        for (let i = 0; i < array.length; i++) {
            array[i] = packBasePlanCoord(STRUCTURE_SPAWN, 1)
        }
        */

    return

    let CPUUsed = Game.cpu.getUsed()

    customLog('CPU TEST 1 ' + this.room.name, Game.cpu.getUsed() - CPUUsed, {
      type: LogTypes.info,
    })
  }

  /**
   * Debug
   */
  private visualizeSpawningStructuresByNeed() {
    customLog('spawningStructuresByNeed', this.spawningStructuresByNeed, {
      type: LogTypes.error,
    })
    for (const structure of this.spawningStructuresByNeed) {
      this.room.coordVisual(structure.pos.x, structure.pos.y)
    }
  }

  deleteCombatRequest(requestName: string, index: number) {
    delete Memory.combatRequests[requestName]
    Memory.rooms[this.room.name][RoomMemoryKeys.combatRequests].splice(index, 1)
  }

  removeRemote(remoteName: string, index: number) {
    Memory.rooms[this.room.name][RoomMemoryKeys.remotes].splice(index, 1)

    const remoteMemory = Memory.rooms[remoteName]

    remoteMemory[RoomMemoryKeys.type] = RoomTypes.neutral
    RoomNameUtils.cleanMemory(remoteName)
  }

  findMinRangedAttackCost(minDamage: number = 10) {
    const rawCost =
      (minDamage / RANGED_ATTACK_POWER) * BODYPART_COST[RANGED_ATTACK] +
      (minDamage / RANGED_ATTACK_POWER) * BODYPART_COST[MOVE]
    const combinedCost = BODYPART_COST[RANGED_ATTACK] + BODYPART_COST[MOVE]

    return Math.ceil(rawCost / combinedCost) * combinedCost
  }

  findMinMeleeAttackCost(minDamage: number = 30) {
    const rawCost =
      (minDamage / ATTACK_POWER) * BODYPART_COST[ATTACK] +
      (minDamage / ATTACK_POWER) * BODYPART_COST[MOVE]
    const combinedCost = BODYPART_COST[ATTACK] + BODYPART_COST[MOVE]

    return Math.ceil(rawCost / combinedCost) * combinedCost
  }

  /**
   * Finds how expensive it will be to provide enough heal parts to withstand attacks
   */
  findMinHealCost(minHeal: number = 12) {
    const rawCost =
      (minHeal / HEAL_POWER) * BODYPART_COST[HEAL] + (minHeal / HEAL_POWER) * BODYPART_COST[MOVE]
    const combinedCost = BODYPART_COST[HEAL] + BODYPART_COST[MOVE]

    return Math.ceil(rawCost / combinedCost) * combinedCost
  }

  findMinDismantleCost(minDismantle: number = 0) {
    const rawCost = minDismantle * BODYPART_COST[WORK] + minDismantle * BODYPART_COST[MOVE]
    const combinedCost = BODYPART_COST[WORK] + BODYPART_COST[MOVE]

    return Math.ceil(rawCost / combinedCost) * combinedCost
  }

  get estimatedEnergyIncome() {
    const roomStats = Memory.stats.rooms[this.room.name]

    return roundTo(
      roomStats[RoomStatsKeys.EnergyInputHarvest] +
        roomStats[RoomStatsKeys.RemoteEnergyInputHarvest] +
        roomStats[RoomStatsKeys.EnergyInputBought],
      2,
    )
  }

  private _minStoredEnergy: number

  /**
   * The minimum amount of stored energy the room should only use in emergencies
   */
  get minStoredEnergy() {
    if (this._minStoredEnergy !== undefined) return this._minStoredEnergy

    // Consider the controller level to an exponent and this room's attack threat

    this._minStoredEnergy =
      Math.pow(this.room.controller.level * 6000, 1.06) +
      this.room.memory[RoomMemoryKeys.threatened] * 20

    // If there is a next RCL, Take away some minimum based on how close we are to the next RCL

    const RClCost = this.room.controller.progressTotal
    if (RClCost) {
      this._minStoredEnergy -= Math.pow(
        (Math.min(this.room.controller.progress, RClCost) / RClCost) * 20,
        3.35,
      )
    }
    return (this._minStoredEnergy = Math.floor(this._minStoredEnergy))
  }

  private _targetEnergy: number
  /**
   * The amount of energy the room wants to have
   */
  get targetEnergy() {
    // Consider the controller level to an exponent and this room's attack threat

    this._targetEnergy =
      Math.pow(this.room.controller.level * 6000, 1.06) +
      this.room.memory[RoomMemoryKeys.threatened] * 20

    // If there is a next RCL, Take away some minimum based on how close we are to the next RCL

    const RClCost = this.room.controller.progressTotal
    if (RClCost) {
      this._targetEnergy -= Math.pow(
        (Math.min(this.room.controller.progress, RClCost) / RClCost) * 20,
        3.35,
      )
    }

    return this._targetEnergy
  }

  get storedEnergyUpgradeThreshold() {
    /*
        if (this.room.terminal && this.room.controller.level >= 6) {


        }
 */
    return Math.floor(this.minStoredEnergy * 1.3)
  }

  private _storedEnergyBuildThreshold: number
  get storedEnergyBuildThreshold() {
    this._storedEnergyBuildThreshold = Math.floor(
      Math.min(
        1000 +
          findLowestScore(
            this.room.find(FIND_MY_CONSTRUCTION_SITES),
            cSite => cSite.progressTotal - cSite.progress,
          ) *
            10,
        this.minStoredEnergy * 1.2,
      ),
    )

    return this._storedEnergyBuildThreshold
  }

  get rampartsMaintenanceCost() {
    return roundTo(this.room.roomManager.structures.rampart.length * rampartUpkeepCost, 2)
  }

  private _minRampartHits: number

  get minRampartHits() {
    if (this._minRampartHits !== undefined) return this._minRampartHits

    const level = this.room.controller.level

    return (this._minRampartHits =
      Math.min(
        Math.floor(
          Math.pow((level - 3) * 50, 2.5) +
            Memory.rooms[this.room.name][RoomMemoryKeys.threatened] * 5 * Math.pow(level, 2),
        ),
        RAMPART_HITS_MAX[level] * 0.9,
      ) || 20000)
  }

  private _storingStructures: (StructureStorage | StructureTerminal)[]

  /**
   * Storing structures - storage or teirmal - filtered to for defined and RCL active
   */
  get storingStructures() {
    if (this._storingStructures) return this._storingStructures

    const storingStructures: (StructureStorage | StructureTerminal)[] = []

    if (this.room.storage && this.room.controller.level >= 4)
      storingStructures.push(this.room.storage)
    if (this.room.terminal && this.room.controller.level >= 6)
      storingStructures.push(this.room.terminal)

    return (this._storingStructures = storingStructures)
  }

  get storingStructuresCapacity() {
    let capacity = 0
    if (this.room.storage) capacity += this.room.storage.store.getCapacity()
    if (this.room.terminal) capacity += this.room.terminal.store.getCapacity()
    return capacity
  }

  private _maxCombatRequests: number

  /**
   * The largest amount of combat requests the room can respond to
   */
  get maxCombatRequests() {
    if (this._maxCombatRequests !== undefined) return this._maxCombatRequests

    /* return (this._maxCombatRequests =
            (this.room.roomManager.resourcesInStoringStructures.energy - this.minStoredEnergy) /
            (5000 + this.room.controller.level * 1000)) */
    return (this._maxCombatRequests =
      this.room.roomManager.resourcesInStoringStructures.energy /
      (10000 + this.room.controller.level * 3000))
  }

  /**
   * Wether builders should ask for resources instead of seeking them out themselves
   */
  get buildersMakeRequests() {
    // Only set true if there are no viable storing structures

    return (
      !this.room.roomManager.fastFillerContainers.length &&
      !this.room.storage &&
      !this.room.terminal
    )
  }

  /**
   * The max upgrade strength when we have no local storing structure
   */
  findNudeMaxUpgradeStrength() {
    return 100
  }

  private _hasSufficientRoads: boolean
  /**
   * Informs wether we have sufficient roads compared to the roadQuota for our RCL
   */
  get hasSufficientRoads() {
    /* if (this._hasSufficientRoads !== undefined) return this._hasSufficientRoads */

    const roomMemory = Memory.rooms[this.room.name]
    const RCLIndex = this.room.controller.level - 1
    // Try one RCL below, though propagate to the present RCL if there is no roadQuota for the previous RCL
    const minRoads =
      roomMemory[RoomMemoryKeys.roadQuota][RCLIndex - 1] ||
      roomMemory[RoomMemoryKeys.roadQuota][RCLIndex]
    if (minRoads === 0) return false

    const roads = this.room.roomManager.structures.road.length

    // Make sure we have 90% of the intended roads amount
    return (this._hasSufficientRoads = roads >= minRoads * 0.9)
  }

  private _upgradeStructure: AnyStoreStructure | false
  get upgradeStructure() {
    if (this._upgradeStructure !== undefined) return this._upgradeStructure

    // We can't use a structure

    const controllerLevel = this.room.controller.level
    if (controllerLevel < 2) return (this._upgradeStructure = false)

    // We can use containers

    if (controllerLevel < 5) {
      return (this._upgradeStructure = this.room.roomManager.controllerContainer)
    }

    // We can use links

    const controllerLink = this.controllerLink
    if (!controllerLink || !StructureUtils.isRCLActionable(controllerLink)) return false

    const hubLink = this.room.roomManager.hubLink
    if (!hubLink || !StructureUtils.isRCLActionable(hubLink)) return false

    return (this._upgradeStructure = controllerLink)
  }

  private _structureTypesByBuildPriority: BuildableStructureConstant[]
  get structureTypesByBuildPriority() {
    if (this._structureTypesByBuildPriority) return this._structureTypesByBuildPriority

    if (!this.room.roomManager.fastFillerContainers.length) {
      return (this._structureTypesByBuildPriority = [
        STRUCTURE_RAMPART,
        STRUCTURE_WALL,
        STRUCTURE_SPAWN,
        STRUCTURE_CONTAINER,
        STRUCTURE_EXTENSION,
        STRUCTURE_ROAD,
        STRUCTURE_STORAGE,
        STRUCTURE_TOWER,
        STRUCTURE_TERMINAL,
        STRUCTURE_LINK,
        STRUCTURE_EXTRACTOR,
        STRUCTURE_LAB,
        STRUCTURE_FACTORY,
        STRUCTURE_POWER_SPAWN,
        STRUCTURE_NUKER,
        STRUCTURE_OBSERVER,
      ])
    }

    this._structureTypesByBuildPriority = [
      STRUCTURE_RAMPART,
      STRUCTURE_WALL,
      STRUCTURE_SPAWN,
      STRUCTURE_EXTENSION,
      STRUCTURE_CONTAINER,
      STRUCTURE_ROAD,
      STRUCTURE_STORAGE,
      STRUCTURE_TOWER,
      STRUCTURE_TERMINAL,
      STRUCTURE_LINK,
      STRUCTURE_EXTRACTOR,
      STRUCTURE_LAB,
      STRUCTURE_FACTORY,
      STRUCTURE_POWER_SPAWN,
      STRUCTURE_NUKER,
      STRUCTURE_OBSERVER,
    ]

    return this._structureTypesByBuildPriority
  }

  /**
   * When the room needs to upgrade at high priority to remove the downgrade timer
   */
  get controllerDowngradeUpgradeThreshold() {
    return Math.floor(CONTROLLER_DOWNGRADE[this.room.controller.level] * 0.75)
  }

  private _defensiveRamparts: StructureRampart[]
  /**
   * This should be cached inter-tick as IDs
   */
  get defensiveRamparts() {
    if (this._defensiveRamparts) return this._defensiveRamparts

    const ramparts: StructureRampart[] = []

    const stampAnchors = this.room.roomManager.stampAnchors
    if (!stampAnchors) throw Error('No stampAnchors for defensive ramparts')

    const minCutCoords = new Set(stampAnchors.minCutRampart.map(coord => packCoord(coord)))

    for (const structure of this.room.roomManager.structures.rampart) {
      if (!minCutCoords.has(packCoord(structure.pos))) continue

      ramparts.push(structure)
    }

    return (this._defensiveRamparts = ramparts)
  }

  /**
   * Prescriptive of if we desire a second mincut layer
   */
  get buildSecondMincutLayer() {
    const buildSecondMincutLayer =
      Memory.rooms[this.room.name][RoomMemoryKeys.threatened] >
        Math.floor(Math.pow(this.room.controller.level * 30, 1.63)) &&
      this.room.towerInferiority !== true

    return buildSecondMincutLayer
  }

  sourceLinkIDs: (Id<StructureLink> | false)[]
  private _sourceLinks: (StructureLink | false)[]
  get sourceLinks() {
    if (this._sourceLinks) return this._sourceLinks

    // If we have cached links, convert them into false | StructureLink
    if (this.sourceLinkIDs) {
      const links: (StructureLink | false)[] = []
      for (const ID of this.sourceLinkIDs) {
        if (!ID) {
          links.push(false)
          continue
        }

        const link = findObjectWithID(ID)
        links.push(link)
      }

      return (this._sourceLinks = links)
    }

    const stampAnchors = this.room.roomManager.stampAnchors
    if (!stampAnchors) throw Error('no stampAnchors for sourceLinks in ' + this.room.name)

    const links: (StructureLink | false)[] = []
    this.sourceLinkIDs = []

    for (const coord of stampAnchors.sourceLink) {
      const structure = this.room.findStructureAtCoord(
        coord,
        structure => structure.structureType === STRUCTURE_LINK,
      ) as StructureLink | false

      if (structure) {
        links.push(structure)
        this.sourceLinkIDs.push(structure.id)
        continue
      }

      links.push(false)
      this.sourceLinkIDs.push(false)
    }

    return (this._sourceLinks = links)
  }

  controllerLinkID: Id<StructureLink>
  private _controllerLink: StructureLink | false
  get controllerLink() {
    if (this._controllerLink !== undefined) return this._controllerLink

    if (this.controllerLinkID) {
      const structure = findObjectWithID(this.controllerLinkID)
      if (structure) return (this._controllerLink = structure)
    }

    this._controllerLink = this.room.findStructureAtCoord(
      this.room.roomManager.centerUpgradePos,
      structure => structure.structureType === STRUCTURE_LINK,
    ) as StructureLink | false
    if (!this._controllerLink) {
      return this._controllerLink
    }

    this.controllerLinkID = this._controllerLink.id
    return this._controllerLink
  }

  _fastFillerSpawnEnergyCapacity: number
  get fastFillerSpawnEnergyCapacity() {
    if (this._fastFillerSpawnEnergyCapacity && !this.room.roomManager.structureUpdate)
      return this._fastFillerSpawnEnergyCapacity

    const anchor = this.room.roomManager.anchor
    if (!anchor) throw Error('no anchor for fastFillerSpawnEnergyCapacity ' + this.room)

    let fastFillerSpawnEnergyCapacity = 0

    for (const structure of this.actionableSpawningStructures) {
      if (!StructureUtils.isRCLActionable(structure)) continue
      // Outside of the fastFiller
      if (getRange(structure.pos, anchor) > 2) continue

      fastFillerSpawnEnergyCapacity += structure.store.getCapacity(RESOURCE_ENERGY)
    }

    return (this._fastFillerSpawnEnergyCapacity = fastFillerSpawnEnergyCapacity)
  }

  actionableSpawningStructuresIDs: Id<StructureSpawn | StructureExtension>[]
  _actionableSpawningStructures: SpawningStructures
  /**
   * RCL actionable spawns and extensions
   */
  get actionableSpawningStructures() {
    if (this._actionableSpawningStructures) return this._actionableSpawningStructures

    if (this.actionableSpawningStructuresIDs) {
      return (this._actionableSpawningStructures = this.actionableSpawningStructuresIDs.map(ID =>
        findObjectWithID(ID),
      ))
    }

    const structures = this.room.roomManager.structures

    let actionableSpawningStructures: SpawningStructures = structures.spawn
    actionableSpawningStructures = actionableSpawningStructures.concat(structures.extension)
    actionableSpawningStructures = actionableSpawningStructures.filter(structure =>
      StructureUtils.isRCLActionable(structure),
    )

    this.actionableSpawningStructuresIDs = actionableSpawningStructures.map(
      structure => structure.id,
    )
    return (this._actionableSpawningStructures = actionableSpawningStructures)
  }

  spawningStructuresByPriorityIDs: Id<StructureExtension | StructureSpawn>[]
  _spawningStructuresByPriority: SpawningStructures
  get spawningStructuresByPriority() {
    if (this._spawningStructuresByPriority) return this._spawningStructuresByPriority

    if (this.spawningStructuresByPriorityIDs && !this.room.roomManager.structureUpdate) {
      return (this._spawningStructuresByPriority = this.spawningStructuresByPriorityIDs.map(ID =>
        findObjectWithID(ID),
      ))
    }

    const anchor = this.room.roomManager.anchor
    if (!anchor) throw Error('no anchor')

    let spawningStructuresByPriority: SpawningStructures = []
    const structuresToSort: SpawningStructures = []

    for (const structure of this.actionableSpawningStructures) {
      if (RoomNameUtils.isSourceSpawningStructure(this.room.name, structure)) {
        spawningStructuresByPriority.push(structure)
      }

      structuresToSort.push(structure)
    }

    spawningStructuresByPriority = spawningStructuresByPriority.concat(
      structuresToSort.sort((a, b) => getRange(a.pos, anchor) - getRange(b.pos, anchor)),
    )

    this.spawningStructuresByPriorityIDs = spawningStructuresByPriority.map(
      structure => structure.id,
    )
    return (this._spawningStructuresByPriority = spawningStructuresByPriority)
  }

  spawningStructuresByNeedCoords: Id<StructureExtension | StructureSpawn>[]
  _spawningStructuresByNeed: SpawningStructures
  get spawningStructuresByNeed() {
    if (this._spawningStructuresByNeed) return this._spawningStructuresByNeed

    // mark coords in range 1 of reserved source harvest positions
    // mark coords in range of valid fastFiller position

    let ignoreCoords = new Set<number>()

    // source extensions

    const packedHarvestPositions =
      Memory.rooms[this.room.name][RoomMemoryKeys.communeSourceHarvestPositions]
    for (const packedPositions of packedHarvestPositions) {
      const pos = unpackPosAt(packedPositions, 0)

      // Make sure the position is reserved (presumably by a harvester)

      const reserveType = this.room.roomManager.reservedCoords.get(packCoord(pos))
      if (!reserveType) continue
      if (reserveType < ReservedCoordTypes.dying) continue

      forCoordsAroundRange(pos, 1, coord => {
        const structure = this.room.findStructureAtCoord(coord, structure => {
          return structure.structureType === STRUCTURE_EXTENSION
        })
        if (!structure) return

        ignoreCoords.add(packAsNum(coord))
      })
    }

    ignoreCoords = this.findFastFillerIgnoreCoords(ignoreCoords)

    // Filter out structures that have ignored coords
    const spawningStructuresByNeed = this.actionableSpawningStructures.filter(structure => {
      return !ignoreCoords.has(packAsNum(structure.pos))
    })

    return (this._spawningStructuresByNeed = spawningStructuresByNeed)
  }

  private findFastFillerIgnoreCoords(ignoreCoords: Set<number>) {
    const fastFillerPositions = this.room.roomManager.fastFillerPositions
    for (const pos of fastFillerPositions) {
      // Make sure the position is reserved (presumably by a fastFiller)

      const reserveType = this.room.roomManager.reservedCoords.get(packCoord(pos))
      if (!reserveType) continue
      if (reserveType < ReservedCoordTypes.dying) continue

      // register structures the fastFiller should be able to fill
      forCoordsAroundRange(pos, 1, coord => {
        ignoreCoords.add(packAsNum(coord))
      })
    }

    return ignoreCoords
  }

  /**
   * Presciption on if we should be trying to build remote contianers
   */
  get shouldRemoteContainers() {
    return this.room.energyCapacityAvailable >= 650
  }

  // /**
  //  * Wether or not the barricade damage was recorded / updated for this tick
  //  */
  // barricadeDamageOverTimeRecorded: boolean
  // _barricadeDamageOverTime: Uint16Array
  // get barricadeDamageOverTime() {

  //     if (this._barricadeDamageOverTime) return this._barricadeDamageOverTime

  //     const barricadeDamageOverTime: Uint16Array = new Uint16Array(2500)

  //     for (const rampart of this.room.roomManager.structures.rampart) {

  //         const packedCoord = packAsNum(rampart.pos)

  //         barricadeDamageOverTime[packedCoord] = rampart.hits
  //     }
  // }

  _resourceTargets: ResourceTargets
  get resourceTargets() {
    if (this._resourceTargets) return this._resourceTargets

    const resourceTargets: ResourceTargets = {
      min: {},
      max: {},
    }
    const storingStructuresCapacity = this.storingStructuresCapacity
    let min: number

    resourceTargets.min[RESOURCE_BATTERY] = this.room.roomManager.factory
      ? storingStructuresCapacity * 0.005
      : 0
    resourceTargets.max[RESOURCE_BATTERY] = storingStructuresCapacity * 0.015

    min = resourceTargets.min[RESOURCE_ENERGY] =
      this.storingStructuresCapacity *
      0.9 /* this.energyMinResourceTarget(storingStructuresCapacity) */
    resourceTargets.max[RESOURCE_ENERGY] = Math.max(
      storingStructuresCapacity * 0.5,
      this.minStoredEnergy,
      min,
    )

    // minerals

    resourceTargets.min[RESOURCE_HYDROGEN] = storingStructuresCapacity * 0.01
    resourceTargets.max[RESOURCE_HYDROGEN] = storingStructuresCapacity * 0.027

    resourceTargets.min[RESOURCE_OXYGEN] = storingStructuresCapacity * 0.01
    resourceTargets.max[RESOURCE_OXYGEN] = storingStructuresCapacity * 0.027

    resourceTargets.min[RESOURCE_UTRIUM] = storingStructuresCapacity * 0.01
    resourceTargets.max[RESOURCE_UTRIUM] = storingStructuresCapacity * 0.027

    resourceTargets.min[RESOURCE_KEANIUM] = storingStructuresCapacity * 0.01
    resourceTargets.max[RESOURCE_KEANIUM] = storingStructuresCapacity * 0.027

    resourceTargets.min[RESOURCE_LEMERGIUM] = storingStructuresCapacity * 0.01
    resourceTargets.max[RESOURCE_LEMERGIUM] = storingStructuresCapacity * 0.027

    resourceTargets.min[RESOURCE_ZYNTHIUM] = storingStructuresCapacity * 0.01
    resourceTargets.max[RESOURCE_ZYNTHIUM] = storingStructuresCapacity * 0.027

    if (Game.shard.name === 'swc') {
      resourceTargets.min[RESOURCE_CATALYST] = storingStructuresCapacity * 0
      resourceTargets.max[RESOURCE_CATALYST] = storingStructuresCapacity * 0.01
    } else {
      resourceTargets.min[RESOURCE_CATALYST] = storingStructuresCapacity * 0.01
      resourceTargets.max[RESOURCE_CATALYST] = storingStructuresCapacity * 0.027
    }

    // Boosts

    resourceTargets.min[RESOURCE_UTRIUM_HYDRIDE] = 0
    resourceTargets.max[RESOURCE_UTRIUM_HYDRIDE] = storingStructuresCapacity * 0.01

    resourceTargets.min[RESOURCE_UTRIUM_OXIDE] = 0
    resourceTargets.max[RESOURCE_UTRIUM_OXIDE] = storingStructuresCapacity * 0.01

    resourceTargets.min[RESOURCE_KEANIUM_HYDRIDE] = 0
    resourceTargets.max[RESOURCE_KEANIUM_HYDRIDE] = storingStructuresCapacity * 0.01

    resourceTargets.min[RESOURCE_KEANIUM_OXIDE] = 0
    resourceTargets.max[RESOURCE_KEANIUM_OXIDE] = storingStructuresCapacity * 0.01

    resourceTargets.min[RESOURCE_LEMERGIUM_HYDRIDE] = 0
    resourceTargets.max[RESOURCE_LEMERGIUM_HYDRIDE] = storingStructuresCapacity * 0.01

    resourceTargets.min[RESOURCE_LEMERGIUM_OXIDE] = 0
    resourceTargets.max[RESOURCE_LEMERGIUM_OXIDE] = storingStructuresCapacity * 0.01

    resourceTargets.min[RESOURCE_ZYNTHIUM_HYDRIDE] = 0
    resourceTargets.max[RESOURCE_ZYNTHIUM_HYDRIDE] = storingStructuresCapacity * 0.01

    resourceTargets.min[RESOURCE_ZYNTHIUM_OXIDE] = 0
    resourceTargets.max[RESOURCE_ZYNTHIUM_OXIDE] = storingStructuresCapacity * 0.01

    resourceTargets.min[RESOURCE_GHODIUM_HYDRIDE] = 0
    resourceTargets.max[RESOURCE_GHODIUM_HYDRIDE] = storingStructuresCapacity * 0.01

    // other raw

    resourceTargets.min[RESOURCE_POWER] = this.room.roomManager.powerSpawn
      ? storingStructuresCapacity * 0.002
      : 0
    resourceTargets.max[RESOURCE_POWER] = storingStructuresCapacity * 0.015

    resourceTargets.min[RESOURCE_OPS] = storingStructuresCapacity * 0.01
    resourceTargets.max[RESOURCE_OPS] = storingStructuresCapacity * 0.02

    resourceTargets.min[RESOURCE_METAL] = 0
    resourceTargets.max[RESOURCE_METAL] = 0

    resourceTargets.min[RESOURCE_BIOMASS] = 0
    resourceTargets.max[RESOURCE_BIOMASS] = 0

    resourceTargets.min[RESOURCE_SILICON] = 0
    resourceTargets.max[RESOURCE_SILICON] = 0

    resourceTargets.min[RESOURCE_MIST] = 0
    resourceTargets.max[RESOURCE_MIST] = 0

    // commodities
    // low level

    resourceTargets.min[RESOURCE_GHODIUM_MELT] = 0
    resourceTargets.max[RESOURCE_GHODIUM_MELT] = 0

    resourceTargets.min[RESOURCE_COMPOSITE] = 0
    resourceTargets.max[RESOURCE_COMPOSITE] = 0

    resourceTargets.min[RESOURCE_CRYSTAL] = 0
    resourceTargets.max[RESOURCE_CRYSTAL] = 0

    resourceTargets.min[RESOURCE_LIQUID] = 0
    resourceTargets.max[RESOURCE_LIQUID] = 0

    // tier 1 commodities

    resourceTargets.min[RESOURCE_ALLOY] = 0
    resourceTargets.max[RESOURCE_ALLOY] = 0

    resourceTargets.min[RESOURCE_CELL] = 0
    resourceTargets.max[RESOURCE_CELL] = 0

    resourceTargets.min[RESOURCE_WIRE] = 0
    resourceTargets.max[RESOURCE_WIRE] = 0

    resourceTargets.min[RESOURCE_CONDENSATE] = 0
    resourceTargets.max[RESOURCE_CONDENSATE] = 0

    // tier 2

    // tier 3

    // tier 4

    // tier 5

    return (this._resourceTargets = resourceTargets)
  }

  private energyMinResourceTarget(storingStructuresCapacity: number) {
    if (this.room.controller.level < 8) {
      const funnelOrder = CollectiveManager.getFunnelOrder()
      if (funnelOrder[0] === this.room.name) {
        return Math.min(
          this.storedEnergyUpgradeThreshold * 1.2 + this.upgradeTargetDistance(),
          storingStructuresCapacity / 2,
        )
      }
      return Math.min(this.storedEnergyUpgradeThreshold * 1.2, storingStructuresCapacity / 2)
    }

    return this.minStoredEnergy
  }

  private upgradeTargetDistance() {
    return this.room.controller.progressTotal - this.room.controller.progress
  }
}
