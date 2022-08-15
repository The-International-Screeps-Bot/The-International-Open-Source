// Imports

// International

import './international/commands'
import { InternationalManager, internationalManager } from './international/internationalManager'
import './international/config'
import './international/tickConfig'
import './international/creepOrganizer'
import './room/remotesManager'
import './international/constructionSiteManager'
import './international/mapVisualsManager'
import './international/endTickManager'

// Room

import './room/remotesManager'
import { roomManager } from 'room/roomsManager'
import './room/roomAdditions'

import './room/resourceAdditions'
import './room/roomObjectFunctions'

// Creep

import './room/creeps/creepAdditions'

// Other

import { memHack } from 'other/memHack'
import { RoomCacheObject } from 'room/roomObject'
import { Duo } from 'room/creeps/roleManagers/antifa/duo'
import { Quad } from 'room/creeps/roleManagers/antifa/quad'
import { customLog } from 'international/generalFunctions'
import { myColors } from 'international/constants'

// Type declareations for global

declare global {
    interface Coord {
        x: number
        y: number
    }

    interface Rect {
        x1: number
        y1: number
        x2: number
        y2: number
    }

    interface Colors {
        white: string
        lightGrey: string
        lightBlue: string
        darkBlue: string
        black: string
        yellow: string
        red: string
        green: string
        brown: string
    }

    type RemoteStampTypes = 'road' | 'container'

    type StampTypes =
        | 'fastFiller'
        | 'hub'
        | 'extensions'
        | 'labs'
        | 'tower'
        | 'extension'
        | 'observer'
        | 'sourceLink'
        | 'sourceExtension'
        | 'container'
        | 'extractor'
        | 'road'
        | 'rampart'

    interface Stamp {
        offset: number

        /**
         * The range of protection from the anchor to provide when deciding rampart placement
         */
        protectionOffset: number
        size: number
        structures: { [structureType: string]: Coord[] }
    }

    type StampAnchors = Partial<Record<StampTypes, RoomPosition[]>>

    type PosMap<T> = T[]

    type CoordMap = Uint8Array

    type CreepRoles =
        | 'source1Harvester'
        | 'source2Harvester'
        | 'hauler'
        | 'controllerUpgrader'
        | 'builder'
        | 'maintainer'
        | 'mineralHarvester'
        | 'hubHauler'
        | 'fastFiller'
        | 'meleeDefender'
        | 'source1RemoteHarvester'
        | 'source2RemoteHarvester'
        | 'remoteHauler'
        | 'remoteReserver'
        | 'remoteDefender'
        | 'remoteCoreAttacker'
        | 'remoteDismantler'
        | 'scout'
        | 'claimer'
        | 'vanguard'
        | 'allyVanguard'
        | 'vanguardDefender'
        | 'antifaAssaulter'
        | 'antifaSupporter'

    type RoomObjectName =
        | 'mineralHarvestPositions'
        | 'closestMineralHarvestPos'
        | 'centerUpgradePos'
        | 'upgradePositions'
        | 'fastFillerPositions'
        | 'labContainer'
        | 'usedMineralHarvestPositions'
        | 'usedUpgradePositions'
        | 'usedFastFillerPositions'
        | 'remoteNamesByEfficacy'

    interface PathGoal {
        pos: RoomPosition
        range: number
    }

    interface PathOpts {
        origin: RoomPosition
        goal: PathGoal
        /**
         * room types as keys to weight based on properties
         */
        typeWeights?: { [weight: string]: number }
        plainCost?: number
        swampCost?: number
        maxRooms?: number
        flee?: boolean
        creep?: Creep

        weightStructures?: { [weight: string]: StructureConstant[] }

        /**
         * An object with keys of weights and values of positions
         */

        weightPositions?: { [weight: string]: Coord[] | RoomPosition[] }

        /**
         *
         */
        weightCostMatrixes?: CostMatrix[]

        weightCoordMaps?: CoordMap[]

        /**
         *
         */
        avoidEnemyRanges?: boolean

        avoidStationaryPositions?: boolean

        /**
         *
         */
        avoidImpassibleStructures?: boolean

        /**
         * Marks creeps not owned by the bot as avoid
         */
        avoidNotMyCreeps?: boolean

        /**
         * Weight my ramparts by this value
         */
        myRampartWeight?: number

        weightStampAnchors?: boolean
    }

    interface FindClosestPosOfValueOpts {
        coordMap: CoordMap
        startCoords: Coord[]
        requiredValue: number
        reduceIterations: number
        initialWeight?: number
        adjacentToRoads?: boolean
        roadCoords?: CoordMap
        visuals?: boolean
    }

    interface MoveRequestOpts extends PathOpts {
        cacheAmount?: number
    }

    type OrderedStructurePlans = BuildObj[]

    interface BuildObj {
        structureType: BuildableStructureConstant
        x: number
        y: number
    }

    interface SpawnRequestOpts {
        role: CreepRoles
        /**
         * Parts that should be attempted to be implemented once
         */
        defaultParts: BodyPartConstant[]
        /**
         * Parts that should be attempted to be implemented based on the partsMultiplier
         */
        extraParts: BodyPartConstant[]
        /**
         * The number of times to attempt to duplicate extraParts
         */
        partsMultiplier: number
        /**
         * The absolute minimum cost the creep may be spawned with
         */
        minCost: number
        /**
         * The priority of spawning, where 0 is greatest, and Infinity is least
         */
        priority: number
        /**
         * Properties to apply to the creep on top of the defaults
         */
        memoryAdditions: Partial<CreepMemory>
        /**
         * The specific group of which to compare the creep amount to
         */
        groupComparator?: string[]
        /**
         *
         */
        threshold?: number
        /**
         *
         */
        minCreeps?: number | undefined
        /**
         *
         */
        maxCreeps?: number | undefined
        /**
         * The absolute max cost a creep may be applied with
         */
        maxCostPerCreep?: number | undefined
    }

    interface ExtraOpts {
        memory: CreepMemory
        energyStructures: (StructureSpawn | StructureExtension)[]
        dryRun: boolean
    }

    interface SpawnRequest {
        role: CreepRoles
        body: BodyPartConstant[]
        tier: number
        cost: number
        extraOpts: ExtraOpts
    }

    type Reservations = 'transfer' | 'withdraw' | 'pickup'

    interface Reservation {
        type: Reservations
        amount: number
        resourceType: ResourceConstant
        targetID: Id<AnyStoreStructure | Creep | Tombstone | Ruin | Resource>
    }

    interface ClaimRequest {
        /**
         * The name of the room responding to the request
         */
        responder?: string
        needs: number[]
        /**
         * The weight for which to prefer this room, where higher values are prefered less
         */
        score: number
        /**
         * The number of ticks to abandon the request for
         */
        abandon?: number
    }

    interface AttackRequest {
        /**
         * The name of the room responding to the request
         */
        responder?: string
        needs: number[]
        abandon?: number
    }

    interface AllyCreepRequest {
        /**
         * The name of the room responding to the request
         */
        responder?: string
        needs: number[]
        /**
         * The number of ticks to abandon the request for
         */
        abandon?: number
    }

    interface ControllerLevel {
        level: number
        progress: number
        progressTotal: number
    }
    interface RoomStats {
        cl?: number // controllerLevel
        eih: number // energyInputHarvest
        eiet?: number // energyInputExternalTransferred
        eib?: number // energyInputBought
        eou?: number // energyOutputUpgrade
        eoro: number // energyOutputRepairOther
        eorwr?: number // energyOutputRepairWallOrRampart
        eob: number // energyOutputBuild
        eoso?: number // energyOutputSold
        eosp?: number // energyOutputSpawn
        mh?: number // mineralsHarvested
        es: number // energyStored
        cc: number // creepCount
        cu: number // cpuUsage
        rt: number // roomType
        su?: number // spawnUsage
    }

    interface Stats {
        lastReset: number

        lastTickTimestamp: number
        tickLength: number

        communeCount: number

        resources: {
            pixels: number
            cpuUnlocks: number
            accessKeys: number
            credits: number
        }

        cpu: {
            bucket: number
            usage: number
            limit: number
        }

        memory: {
            usage: number
            limit: number
        }

        gcl: ControllerLevel

        gpl: ControllerLevel
        rooms: { commune: { [key: string]: RoomStats }; remote: { [key: string]: RoomStats } }
        constructionSiteCount: number
        debugCpu11: number
        debugCpu12: number
        debugCpu21: number
        debugCpu22: number
        debugCpu31: number
        debugCpu32: number
        debugRoomCount1: number
        debugRoomCount2: number
        debugRoomCount3: number
    }

    type RoomTypes =
        | 'commune'
        | 'remote'
        | 'ally'
        | 'allyRemote'
        | 'enemy'
        | 'enemyRemote'
        | 'neutral'
        | 'keeper'
        | 'keeperCenter'
        | 'highway'
        | 'intersection'

    interface RoomType {
        [property: string]: true
    }

    interface PlayerInfo {
        /**
         * Defensive Threat, the enemy's perceived defensive ability
         */
        DT: number
        /**
         * Offensive Threat, the enemy's perceived offensive threat towards the bot
         */
        OT: number
        /**
         * The enemy's Greatest Room Controller Level known by the bot
         */
        GRCL: number
    }

    interface Memory {
        /**
         * The name of the user
         */
        me: string

        /**
         * IsMainShard
         */
        isMainShard: boolean

        /**
         * The current breaking version of the bot
         */
        breakingVersion: number | undefined

        /**
         * Wether the bot should generate any room visuals
         */
        roomVisuals: boolean

        /**
         * Wether the bot should generate base room visuals
         */
        baseVisuals: boolean

        /**
         * Wether the bot should generate map visuals
         */
        mapVisuals: boolean

        /**
         * Wether the bot should log CPU data
         */
        CPULogging: boolean

        /**
         * Wether the bot save RoomStats data
         */
        roomStats: 0 | 1 | 2

        /**
         * A list of usernames to treat as allies
         */
        allyList: string[]

        /**
         * Wether the bot should sell pixels
         */
        pixelSelling: boolean

        /**
         * Wether the bot should generate pixels
         */
        pixelGeneration: boolean

        /**
         * An list of usernames to not trade with
         */
        tradeBlacklist: string[]

        /**
         * Wether the bot should automatically respond to claimRequests
         */
        autoClaim: boolean

        /**
         * Wether the bot should enable ramparts when there is no enemy present
         */
        publicRamparts: boolean

        /**
         * Wether the bot should try trading with its allies
         */
        allyTrading: boolean

        /**
         * An ongoing record of the latest ID assigned by the bot
         */
        ID: number

        /**
         * An object of constrctionsSites with keys of site IDs and properties of the site's age
         */
        constructionSites: { [ID: string]: number }

        /**
         *
         */
        claimRequests: { [roomName: string]: ClaimRequest }

        attackRequests: { [roomName: string]: AttackRequest }

        allyCreepRequests: { [roomName: string]: AllyCreepRequest }

        /**
         * An array of roomNames that have controllers we own
         */
        communes: string[]

        stats: Partial<Stats>

        players: { [playerName: string]: Partial<PlayerInfo> }
    }

    interface RawMemory {
        [key: string]: any
    }

    type SpawningStructures = (StructureSpawn | StructureExtension)[]

    interface OrganizedStructures {
        spawn: StructureSpawn[]
        extension: StructureExtension[]
        road: StructureRoad[]
        constructedWall: StructureWall[]
        rampart: StructureRampart[]
        keeperLair: StructureKeeperLair[]
        portal: StructurePortal[]
        controller: StructureController[]
        link: StructureLink[]
        storage: StructureStorage[]
        tower: StructureTower[]
        observer: StructureObserver[]
        powerBank: StructurePowerBank[]
        powerSpawn: StructurePowerSpawn[]
        extractor: StructureExtractor[]
        lab: StructureLab[]
        terminal: StructureTerminal[]
        container: StructureContainer[]
        nuker: StructureNuker[]
        factory: StructureFactory[]
        invaderCore: StructureInvaderCore[]
    }

    interface RoomGlobal {
        [key: string]: any

        // RoomObjects

        stampAnchors: StampAnchors

        /**
         * packed
         */
        sourcePaths: string[]

        source1PathLength: number

        source2PathLength: number

        upgradePathLength: number

        // Containers

        sourceContainers: Id<StructureContainer>[]

        sourceLinks: Id<StructureLink>[]

        fastFillerContainerLeft: Id<StructureContainer> | undefined

        fastFillerContainerRight: Id<StructureContainer> | undefined

        controllerContainer: Id<StructureContainer> | undefined

        mineralContainer: Id<StructureContainer> | undefined

        // Links

        controllerLink: Id<StructureLink> | undefined

        fastFillerLink: Id<StructureLink> | undefined

        hubLink: Id<StructureLink> | undefined
    }

    interface Room {
        /**
         * The amount of creeps with a task of harvesting sources in the room
         */
        creepsOfSourceAmount: number[]

        /**
         * An object with keys of roles with properties of arrays of creep names belonging to the role
         */
        myCreeps: { [key: string]: string[] }

        /**
         * The number of my creeps in the room
         */
        myCreepsAmount: number

        roomObjects: Partial<Record<RoomObjectName, RoomCacheObject>>

        /**
         * An object with keys of roles and properties of the number of creeps with the role from this room
         */
        creepsFromRoom: { [key: string]: string[] }

        /**
         * The cumulative amount of creeps with a communeName value of this room's name
         */
        creepsFromRoomAmount: number

        /**
         * An object with keys of roles and properties of the number of creeps with the role from this room
         */
        creepsFromRoomWithRemote: { [key: string]: { [key: string]: string[] } }

        /**
         * An object, if constructed, containing keys of resource types and values of the number of those resources in the room's terminal and storage
         */
        storedResources: { [key: string]: number }

        /**
         * A set of roomNames representing the targets of scouts from this commune
         */
        scoutTargets: Set<string>

        spawnRequests: { [priority: string]: SpawnRequest }

        /**
         * Tile types as defined by the rampartPlanner
         */
        tileCoords: CoordMap

        unprotectedCoords: CoordMap

        /**
         * Wether the towers can deal sufficient damage to out-damage enemy creeps in the room
         *
         * Should influence if maintainers and defenders are needed to fend off the attack
         */
        towerSuperiority: boolean

        baseCoords: CoordMap

        rampartCoords: CoordMap

        roadCoords: CoordMap

        /**
         * A matrix with indexes of packed positions and values of creep names
         */
        creepPositions: Map<number, string>

        /**
         * A matrix with indexes of packed positions and values of creep names
         */
        moveRequests: Map<number, string[]>

        // Functions

        /**
         * Uses caching and only operating on request to construct and get a specific roomObject based on its name
         * @param roomObjectName The name of the requested roomObject
         * @returns Either the roomObject's value, or, if the request failed, undefined
         */
        get(roomObjectName: RoomObjectName): any | undefined

        /**
         * Removes roomType-based values in the room's memory that don't match its type
         */
        cleanMemory(): void

        /**
         *
         * @param pos1 The position of the thing performing the action
         * @param pos2 The position of the thing getting intereacted with
         * @param type The type of interaction, success if not provided
         */
        actionVisual(pos1: RoomPosition, pos2: RoomPosition, type?: string): void

        /**
         * Generates a path between two positions
         */
        advancedFindPath(opts: PathOpts): RoomPosition[]

        /**
         * Finds the amount of a specified resourceType in the room's storage and teminal
         */
        findStoredResourceAmount(resourceType: ResourceConstant): number

        /**
         * Tries to delete a task with the provided ID and response state
         */
        deleteTask(taskID: any, responder: boolean): void

        /**
         * Finds the type of a room and initializes its custom properties
         * @param scoutingRoom The room that is performing the scout operation
         */
        findType(scoutingRoom: Room): void

        makeRemote(scoutingRoom: Room): boolean

        /**
         * Finds the score of rooms for potential communes
         */
        findScore(): void

        /**
         * Finds open spaces in a room and records them in a cost matrix
         */
        distanceTransform(
            initialCoords?: CoordMap,
            visuals?: boolean,
            x1?: number,
            y1?: number,
            x2?: number,
            y2?: number,
        ): CoordMap

        /**
         * Finds open spaces in a room without adding depth to diagonals, and records the depth results in a cost matrix
         */
        diagonalDistanceTransform(
            initialCoords?: CoordMap,
            visuals?: boolean,
            x1?: number,
            y1?: number,
            x2?: number,
            y2?: number,
        ): CoordMap

        /**
         * Gets ranges from for each position from a certain point
         */
        floodFill(seeds: Coord[], coordMap: CoordMap, visuals?: boolean): CoordMap

        /**
         * Flood fills a room until it finds the closest pos with a value greater than or equal to the one specified
         */
        findClosestPosOfValue(opts: FindClosestPosOfValueOpts): RoomPosition | false

        /**
         *
         */
        pathVisual(path: RoomPosition[], color: keyof Colors): void

        /**
         * Finds and records a construction site for builders to target
         */
        findAllyCSiteTargetID(creep: Creep): boolean

        /**
         * Groups positions with contigiousness, structured similarily to a flood fill
         */
        groupRampartPositions(rampartPositions: number[]): RoomPosition[][]

        findUnprotectedCoords(visuals?: boolean): CoordMap

        /**
         *
         */
        findRoomPositionsInsideRect(x1: number, y1: number, x2: number, y2: number): RoomPosition[]

        /**
         *
         */
        createPullTask(creator: Structure | Creep | Resource): void

        /**
         *
         */
        createPickupTasks(creator: Structure | Creep | Resource): void

        /**
         *
         */
        createOfferTasks(creator: Structure | Creep | Resource): void

        /**
         *
         */
        createTransferTasks(creator: Structure | Creep | Resource): void

        /**
         *
         */
        createWithdrawTasks(creator: Structure | Creep | Resource): void

        visualizeCoordMap(coordMap: CoordMap): void

        /**
         * Crudely estimates a room's income by accounting for the number of work parts owned by sourceHarvesters
         */
        estimateIncome(): number

        getPartsOfRoleAmount(role: CreepRoles, type?: BodyPartConstant): number

        createClaimRequest(): boolean

        findSwampPlainsRatio(): number

        // General roomFunctions

        claimRequestManager(): void

        allyCreepRequestManager(): void

        remotesManager(): void

        haulerSizeManager(): void

        trafficManager(): void

        /**
         * Dictates and operates tasks for factories
         */
        factoryManager(): void

        // Spawn functions

        /**
         * Takes spawnRequests and tries to spawn them in order of priority (lowest to highest)
         */
        spawnManager(): void

        /**
         * Creates spawn requests for the commune
         */
        spawnRequester(): void

        constructSpawnRequests(opts: SpawnRequestOpts | false): void

        decideMaxCostPerCreep(maxCostPerCreep: number): number

        createSpawnRequest(
            priority: number,
            role: CreepRoles,
            body: BodyPartConstant[],
            tier: number,
            cost: number,
            memory: any,
        ): void

        spawnRequestIndividually(opts: SpawnRequestOpts): void

        spawnRequestByGroup(opts: SpawnRequestOpts): void

        // Commune

        communeManager(): void

        // Market functions

        advancedSell(resourceType: ResourceConstant, amount: number, targetAmount: number): boolean

        advancedBuy(resourceType: ResourceConstant, amount: number, targetAmount: number): boolean

        // Construction functions

        remoteConstructionManager(): void

        remotePlanner(commune: Room): boolean

        clearOtherStructures(): void

        remoteConstructionPlacement(): void

        communeConstructionPlacement(): void

        // Defence

        /**
         * Handles defence related situations for a commune
         */
        defenceManager(): void

        /**
         * Publicizes or privitizes ramparts based on enemyAttacker presence
         */
        manageRampartPublicity(): void

        /**
         * Activates safemode based on concerning conditions
         */
        advancedActivateSafeMode(): void

        // Tower functions

        /**
         * Dictates and operates tasks for towers
         */
        towerManager(): void

        /**
         * has towers heal my or allied damaged creeps
         */
        towersHealCreeps(): void

        /**
         * Has towers attack enemyCreeps, if they think they can deal damage
         */
        towersAttackCreeps(): void

        /**
         * Has towers repair ramparts that are soon to decay
         */
        towersRepairRamparts(): void

        // Link functions

        /**
         * Dictates and operates tasks for links
         */
        linkManager(): void

        sourcesToReceivers(sourceLinks: (StructureLink | false)[], receiverLinks: (StructureLink | false)[]): void

        hubToFastFiller(hubLink: StructureLink | undefined, fastFillerLink: StructureLink | undefined): void

        hubToController(hubLink: StructureLink | undefined, controllerLink: StructureLink | undefined): void

        // Room Visuals

        /**
         * Adds annotations to the room, if roomVisuals are enabled
         */
        roomVisualsManager(): void

        // Getters

        readonly global: Partial<RoomGlobal>

        _anchor: RoomPosition | undefined

        readonly anchor: RoomPosition | undefined

        _sources: Source[]

        readonly sources: Source[]

        _sourcesByEfficacy: Source[]

        readonly sourcesByEfficacy: Source[]

        _mineral: Mineral

        readonly mineral: Mineral

        _enemyCreeps: Creep[]

        readonly enemyCreeps: Creep[]

        _enemyAttackers: Creep[]

        readonly enemyAttackers: Creep[]

        _allyCreeps: Creep[]

        readonly allyCreeps: Creep[]

        _myDamagedCreeps: Creep[]

        readonly myDamagedCreeps: Creep[]

        _allyDamagedCreeps: Creep[]

        readonly allyDamagedCreeps: Creep[]

        _structures: Partial<OrganizedStructures>

        readonly structures: OrganizedStructures

        _cSites: Partial<Record<StructureConstant, ConstructionSite[]>>

        readonly cSites: Record<StructureConstant, ConstructionSite[]>

        _enemyCSites: ConstructionSite[]

        readonly enemyCSites: ConstructionSite[]

        _allyCSites: ConstructionSite[]

        readonly allyCSites: ConstructionSite[]

        _allyCSitesByType: Partial<Record<StructureConstant, ConstructionSite[]>>

        readonly allyCSitesByType: Record<StructureConstant, ConstructionSite[]>

        readonly cSiteTarget: ConstructionSite | undefined

        _spawningStructures: SpawningStructures

        readonly spawningStructures: SpawningStructures

        _spawningStructuresByPriority: SpawningStructures

        readonly spawningStructuresByPriority: SpawningStructures

        _spawningStructuresByNeed: SpawningStructures

        readonly spawningStructuresByNeed: SpawningStructures

        _taskNeedingSpawningStructures: SpawningStructures

        readonly taskNeedingSpawningStructures: SpawningStructures

        _sourcePositions: RoomPosition[][]

        readonly sourcePositions: RoomPosition[][]

        _usedSourceCoords: Set<number>[]

        readonly usedSourceCoords: Set<number>[]

        _sourcePaths: RoomPosition[][]

        readonly sourcePaths: RoomPosition[][]

        readonly upgradePathLength: number

        // Container

        _sourceContainers: StructureContainer[]

        readonly sourceContainers: StructureContainer[]

        _sourceLinks: StructureLink[]

        readonly sourceLinks: StructureLink[]

        readonly fastFillerContainerLeft: StructureContainer | undefined

        readonly fastFillerContainerRight: StructureContainer | undefined

        readonly controllerContainer: StructureContainer | undefined

        readonly mineralContainer: StructureContainer | undefined

        // Links

        readonly controllerLink: StructureLink | undefined

        readonly fastFillerLink: StructureLink | undefined

        readonly hubLink: StructureLink | undefined

        _droppedEnergy: Resource[]

        readonly droppedEnergy: Resource[]

        _actionableWalls: StructureWall[]

        readonly actionableWalls: StructureWall[]

        // Target finding

        _MEWT: (Creep | AnyStoreStructure | Tombstone | Ruin | Resource)[]

        /**
         * Mandatory energy withdraw targets
         */
        readonly MEWT: (Creep | AnyStoreStructure | Tombstone | Ruin | Resource)[]

        _OEWT: (Creep | AnyStoreStructure | Tombstone | Ruin | Resource)[]

        /**
         * Optional energy withdraw targets
         */
        readonly OEWT: (Creep | AnyStoreStructure | Tombstone | Ruin | Resource)[]

        _MAWT: (Creep | AnyStoreStructure | Tombstone | Ruin | Resource)[]

        /**
         * Mandatory all withdraw targets
         */
        readonly MAWT: (Creep | AnyStoreStructure | Tombstone | Ruin | Resource)[]

        _OAWT: (Creep | AnyStoreStructure | Tombstone | Ruin | Resource)[]

        /**
         * Optional all withdraw targets
         */
        readonly OAWT: (Creep | AnyStoreStructure | Tombstone | Ruin | Resource)[]

        _METT: (Creep | AnyStoreStructure | Tombstone)[]

        /**
         * Mandatory energy transfer targets
         */
        readonly METT: (Creep | AnyStoreStructure | Tombstone)[]

        _OETT: (Creep | AnyStoreStructure | Tombstone)[]

        /**
         * Optional energy transfer targets
         */
        readonly OETT: (Creep | AnyStoreStructure | Tombstone)[]

        _MATT: (Creep | AnyStoreStructure | Tombstone)[]

        /**
         * Mandatory all transfer targets
         */
        readonly MATT: (Creep | AnyStoreStructure | Tombstone)[]

        _OATT: (Creep | AnyStoreStructure | Tombstone)[]

        /**
         * Optional all transfer targets
         */
        readonly OATT: (Creep | AnyStoreStructure | Tombstone)[]

        _MEFTT: (Creep | AnyStoreStructure | Tombstone)[]

        /**
         * Mandatory Energy Fill Transfer Targets
         */
        readonly MEFTT: (Creep | AnyStoreStructure | Tombstone)[]

        _MOFTT: (Creep | AnyStoreStructure | Tombstone)[]

        /**
         * Mandatory Other Fill Transfer Targets
         */
        readonly MOFTT: (Creep | AnyStoreStructure | Tombstone)[]
    }

    interface DepositRecord {
        decay: number
        needs: number[]
    }

    interface RoomMemory {
        /**
         * A packed representation of the center of the fastFiller
         */
        anchor: number

        /**
         * A description of the room's defining properties that can be used to assume other properties
         */
        type: RoomTypes

        /**
         * A set of names of remotes controlled by this room
         */
        remotes: string[]

        /**
         * If the room can be constructed by the base planner
         */
        notClaimable: boolean

        sourceIds: Id<Source>[]

        commune: string

        /**
         * A list of the efficacies of each source in the room
         */
        sourceEfficacies: number[]

        /**
         * A list of needs the remote wants met
         */
        needs: number[]

        /**
         * The room owner
         */
        owner: string

        /**
         * The controller's level
         */
        level: number

        powerEnabled: boolean

        /**
         * Wether the room has a terminal
         */
        terminal: boolean

        /**
         * The number of towers in the room
         */
        towers: number

        /**
         * The amount of stored energy in the room
         */
        energy: number

        /**
         * A set of roomNames that portals in this room go to
         */
        portalsTo: string[]

        /**
         * The last tick the room was scouted at
         */
        lastScout: number | undefined

        /**
         * The room name of the commune's claim target
         */
        claimRequest: string

        /**
         *
         */
        attackRequests: string[]

        /**
         * The room name of the room's ally creep target
         */
        allyCreepRequest: string

        cSiteTargetID: Id<ConstructionSite>

        stampAnchors: Partial<Record<StampTypes, number[]>>

        abandoned: number | undefined

        powerBanks: { [roomName: string]: number[] }

        deposits: Record<Id<Deposit>, DepositRecord>

        /**
         * Wether or not commune planning has been completed for the room
         */
        planned: boolean

        /**
         * Remote Planned, wether or not remote planning has been completed for the room
         */
        RP: boolean

        /**
         * Remote Stamp Anchors
         */
        RSA: Partial<Record<RemoteStampTypes, string>>

        /**
         * Source Positions, packed positions around sources where harvesters can sit
         */
        SP: string[]

        /**
         * Defensive Threat
         */
        DT: number

        /**
         * Offensive Threat
         */
        OT: number

        /**
         * Hauler Size, what the maxCost of a hauler should be to accomidate for CPU usage
         */
        HS: number

        /**
         * Hauler Update, how many ticks ago the hauler size was updated
         */
        HU: number
    }

    // Creeps

    interface Creep {
        /**
         * The packed position of the moveRequest, if one has been made
         */
        moveRequest: number

        /**
         * Wether the creep moved a resource this tick
         */
        movedResource: boolean

        /**
         * The packed coord the creep is trying to act upon, if it exists
         */
        moved?: number

        /**
         * Wether the creep did a harvest, build, upgrade, dismantle, or repair this tick
         */
        worked: boolean

        /**
         * Wether the creep rangedHealed or rangedAttacked this tick
         */
        ranged: boolean

        /**
         * Wether the creep healed or attacked this tick
         */
        meleed: boolean

        /**
         * Whether the creep is actively pulling another creep or not
         */
        pulling: boolean

        /**
         * Whether the creep is actively getting pulled by another creep or not
         */
        gettingPulled: boolean

        /**
         * The creep's opts when trying to make a moveRequest intra tick
         */
        pathOpts: PathOpts

        squad: Duo | Quad | undefined

        // Functions

        preTickManager(): void

        /**
         * Wether the creep's respawn time is equal to its remaining ticks to live
         */
        isDying(): boolean

        advancedPickup(target: Resource): boolean

        advancedTransfer(target: Creep | AnyStoreStructure, resourceType?: ResourceConstant, amount?: number): boolean

        advancedWithdraw(
            target: Creep | AnyStoreStructure | Tombstone | Ruin,
            resourceType?: ResourceConstant,
            amount?: number,
        ): boolean

        /**
         * Harvests a source and informs the result, while recording the result if successful
         */
        advancedHarvestSource(source: Source): boolean

        /**
         * Attempts multiple methods to upgrade the controller
         */
        advancedUpgradeController(): boolean

        /**
         * Attempts multiple methods to build one of our construction sites
         */
        advancedBuildCSite(): boolean

        /**
         * Attempts multiple methods to build an ally construction site
         */
        advancedBuildAllyCSite(): boolean

        /**
         *
         */
        findRampartRepairTarget(workPartCount: number, excluded?: Set<Id<StructureRampart>>): Structure | false

        /**
         *
         */
        findRepairTarget(excluded?: Set<Id<Structure<StructureConstant>>>): Structure | false

        findOptimalSourceName(): boolean

        findSourcePos(sourceName: number): boolean

        findMineralHarvestPos(): boolean

        findFastFillerPos(): boolean

        /**
         *
         */
        needsNewPath(goalPos: RoomPosition, cacheAmount: number, path: RoomPosition[] | undefined): boolean

        /**
         *
         */
        createMoveRequest(opts: MoveRequestOpts): boolean

        findShovePositions(avoidPackedPositions: Set<number>): RoomPosition[]

        shove(shoverPos: RoomPosition): boolean

        /**
         * Try to enforce a moveRequest and inform the result
         */
        runMoveRequest(): boolean

        /**
         *
         */
        recurseMoveRequest(queue?: string[]): void

        /**
         * Decides if the creep needs to get more resources or not
         */
        needsResources(): boolean

        isOnExit(): boolean

        findTotalHealPower(range?: number): number

        findRecycleTarget(): StructureSpawn | StructureContainer | false

        advancedRecycle(): boolean

        advancedRenew(): void

        advancedReserveController(): boolean

        findCost(): number

        passiveHeal(): boolean

        /**
         * Heal nearby allies without moving
         */
        aggressiveHeal(): boolean

        /**
         * Attack nearby enemies without moving
         */
        passiveRangedAttack(): boolean

        reserveWithdrawEnergy(): void

        reserveTransferEnergy(): void

        // Reservation

        deleteReservation(index: number): void

        createReservation(
            type: Reservations,
            target: Id<AnyStoreStructure | Creep | Tombstone | Ruin | Resource>,
            amount: number,
            resourceType?: ResourceConstant,
        ): void

        /**
         * Deletes reservations with no target, pre-emptively modifies store values
         */
        reservationManager(): void

        fulfillReservation(): boolean

        // Getters

        _role: CreepRoles

        /**
         * The lifetime designation that boardly describes what the creep should do
         */
        readonly role: CreepRoles

        _cost: number

        /**
         * The amount of energy required to spawn the creep
         */
        readonly cost: number

        _commune: string

        /**
         * The name of the room the creep is from
         */
        readonly commune: string

        _reservation: Reservation | false

        readonly reservation: Reservation | false

        _strength: number

        /**
         * A numerical measurement of the combat abilites of the creep
         */
        readonly strength: number

        _attackStrength: number

        /**
         * The protential damage the creep can intent
         */
        readonly attackStrength: number

        _healStrength: number

        /**
         * The potential heal the creep can intent
         */
        readonly healStrength: number

        _parts: Partial<Record<BodyPartConstant, number>>

        /**
         * The number of parts organized by type the creep has
         */
        readonly parts: Partial<Record<BodyPartConstant, number>>

        _boosts: Partial<Record<MineralBoostConstant, number>>

        /**
         * The number of boosts organized by type the creep has
         */
        readonly boosts: Partial<Record<MineralBoostConstant, number>>

        _towerDamage: number

        /**
         * The amount of tower damage, accounting for maximum possible enemy heal, that can be done in the room
         */
        readonly towerDamage: number

        _message: string

        /**
         * The cumulative message to present in say()
         */
        message: string
    }

    interface CreepMemory {
        /**
         * Wether the creep is old enough to need a replacement
         */
        dying: boolean

        /**
         * A name of the creep's designated source
         */
        sourceName: 'source1' | 'source2'

        /**
         * The Source Index of recorded sources in the room
         */
        SI: number

        /**
         * The creep's packedPos for a designated target
         */
        packedPos: number

        /**
         * The last time a path was cached in memory
         */
        lastCache: number

        /**
         * An array of positions desciring where the creep neeeds to move to get to its goal
         */
        path: string

        /**
         * The position the creep is or has tried to path to
         */
        goalPos: string

        /**
         * Whether the creep is intended to move on its own or not
         */
        getPulled: boolean

        /**
         * The target for which the creep should repair
         */
        repairTarget: Id<Structure>

        /**
         * The name of the room the scout is trying to scout
         */
        scoutTarget: string

        /**
         * The name of the room the scout is trying to sign
         */
        signTarget: string

        /**
         * The name of the room the creep is remoting for
         */
        remote: string

        /**
         * The target ID of the task (for hubHaulers)
         */
        taskTarget: Id<Creep | AnyStoreStructure>

        /**
         * An array of targets with information to manage the resources of
         */
        reservations: Reservation[]

        /**
         * The target for which the creep should dismantle
         */
        dismantleTarget: Id<Structure>

        /**
         * Wether or not the creep Needs Resources
         */
        NR: boolean

        /**
         * Wether or not the creep should Use Roads
         */
        roads: boolean

        /**
         * The rampart repair quota the creep currently has decided on
         */
        quota: number

        /**
         * The size of squad the creep is attempting to form
         */
        squadSize: 'quad' | 'duo' | undefined

        /**
         * The type of attack the creep's squad is attempting
         */
        squadType: 'rangedAttack' | 'attack' | 'dismantle'

        /**
         * Attack Request, the name of the room the creep should
         */
        AR: string | undefined

        /**
         * Recycle Target, the spawn ID the creep is going to recycle
         */
        RecT: Id<StructureSpawn | StructureContainer> | undefined

        /**
         * Ticks Waited for an arbitrary event
         */
        TW: number

        /**
         * Rampart Only Shoving, informs wether the creep must be shoved to viable ramparts or not
         */
        ROS: boolean
    }

    // PowerCreeps

    interface PowerCreep {}

    interface PowerCreepMemory {}

    // Structures

    interface Structure {
        realHits: number
    }

    interface StructureSpawn {
        /**
         * Wether the spawn has renewed a creep this tick
         */
        hasRenewed: boolean

        /**
         * Wether the structure has been transfered or withdrawn from
         */
        hasHadResourcesMoved: boolean

        // Functions

        advancedSpawn(spawnRequest: SpawnRequest): ScreepsReturnCode
    }

    interface StructureExtension {
        /**
         * Wether the structure has been transfered or withdrawn from
         */
        hasHadResourcesMoved: boolean
    }

    interface StructureTower {
        inactionable: boolean
    }

    interface StructureFactory {
        manager(): void

        /**
         * Converts energy into batteries given conditions
         */
        createBatteries(): boolean

        /**
         * Converts batteries into energy, given conditions
         */
        createEnergy(): boolean
    }

    interface RoomObject {
        // Functions

        /**
         * Finds the present total store usage number of this RoomObject
         * @param resourceType A resourceConstant to ensure proper querying of limit store RoomObjects
         */
        usedStore(resourceType?: ResourceConstant): number

        /**
         * Finds the total free store capacity of this RoomObject
         * @param resourceType A resourceConstant to ensure proper querying of limit store RoomObjects
         */
        freeStore(resourceType?: ResourceConstant): number

        /**
         * Finds the total free store capacity of a specific resource for this RoomObject
         */
        freeSpecificStore(resourceType?: ResourceConstant): number
    }

    interface Resource {
        // Getters

        _reserveAmount: number

        reserveAmount: number
    }

    interface Source {
        /**
         * The index of the source in room.sources
         */
        index: number
    }

    // Global

    namespace NodeJS {
        interface Global {
            [key: string]: any

            /**
             * Whether global is constructed or not
             */
            constructed: true | undefined

            /**
             * A strings to custom log as rich text
             */
            logs: string

            /**
             * The number of construction sites placed by the bot
             */
            constructionSitesCount: number

            packedRoomNames: { [roomName: string]: string }

            unpackedRoomNames: { [roomName: string]: string }
            roomStats: { [roomName: string]: RoomStats }

            terrainCoords: { [roomName: string]: CoordMap }

            // Command functions

            /**
             * Deletes all properties of global
             */
            clearGlobal(): void

            /**
             * Deletes all properties of Memory
             */
            clearMemory(): string

            /**
             * Kills all creeps owned by the bot
             */
            killCreeps(roles?: CreepRoles[]): string

            /**
             * Removes all specified construction sites owned by the bot
             */
            removeCSites(types?: BuildableStructureConstant[]): string

            /**
             * Destroys all specified structures owned by the bot
             */
            destroyStructures(roomName: string, types?: StructureConstant[]): string

            /**
             * Destroys all specified structures in communes
             */
            destroyCommuneStructures(types?: StructureConstant[]): string

            /**
             * Responds, or if needed, creates, a claim request for a specified room, by a specified room
             * @param request The roomName of the claimRequest to respond to
             * @param commune The commune to respond to the claimRequest
             */
            claim(request: string, communeName?: string): string

            /**
             * Responds, or if needed, creates, an attack request for a specified room, by a specified room
             */
            attack(request: string, communeName?: string): string

            /**
             * Creates an allyCreepRequest for a specified room, that can optionally be assigned to a specified commune
             */
            allyCreepRequest(request: string, communeName?: string): string
        }
    }
}

// Loop

export const loop = function () {
    memHack.modifyMemory()

    internationalManager.tickReset()
    internationalManager.run()
    /*
    let cpu = Game.cpu.getUsed()

    console.log(new InternationalManager())

    customLog('CPU USED FOR TEST 1', Game.cpu.getUsed() - cpu, myColors.white, myColors.green)
 */
    roomManager()

    internationalManager.mapVisualsManager()

    internationalManager.advancedGeneratePixel()
    internationalManager.advancedSellPixels()

    internationalManager.endTickManager()
}
