import {
    createPosMap,
    findAdjacentCoordsToCoord,
    findAdjacentCoordsToXY,
    findClosestObject,
    findCPUOf,
    findLinkThroughput,
    findObjectWithID,
    forAdjacentCoords,
    forCoordsInRange,
    getRangeXY,
    getRange,
    isXYExit,
    isXYInBorder,
    isXYInRoom,
    makeRoomCoord,
    packAsNum,
    packXYAsNum,
    randomIntRange,
    randomTick,
    unpackNumAsCoord,
    findLowestScore,
    roundTo,
    forCoordsAroundRange,
} from 'utils/utils'
import { TerminalManager } from './terminal/terminal'
import './spawning/spawningStructures'

import './defence'
import './workRequest'
import './combatRequest'
import {
    creepRoles,
    impassibleStructureTypesSet,
    customColors,
    remoteRoles,
    roomDimensions,
    stamps,
    defaultRoadPlanningPlainCost,
    adjacentOffsets,
    packedPosLength,
    structureTypesToProtectSet,
    buildableStructuresSet,
    RoomMemoryKeys,
    RoomTypes,
    rampartUpkeepCost,
    RemoteResourcePathTypes,
    Result,
    ReservedCoordTypes,
    RoomStatsKeys,
} from 'international/constants'
import './factory'
import { LabManager } from './labs'
import './towers'
import './links'
import { RoomVisualsManager } from '../roomVisuals'
import { EndTickCreepManager } from '../creeps/endTickCreepManager'
import { CreepRoleManager } from '../creeps/creepRoleManager'
import { RemotesManager } from './remotesManager'
import { WorkRequestManager } from './workRequest'
import { CombatRequestManager } from './combatRequest'
import { PowerSpawnsManager } from './powerSpawn'
import './haulerSize'
import { SourceManager } from './sourceManager'
import { TowerManager } from './towers'
import { DefenceManager } from './defence'
import { SpawningStructuresManager } from './spawning/spawningStructures'
import { HaulRequestManager } from './haulRequestManager'
import { HaulerSizeManager } from './haulerSize'
import { HaulerNeedManager } from './haulerNeed'
import {
    packCoord,
    packXYAsCoord,
    unpackCoord,
    unpackPosAt,
    unpackPosList,
    unpackStampAnchors,
} from 'other/codec'
import { ContainerManager } from '../container'
import { StoringStructuresManager } from './storingStructures'
import { DroppedResourceManager } from 'room/droppedResources'
import { LinkManager } from './links'
import { profiler } from 'other/profiler'
import { FactoryManager } from './factory'
import { SpawnRequestsManager } from './spawning/spawnRequests'
import { ObserverManager } from './observer'
import { decode, encode } from 'base32768'
import { collectiveManager } from 'international/collective'
import { ConstructionManager } from 'room/construction/construction'
import { RampartPlans } from 'room/construction/rampartPlans'
import { has } from 'lodash'
import { roomUtils } from 'room/roomUtils'
import { LogTypes, customLog } from 'utils/logging'
import { creepUtils } from 'room/creeps/creepUtils'
import { SpawnRequestArgs } from 'types/spawnRequest'

export class CommuneManager {
    static communeManagers: { [roomName: string]: CommuneManager } = {}

    // Managers

    constructionManager: ConstructionManager
    defenceManager: DefenceManager

    towerManager: TowerManager
    storingStructuresManager: StoringStructuresManager
    linkManager: LinkManager
    labManager: LabManager
    powerSpawningStructuresManager: PowerSpawnsManager
    spawnRequestsManager: SpawnRequestsManager
    spawningStructuresManager: SpawningStructuresManager
    sourceManager: SourceManager

    observerManager: ObserverManager
    terminalManager: TerminalManager
    remotesManager: RemotesManager
    haulerSizeManager: HaulerSizeManager

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
    /**
     * The total amount of carry parts for hauler and remoteHaulers
     */
    haulerCarryParts: number
    towerAttackTarget: Creep
    /**
     * Arguments for construction spawn requests. Defined by the spawnRequest manager on run().
     */
    spawnRequestsArgs: SpawnRequestArgs[]
    /**
     * The carry parts needed to effectively run the commune
     */
    haulerNeed: number
    mineralHarvestStrength: number
    upgradeStrength: number
    remoteResourcePathType: RemoteResourcePathTypes

    constructor() {
        this.constructionManager = new ConstructionManager(this)
        this.defenceManager = new DefenceManager(this)

        this.towerManager = new TowerManager(this)
        this.storingStructuresManager = new StoringStructuresManager(this)
        this.linkManager = new LinkManager(this)
        this.labManager = new LabManager(this)
        this.powerSpawningStructuresManager = new PowerSpawnsManager(this)
        this.spawnRequestsManager = new SpawnRequestsManager(this)
        this.spawningStructuresManager = new SpawningStructuresManager(this)
        this.sourceManager = new SourceManager(this)

        this.observerManager = new ObserverManager(this)
        this.terminalManager = new TerminalManager(this)
        this.remotesManager = new RemotesManager(this)
        this.haulerSizeManager = new HaulerSizeManager(this)

        this.workRequestManager = new WorkRequestManager(this)
        this.combatRequestManager = new CombatRequestManager(this)
        this.haulRequestManager = new HaulRequestManager(this)
        this.haulerNeedManager = new HaulerNeedManager(this)

        this.factoryManager = new FactoryManager(this)
    }

    update(room: Room) {
        delete this._minStoredEnergy
        delete this._storingStructures
        delete this._maxCombatRequests
        delete this._rampartRepairTargets
        delete this._defensiveRamparts
        delete this._sourceLinks
        delete this._controllerLink
        delete this.towerAttackTarget
        delete this._actionableSpawningStructures
        delete this._spawningStructuresByPriority
        delete this._spawningStructuresByNeed

        if (randomTick()) {
            delete this._maxUpgradeStrength
            delete this._minRampartHits
            delete this._upgradeStructure
            delete this._storedEnergyBuildThreshold
            delete this._hasSufficientRoads
        }

        this.room = room
        const roomMemory = Memory.rooms[room.name]

        // If we should abandon the room

        if (roomMemory[RoomMemoryKeys.abandonCommune] === true) {
            room.controller.unclaim()
            roomMemory[RoomMemoryKeys.type] = RoomTypes.neutral
            roomUtils.cleanMemory(room.name)

            for (const cSite of room.find(FIND_MY_CONSTRUCTION_SITES)) {
                cSite.remove()
            }
            return
        }

        roomMemory[RoomMemoryKeys.type] = RoomTypes.commune
        collectiveManager.communes.add(room.name)

        if (this.room.controller.safeMode) collectiveManager.safemodedCommuneName = this.room.name

        if (!roomMemory[RoomMemoryKeys.greatestRCL]) {
            if (collectiveManager.communes.size <= 1)
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

        if (!roomMemory[RoomMemoryKeys.combatRequests])
            roomMemory[RoomMemoryKeys.combatRequests] = []
        if (!roomMemory[RoomMemoryKeys.haulRequests]) roomMemory[RoomMemoryKeys.haulRequests] = []

        this.spawnRequestsArgs = []
        this.upgradeStrength = 0
        this.mineralHarvestStrength = 0
        this.haulerNeed = 0
        this.nextSpawnEnergyAvailable = room.energyAvailable

        if (!roomMemory[RoomMemoryKeys.remotes]) roomMemory[RoomMemoryKeys.remotes] = []
        if (roomMemory[RoomMemoryKeys.threatened] == undefined) {
            roomMemory[RoomMemoryKeys.threatened] = 0
        }

        room.usedRampartIDs = new Map()

        room.creepsOfRemote = {}
        this.haulerCarryParts = 0
        this.remoteSourceHarvesters = {}

        for (let index = roomMemory[RoomMemoryKeys.remotes].length - 1; index >= 0; index -= 1) {
            const remoteName = roomMemory[RoomMemoryKeys.remotes][index]
            const remoteMemory = Memory.rooms[remoteName]

            room.creepsOfRemote[remoteName] = {}
            for (const role of remoteRoles) room.creepsOfRemote[remoteName][role] = []

            this.remoteSourceHarvesters[remoteName] = []
            for (const index in remoteMemory[RoomMemoryKeys.remoteSources])
                this.remoteSourceHarvesters[remoteName].push([])
        }

        // identify the remoteSourcePathType

        if (!this.remoteResourcePathType || randomTick()) {
            if (this.storingStructures.length) {
                /* this.remoteSourcePathType = RoomMemoryKeys.remoteSourceHubPaths */
                this.remoteResourcePathType = RoomMemoryKeys.remoteSourceFastFillerPaths
            } else {
                this.remoteResourcePathType = RoomMemoryKeys.remoteSourceFastFillerPaths
            }
        }

        Memory.rooms[this.room.name][this.remoteResourcePathType]

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
            collectiveManager.terminalCommunes.push(room.name)
        }

        collectiveManager.mineralNodes[this.room.roomManager.mineral.mineralType] += 1
    }

    initRun() {
        this.preTickTest()

        this.room.roomManager.communePlanner.preTickRun()

        const roomMemory = Memory.rooms[this.room.name]
        if (!roomMemory[RoomMemoryKeys.communePlanned]) return

        this.constructionManager.preTickRun()
        this.observerManager.preTickRun()
        this.terminalManager.preTickRun()
        this.remotesManager.initRun()
        this.haulRequestManager.preTickRun()
        this.sourceManager.preTickRun()
        this.workRequestManager.preTickRun()
    }

    run() {
        if (!this.room.memory[RoomMemoryKeys.communePlanned]) return

        this.defenceManager.run()
        this.towerManager.run()
        this.defenceManager.manageThreat()
        this.defenceManager.manageDefenceRequests()

        this.terminalManager.run()

        this.workRequestManager.run()
        this.combatRequestManager.run()
        this.haulRequestManager.run()

        this.sourceManager.run()
        this.remotesManager.run()
        this.haulerNeedManager.run()

        this.spawningStructuresManager.createRoomLogisticsRequests()
        this.storingStructuresManager.run()
        this.factoryManager.run()
        this.room.roomManager.containerManager.runCommune()
        this.room.roomManager.droppedResourceManager.runCommune()
        this.room.roomManager.tombstoneManager.runCommune()
        this.room.roomManager.ruinManager.runCommune()
        this.linkManager.run()
        this.labManager.run()
        this.powerSpawningStructuresManager.run()
        this.spawningStructuresManager.organizeSpawns()
        this.spawningStructuresManager.createPowerTasks()

        this.room.roomManager.creepRoleManager.run()
        this.room.roomManager.powerCreepRoleManager.run()

        this.haulerSizeManager.run()
        this.spawningStructuresManager.run()

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
        roomUtils.cleanMemory(remoteName)
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
            (minHeal / HEAL_POWER) * BODYPART_COST[HEAL] +
            (minHeal / HEAL_POWER) * BODYPART_COST[MOVE]
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
                        Memory.rooms[this.room.name][RoomMemoryKeys.threatened] *
                            5 *
                            Math.pow(level, 2),
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

    private _maxUpgradeStrength: number
    get maxUpgradeStrength() {
        if (this._maxUpgradeStrength !== undefined) return this._maxUpgradeStrength

        const upgradeStructure = this.upgradeStructure
        if (!upgradeStructure) return this.findNudeMaxUpgradeStrength()

        // Container

        if (upgradeStructure.structureType === STRUCTURE_CONTAINER) {
            return (this._maxUpgradeStrength =
                upgradeStructure.store.getCapacity() /
                (4 + this.room.memory[RoomMemoryKeys.upgradePath].length / packedPosLength))
        }

        // Link

        const hubLink = this.room.roomManager.hubLink
        const sourceLinks = this.sourceLinks

        // If there are transfer links, max out partMultiplier to their ability

        this._maxUpgradeStrength = 0

        if (hubLink && hubLink.RCLActionable) {
            const range = getRange(upgradeStructure.pos, hubLink.pos)

            // Increase strength by throughput

            this._maxUpgradeStrength += findLinkThroughput(range) * 0.7
        }

        for (let i = 0; i < sourceLinks.length; i++) {
            const sourceLink = sourceLinks[i]

            if (!sourceLink) continue
            if (!sourceLink.RCLActionable) continue

            const range = getRange(sourceLink.pos, upgradeStructure.pos)

            // Increase strength by throughput

            this._maxUpgradeStrength +=
                findLinkThroughput(range, this.room.estimatedSourceIncome[i]) * 0.7
        }

        return this._maxUpgradeStrength
    }

    /**
     * The max upgrade strength when we have no local storing structure
     */
    findNudeMaxUpgradeStrength() {
        return (this._maxUpgradeStrength = 100)
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
        if (!controllerLink || !controllerLink.RCLActionable) return false

        const hubLink = this.room.roomManager.hubLink
        if (!hubLink || !hubLink.RCLActionable) return false

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

    private _rampartRepairTargets: StructureRampart[]
    get rampartRepairTargets() {
        const rampartRepairTargets: StructureRampart[] = []
        const rampartPlans = this.room.roomManager.rampartPlans

        for (const structure of this.room.roomManager.structures.rampart) {
            const data = rampartPlans.map[packCoord(structure.pos)]
            if (!data) continue

            if (data.minRCL > this.room.controller.level) continue
            if (
                data.coversStructure &&
                !this.room.coordHasStructureTypes(structure.pos, structureTypesToProtectSet)
            ) {
                continue
            }

            if (data.buildForNuke) {
                if (!this.room.roomManager.nukeTargetCoords[packAsNum(structure.pos)]) continue

                rampartRepairTargets.push(structure)
                continue
            }
            if (data.buildForThreat) {
                if (!this.buildSecondMincutLayer) continue

                rampartRepairTargets.push(structure)
                continue
            }

            rampartRepairTargets.push(structure)
        }

        return (this._rampartRepairTargets = rampartRepairTargets)
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
            links.push(structure)
            this.sourceLinkIDs.push(false)

            if (!structure) continue

            this.sourceLinkIDs.push(structure.id)
        }

        return (this._sourceLinks = links)
    }

    private controllerLinkID: Id<StructureLink>
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
            if (!structure.RCLActionable) continue
            // Outside of the fastFiller
            if (getRange(structure.pos, anchor) > 2) continue

            fastFillerSpawnEnergyCapacity += structure.store.getCapacity(RESOURCE_ENERGY)
        }

        return (this._fastFillerSpawnEnergyCapacity = fastFillerSpawnEnergyCapacity)
    }

    _actionableSpawningStructures: SpawningStructures
    /**
     * RCL actionable spawns and extensions
     */
    get actionableSpawningStructures() {
        if (this._actionableSpawningStructures) return this._actionableSpawningStructures

        const structures = this.room.roomManager.structures

        let actionableSpawningStructures: SpawningStructures = structures.spawn
        actionableSpawningStructures = actionableSpawningStructures.concat(structures.extension)
        actionableSpawningStructures = actionableSpawningStructures.filter(
            structure => structure.RCLActionable,
        )

        return (this._actionableSpawningStructures = actionableSpawningStructures)
    }

    spawningStructuresByPriorityIDs: Id<StructureExtension | StructureSpawn>[]
    _spawningStructuresByPriority: SpawningStructures
    get spawningStructuresByPriority() {
        if (this._spawningStructuresByPriority) return this._spawningStructuresByPriority

        if (this.spawningStructuresByPriorityIDs && !this.room.roomManager.structureUpdate) {
            return (this._spawningStructuresByPriority = this.spawningStructuresByPriorityIDs.map(
                ID => findObjectWithID(ID),
            ))
        }

        const anchor = this.room.roomManager.anchor
        if (!anchor) throw Error('no anchor')

        let spawningStructuresByPriority: SpawningStructures = []
        const structuresToSort: SpawningStructures = []

        for (const structure of this.actionableSpawningStructures) {
            if (roomUtils.isSourceSpawningStructure(this.room.name, structure)) {
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

    spawningStructuresByNeedIDs: Id<StructureExtension | StructureSpawn>[]
    _spawningStructuresByNeed: SpawningStructures
    get spawningStructuresByNeed() {
        if (this._spawningStructuresByNeed) return this._spawningStructuresByNeed

        // mark coords in range 1 of reserved source harvest positions
        // mark coords in range of valid fastFiller position

        let ignoreCoords = new Set<string>()

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

                ignoreCoords.add(packCoord(coord))
            })
        }

        ignoreCoords = this.findFastFillerIgnoreCoords(ignoreCoords)

        // Filter out structures that have ignored coords
        const spawningStructuresByNeed = this.actionableSpawningStructures.filter(structure => {
            return !ignoreCoords.has(packCoord(structure.pos))
        })

        return (this._spawningStructuresByNeed = spawningStructuresByNeed)
    }

    private findFastFillerIgnoreCoords(ignoreCoords: Set<string>) {
        const fastFillerLink = this.room.roomManager.fastFillerLink
        if (
            fastFillerLink &&
            fastFillerLink.RCLActionable &&
            this.room.roomManager.hubLink &&
            this.room.roomManager.hubLink.RCLActionable &&
            this.storingStructures.length &&
            this.room.myCreeps.hubHauler.length
        ) {
            const fastFillerPositions = this.room.roomManager.fastFillerPositions
            for (const pos of fastFillerPositions) {
                // Make sure the position is reserved (presumably by a fastFiller)

                const reserveType = this.room.roomManager.reservedCoords.get(packCoord(pos))
                if (!reserveType) continue
                if (reserveType < ReservedCoordTypes.dying) continue

                forCoordsAroundRange(pos, 1, coord => {
                    ignoreCoords.add(packCoord(coord))
                })
            }

            return ignoreCoords
        }

        if (this.room.roomManager.fastFillerContainers.length) {
            const fastFillerPositions = this.room.roomManager.fastFillerPositions
            for (const pos of fastFillerPositions) {
                // Make sure the position is reserved (presumably by a fastFiller)

                const reserveType = this.room.roomManager.reservedCoords.get(packCoord(pos))
                if (!reserveType) continue
                if (reserveType < ReservedCoordTypes.dying) continue

                // Only ignore coords if the fastFiller pos is in range of a container

                let hasContainer: boolean
                const potentialIgnoreCoords = new Set<string>()

                forCoordsAroundRange(pos, 1, coord => {
                    const structure = this.room.findStructureAtCoord(coord, structure => {
                        return structure.structureType === STRUCTURE_CONTAINER
                    })
                    if (structure) {
                        hasContainer = true
                        return
                    }

                    // There is potentially a spawning structure on this coord

                    potentialIgnoreCoords.add(packCoord(coord))
                })

                if (!hasContainer) continue

                for (const packedCoord of potentialIgnoreCoords) {
                    ignoreCoords.add(packedCoord)
                }
            }

            return ignoreCoords
        }

        // There are no valid links or containers in the fastFiller

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
}
