import { CommuneManager } from './room/commune/communeManager'
import { RoomManager } from './room/roomManager'
import { Duo } from './room/creeps/roleManagers/antifa/duo'
import { Quad } from './room/creeps/roleManagers/antifa/quad'
import { CombatRequestData } from 'international/constants'
import { Operator } from 'room/creeps/powerCreeps/operator'
import { MeleeDefender } from 'room/creeps/roleManagers/commune/meleeDefender'

declare global {
    interface ProfilerMemory {
        data: { [name: string]: ProfilerData }
        start?: number
        total: number
    }

    interface ProfilerData {
        calls: number
        time: number
    }

    interface Profiler {
        clear(): void
        output(): void
        start(): void
        status(): void
        stop(): void
        toString(): string
    }

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

    interface ResourceTarget {
        resource: ResourceConstant
        conditions?(communeManager: CommuneManager): any
        min: number
        max: number
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
        asymmetry?: number
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
        | 'antifaRangedAttacker'
        | 'antifaAttacker'
        | 'antifaHealer'
        | 'antifaDismantler'
        | 'antifaDowngrader'

    type QuadTransformTypes = 'rotateLeft' | 'rotateRight' | 'tradeHorizontal' | 'tradeVertical'

    interface PathGoal {
        pos: RoomPosition
        range: number
    }

    interface PathOpts {
        /**
         * Not required when pathing for creeps
         */
        origin?: RoomPosition
        goals: PathGoal[]
        /**
         * room types as keys to weight based on properties
         */
        typeWeights?: { [weight: string]: number }
        plainCost?: number
        swampCost?: number
        maxRooms?: number
        flee?: boolean
        creep?: Creep

        avoidAbandonedRemotes?: boolean

        weightStructures?: Partial<{ [key in StructureConstant]: number }>

        /**
         * An object with keys of weights and values of positions
         */

        weightPositions?: { [weight: string]: Coord[] | RoomPosition[] }

        /**
         *
         */
        weightCostMatrixes?: string[]

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
        /**
         * Wether or not to attempt a cardinal flood
         */
        cardinalFlood?: boolean
    }

    interface FindClosestPosOfValueOptsAsym extends FindClosestPosOfValueOpts {
        /**
         * The x and y offset from the top left of the stamp
         */
        offset: number
        /**
         * The asymmetrical x and y offset from the top left of the stamp
         */
        asymOffset: number
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
        spawnGroup?: string[]
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

    type FlagNames = 'disableTowers'

    type LogisticTaskTypes = 'transfer' | 'withdraw' | 'pickup' | 'offer'

    interface LogisticTask {
        ID: number
        Type: LogisticTaskTypes
        TargetID: Id<AnyStoreStructure | Creep | Tombstone | Ruin | Resource>
        ResourceType: ResourceConstant
    }

    interface CreepLogisticTask {
        /**
         * The Type of logistic task
         */
        T: LogisticTaskTypes
        /**
         * The Amount of resources involved
         */
        A: number
        /**
         * The Resource Type involved
         */
        RT: ResourceConstant
    }

    interface CreepLogisticTansferTask extends CreepLogisticTask {
        /**
         * The Type of logistic task
         */
        T: 'transfer'
        /**
         * Target ID
         */
        TID: Id<AnyStoreStructure>
    }

    interface CreepLogisticWithdrawTask extends CreepLogisticTask {
        /**
         * The Type of logistic task
         */
        T: 'withdraw'
        /**
         * Target ID
         */
        TID: Id<AnyStoreStructure | Tombstone | Ruin | Creep>
    }

    interface CreepLogisticPickupTask extends CreepLogisticTask {
        /**
         * The Type of logistic task
         */
        T: 'pickup'
        /**
         * Target ID
         */
        TID: Id<AnyStoreStructure>
    }

    interface CreepLogisticOfferTask extends CreepLogisticTask {
        /**
         * The Type of logistic task
         */
        T: 'offer'
        /**
         * Target ID
         */
        TID: Id<AnyStoreStructure>
    }

    interface PowerTask {
        taskID: number
        targetID: Id<Structure | Source>
        powerType: PowerConstant
        packedCoord: string
        cooldown: number
        priority: number
    }

    interface PackedPowerTask {
        /**
         * Target ID
         */
        TID: Id<Structure | Source>
        /**
         * Power Type
         */
        PT: PowerConstant
        /**
         * Cooldown
         */
        C: number
    }

    type Reservations = 'transfer' | 'withdraw' | 'pickup'

    interface Reservation {
        type: Reservations
        amount: number
        resourceType: ResourceConstant
        targetID: Id<AnyStoreStructure | Creep | Tombstone | Ruin | Resource>
    }

    type CombatRequestTypes = 'attack' | 'harass' | 'defend'

    interface ClaimRequest {
        /**
         * The name of the room responding to the request
         */
        responder?: string
        data: number[]
    }

    interface AllyCreepRequest {
        /**
         * The name of the room responding to the request
         */
        responder?: string
        data: number[]
    }

    interface CombatRequest {
        /**
         * The Type of attack request
         */
        T: CombatRequestTypes
        /**request
         * The name of the room responding to the request
         */
        responder?: string
        data: number[]
    }

    interface ControllerLevel {
        level: number
        progress: number
        progressTotal: number
    }
    interface RoomStats {
        [name: string]: number
        /**
         * Game Time
         */
        gt: number
        /**
         * Remote Count
         */
        rc: number
        /**
         * Remote CPU Usage
         */
        rcu: number
        /**
         * Remote Energy Stored
         */
        res: number
        /**
         * Remote Energy Input Harvest
         */
        reih: number
        /**
         * Remote Energy Output Repair Other (non-barricade structures)
         */
        reoro: number
        /**
         * Remote Energy Output Build
         */
        reob: number
    }

    interface RoomCommuneStats extends RoomStats {
        [name: string]: number
        /**
         * Controller Level
         */
        cl: number
        /**
         * Energy Input Harvest
         */
        eih: number
        /**
         * Energy Input Bought
         */
        eib?: number
        /**
         * Energy Output Upgrade
         */
        eou: number
        /**
         * Energy Output Repair Other (non-barricade structures)
         */
        eoro: number
        /**
         * Energy Output Repair Wall or Rampart
         */
        eorwr: number
        /**
         * Energy Output Build
         */
        eob: number
        /**
         * Energy Output Sold
         */
        eos: number
        /**
         * Energy Output Spawn
         */
        eosp: number
        /**
         * Energy Output Power
         */
        eop: number
        /**
         * Minerals Harvested
         */
        mh: number
        /**
         * Energy Stored
         */
        es: number

        /**
         * Batteries Stored *10
         */
        bes: number
        /**
         * Creep Count
         */
        cc: number
        /**
         * Total Creep Count
         */
        tcc: number
        /**
         * CPU Usage
         */
        cu: number
        /**
         * Spawn Usage
         */
        su: number
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
        rooms: { [key: string]: RoomCommuneStats }
        constructionSiteCount: number
    }

    type StatsRoomTypes = 'commune' | 'remote'

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
        allyPlayers: string[]

        /**
         * A list of usernames to treat as neutral
         */
        nonAggressionPlayers: string[]

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
         * Wether or not to automatically create attack requests for viable targets
         */
        autoAttack: boolean

        /**
         * Wether the bot should enable ramparts when there is no enemy present
         */
        publicRamparts: boolean

        /**
         * Wether the bot should try trading with its allies
         */
        allyTrading: boolean

        /**
         * Wether or not the bot should be using the market
         */
        marketUsage: boolean

        /**
         * Wether or not the bot should be using customLog
         */
        logging: boolean

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

        combatRequests: { [roomName: string]: CombatRequest }

        allyCreepRequests: { [roomName: string]: AllyCreepRequest }

        stats: Partial<Stats>

        players: { [playerName: string]: Partial<PlayerInfo> }

        masterPlan: { resources?: { [key in ResourceConstant]?: number } }

        // Other

        profiler: ProfilerMemory
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
        myCreeps: { [key in CreepRoles]?: string[] }

        /**
         * The number of my creeps in the room
         */
        myCreepsAmount: number

        /**
         * An object with keys of roles with properties of arrays of power creep names belonging to the role
         */
        myPowerCreeps: { [key in PowerClassConstant]?: string[] }

        /**
         * The number of my power creeps in the room
         */
        myPowerCreepsAmount: number

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
        creepsOfRemote: { [key: string]: { [key: string]: string[] } }

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
         * Wether the towers can sufficiently deal with the enemy threat in the room
         */
        towerInferiority: boolean

        baseCoords: CoordMap

        rampartCoords: CoordMap

        roadCoords: CoordMap

        /**
         * A matrix with indexes of packed coords and values of creep names
         */
        creepPositions: Map<string, string>

        /**
         * A matrix with indexes of packed coords and values of creep names
         */
        powerCreepPositions: Map<string, string>

        /**
         * A matrix with indexes of packed coords and values of creep names
         */
        moveRequests: Map<string, string[]>

        roomManager: RoomManager

        communeManager: CommuneManager

        /**
         * The names of creeps looking to join a squad
         */
        squadRequests: Set<string>

        powerTasks: { [ID: number]: PowerTask }

        attackingDefenderIDs: Set<Id<Creep>>
        defenderEnemyTargetsWithDamage: Map<Id<Creep>, number>
        defenderEnemyTargetsWithDefender: Map<Id<Creep>, Id<Creep>[]>
        towerAttackTarget: Creep

        // Functions

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

        targetVisual(coord1: Coord, coord2: Coord, visualize?: boolean): void

        /**
         * Generates a path between two positions
         */
        advancedFindPath(opts: PathOpts): RoomPosition[]

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

        createAttackCombatRequest(): void

        createHarassCombatRequest(): void

        createDefendCombatRequest(opts?: { [key: string]: number }): void

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
            /**
             * The smallest number to convert into an avoid value
             */
            minAvoid?: number,
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
            /**
             * The smallest number to convert into an avoid value
             */
            minAvoid?: number,
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
         * Flood fills a room until it finds the closest pos with a value greater than or equal to the one specified, that does not infringe on disabled tiles
         */
        findClosestPosOfValueAsym(opts: FindClosestPosOfValueOptsAsym): RoomPosition | false

        /**
         *
         */
        pathVisual(path: RoomPosition[], color: keyof Colors, visualize?: boolean): void

        errorVisual(coord: Coord, visualize?: boolean): void

        /**
         * Finds and records a construction site for builders to target
         */
        findAllyCSiteTargetID(creep: Creep): boolean

        /**
         * Groups positions with contigiousness, structured similarily to a flood fill
         */
        groupRampartPositions(rampartPositions: number[]): RoomPosition[][]

        findUnprotectedCoords(visuals?: boolean): void

        /**
         *
         */
        findPositionsInsideRect(x1: number, y1: number, x2: number, y2: number): RoomPosition[]

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

        visualizeCoordMap(coordMap: CoordMap, color?: boolean): void

        visualizeCostMatrix(cm: CostMatrix, color?: boolean): void

        coordHasStructureTypes(coord: Coord, types: Set<StructureConstant>): boolean

        createPowerTask(target: Structure | Source, powerType: PowerConstant, priority: number): PowerTask

        /**
         * Crudely estimates a room's income by accounting for the number of work parts owned by sourceHarvesters
         */
        estimateIncome(): number

        getPartsOfRoleAmount(role: CreepRoles, type?: BodyPartConstant): number

        createClaimRequest(): boolean

        findSwampPlainsRatio(): number

        // General roomFunctions

        claimRequestManager(): void
        combatRequestManager(): void

        allyCreepRequestManager(): void

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

        findMaxCostPerCreep(maxCostPerCreep: number): number

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

        // Market functions

        advancedSell(resourceType: ResourceConstant, amount: number, targetAmount: number): boolean

        advancedBuy(resourceType: ResourceConstant, amount: number, targetAmount: number): boolean

        // Construction functions

        remoteConstructionManager(): void

        remotePlanner(commune: Room): boolean

        clearOtherStructures(): void

        remoteConstructionPlacement(): void

        communeConstructionPlacement(): void

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

        // Room Getters

        readonly global: Partial<RoomGlobal>

        _anchor: RoomPosition | undefined

        readonly anchor: RoomPosition | undefined

        // Resources

        _sources: Source[]

        readonly sources: Source[]

        _sourcesByEfficacy: Source[]

        readonly sourcesByEfficacy: Source[]

        _mineral: Mineral

        readonly mineral: Mineral

        // Creeps

        _enemyCreeps: Creep[]

        readonly enemyCreeps: Creep[]

        _enemyAttackers: Creep[]

        readonly enemyAttackers: Creep[]

        _allyCreeps: Creep[]

        readonly allyCreeps: Creep[]

        _myDamagedCreeps: Creep[]

        readonly myDamagedCreeps: Creep[]

        _myDamagedPowerCreeps: PowerCreep[]

        readonly myDamagedPowerCreeps: PowerCreep[]

        _allyDamagedCreeps: Creep[]

        readonly allyDamagedCreeps: Creep[]

        // Buildings

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

        _dismantleTargets: Structure[]

        readonly dismantleTargets: Structure[]

        _destructableStructures: Structure[]

        readonly destructableStructures: Structure[]

        _combatStructureTargets: Structure[]

        readonly combatStructureTargets: Structure[]

        // Resource info

        _sourcePositions: RoomPosition[][]

        readonly sourcePositions: RoomPosition[][]

        _usedSourceCoords: Set<string>[]

        readonly usedSourceCoords: Set<string>[]

        _sourcePaths: RoomPosition[][]

        readonly sourcePaths: RoomPosition[][]

        _centerUpgradePos: RoomPosition | false

        readonly centerUpgradePos: RoomPosition | false

        _upgradePositions: RoomPosition[]

        readonly upgradePositions: RoomPosition[]

        _usedUpgradeCoords: Set<string>

        readonly usedUpgradeCoords: Set<string>

        _controllerPositions: RoomPosition[]

        readonly controllerPositions: RoomPosition[]

        readonly upgradePathLength: number

        _mineralPositions: RoomPosition[]

        readonly mineralPositions: RoomPosition[]

        _usedMineralCoords: Set<string>

        readonly usedMineralCoords: Set<string>

        _fastFillerPositions: RoomPosition[]

        readonly fastFillerPositions: RoomPosition[]

        _usedFastFillerCoords: Set<string>

        readonly usedFastFillerCoords: Set<string>

        _remoteNamesBySourceEfficacy: string[]

        readonly remoteNamesBySourceEfficacy: string[]

        _remoteSourceIndexesByEfficacy: string[]

        readonly remoteSourceIndexesByEfficacy: string[]

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

        readonly droppedResources: Resource[]

        _actionableWalls: StructureWall[]

        readonly actionableWalls: StructureWall[]

        _quadCostMatrix: CostMatrix

        readonly quadCostMatrix: CostMatrix

        _quadBulldozeCostMatrix: CostMatrix

        readonly quadBulldozeCostMatrix: CostMatrix

        _enemyDamageThreat: boolean

        readonly enemyDamageThreat: boolean

        _enemyThreatCoords: Set<string>

        readonly enemyThreatCoords: Set<string>

        _flags: Partial<{ [key in FlagNames]: Flag }>

        readonly flags: { [key in FlagNames]: Flag }

        _defensiveRamparts: StructureRampart[]

        readonly defensiveRamparts: StructureRampart[]

        _factory: StructureFactory

        readonly factory: StructureFactory

        _powerSpawn: StructurePowerSpawn

        readonly powerSpawn: StructurePowerSpawn

        _nuker: StructureNuker

        readonly nuker: StructureNuker

        _observer: StructureObserver

        readonly observer: StructureObserver

        _resourcesInStoringStructures: Partial<{ [key in ResourceConstant]: number }>

        readonly resourcesInStoringStructures: Partial<{ [key in ResourceConstant]: number }>

        _unprotectedEnemyCreeps: Creep[]

        readonly unprotectedEnemyCreeps: Creep[]

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

        _METT: (Creep | AnyStoreStructure)[]

        /**
         * Mandatory energy transfer targets
         */
        readonly METT: (Creep | AnyStoreStructure)[]

        _OETT: (Creep | AnyStoreStructure)[]

        /**
         * Optional energy transfer targets
         */
        readonly OETT: (Creep | AnyStoreStructure)[]

        _MATT: (Creep | AnyStoreStructure)[]

        /**
         * Mandatory all transfer targets
         */
        readonly MATT: (Creep | AnyStoreStructure)[]

        _OATT: (Creep | AnyStoreStructure)[]

        /**
         * Optional all transfer targets
         */
        readonly OATT: (Creep | AnyStoreStructure)[]

        _MEFTT: (Creep | AnyStoreStructure)[]

        /**
         * Mandatory Energy Fill Transfer Targets
         */
        readonly MEFTT: (Creep | AnyStoreStructure)[]

        _MOFTT: (Creep | AnyStoreStructure)[]

        /**
         * Mandatory Other Fill Transfer Targets
         */
        readonly MOFTT: (Creep | AnyStoreStructure)[]
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
         * Type of a room that generally describes properties of the room
         */
        T: RoomTypes

        /**
         * A set of names of remotes controlled by this room
         */
        remotes: string[]

        /**
         * Not Claimable, if the room can be constructed by the base planner
         */
        NC: boolean

        /**
         * Source IDs of the sources in the room
         */
        SIDs: Id<Source>[]

        commune: string

        /**
         * Source Efficacies, An array of path distances from the remote's sources to its commune
         */
        SE: number[]

        /**
         * Reservation Efficacy, the path distance from the remote's sources to its commune
         */
        RE: number

        /**
         * A list of needs the remote wants met
         */
        data: number[]

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
         * Last Scouted Tick, the last tick the room was scouted at
         */
        LST: number | undefined

        /**
         * The room name of the commune's claim target
         */
        claimRequest: string

        /**
         *
         */
        combatRequests: string[]

        /**
         * The room name of the room's ally creep target
         */
        allyCreepRequest: string

        cSiteTargetID: Id<ConstructionSite>

        stampAnchors: Partial<Record<StampTypes, number[]>>

        powerBanks: { [roomName: string]: number[] }

        deposits: Record<Id<Deposit>, DepositRecord>

        /**
         * Planning Completed, Wether or not commune planning has been completed for the room
         */
        PC: boolean

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
         * Mineral Positions, packed positions around the mineral where harvesters can sit
         */
        MP: string

        /**
         * Controller Positions, packed positions around the controller where reservers and downgraders can sit
         */
        CP: string

        /**
         * Defensive Threat
         */
        DT: number

        /**
         * Offensive Threat
         */
        OT: number

        /**
         * Minimum Hauler Cost, what the maxCost of a hauler should be to accomidate for CPU usage
         */
        MHC: number

        /**
         * Hauler Update, how many ticks ago the hauler size was updated
         */
        HU: number

        factoryProduct: CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM
        factoryUsableResources: (CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY)[]

        marketData: {
            [RESOURCE_ENERGY]?: number
            sellAvg?: { [key in ResourceConstant]?: number }
            buyAvg?: { [key in ResourceConstant]?: number }
            aquire?: { [key in ResourceConstant]?: number }
        }
    }

    interface CreepFunctions {
        preTickManager(): void

        endTickManager(): void

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
        findRampartRepairTarget(): Structure | false

        /**
         *
         */
        findRepairTarget(): Structure | false

        findOptimalSourceIndex(): boolean

        findSourcePos(sourceIndex: number): false | Coord

        findMineralHarvestPos(): false | Coord

        /**
         *
         */
        needsNewPath(goalPos: RoomPosition, cacheAmount: number, path: RoomPosition[] | undefined): boolean

        /**
         *
         */
        createMoveRequest(opts: MoveRequestOpts): boolean | 'unpathable'

        assignMoveRequest(coord: Coord): void

        findShovePositions(avoidPackedPositions: Set<string>): RoomPosition[]

        shove(shoverPos: RoomPosition): boolean

        /**
         * Try to enforce a moveRequest and inform the result
         */
        runMoveRequest(): boolean

        /**
         *unpackCoordAsPos
         */
        recurseMoveRequest(queue?: string[]): void

        /**
         * Decides if the creep needs to get more resources or not
         */
        needsResources(): boolean

        findTotalHealPower(range?: number): number

        findRecycleTarget(): StructureSpawn | StructureContainer | false

        advancedRecycle(): boolean

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
    }

    interface CreepProperties {
        /**
         * The packed position of the moveRequest, if one has been made
         */
        moveRequest: string

        /**
         * Wether the creep moved a resource this tick
         */
        movedResource: boolean

        /**
         * The packed coord the creep is trying to act upon, if it exists. -1 means the move attempt failed
         */
        moved?: string | 'moved' | 'yield'

        /**
         * The creep's opts when trying to make a moveRequest intra tick
         */
        pathOpts: PathOpts
    }

    // Creeps

    interface Creep extends CreepFunctions, CreepProperties {

        combatTarget: Creep

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
         * The squad the creep belongs to
         */
        squad: Duo | Quad | undefined

        /**
         * Wether the squad has ran yet
         */
        squadRan: boolean

        // Creep Functions

        advancedRenew(): void

        findBulzodeTargets(goalCoord: RoomPosition): Id<Structure>[]

        findQuadBulldozeTargets(goalCoord: RoomPosition): Id<Structure>[]

        // Creep Getters

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

        _commune: Room | undefined

        /**
         * The name of the room the creep is from
         */
        readonly commune: Room | undefined

        _dying: boolean

        /**
         * Wether the creep is as old as the time it takes to respawn, or is past a role-based threshold
         */
        readonly dying: boolean

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

        _freeCapacityNextTick: number

        /**
         * The estimated total free capacity the creep will have next tick
         */
        freeCapacityNextTick: number

        _canMove: boolean

        readonly canMove: boolean

        _isOnExit: boolean

        readonly isOnExit: boolean
    }

    interface CreepMemory {
        /**
         * Wether the creep is old enough to need a replacement
         */
        D: boolean

        /**
         * The Source Index of recorded sources in the room
         */
        SI: 0 | 1

        /**
         * The creep's packedPos for a designated target
         */
        PC: string

        /**
         * Last Cache, the last time a path was cached in memory
         */
        LC: number

        /**
         * An array of positions desciring where the creep neeeds to move to get to its goal
         */
        P: string

        /**
         * Goal Pos, the position the creep is or has tried to path to
         */
        GP: string

        /**
         * Whether the creep is intended to move on its own or not
         */
        getPulled: boolean

        /**
         * The target for which the creep should repair
         */
        repairTarget: Id<Structure>

        /**
         * Scout Target, the name of the room the scout is trying to scout
         */
        scT: string

        /**
         * Sign Target, the name of the room the scout is trying to sign
         */
        siT: string

        /**
         * Remote Name of the room the creep is remoting for
         */
        RN: string

        /**
         * The target ID of the task (for hubHaulers)
         */
        taskTarget: Id<Creep | AnyStoreStructure>

        /**
         * Reservations, An array of targets with information to manage the resources of
         */
        Rs: Reservation[]

        /**
         * The target for which the creep should dismantle
         */
        dismantleTarget: Id<Structure>

        /**
         * Wether or not the creep Needs Resources
         */
        NR: boolean

        /**
         * Roads, wether or not the creep should use roads
         */
        R: boolean

        /**
         * The rampart repair quota the creep currently has decided on
         */
        quota: number

        /**
         * Squad Size of the squad the creep is attempting to form
         */
        SS: number | undefined

        /**
         * Squad Type the combat method the creep's squad is attempting
         */
        ST: 'rangedAttack' | 'attack' | 'dismantle'

        /**
         * Squad Formed, wether the creep has joined a squad or not
         */
        SF: boolean

        /**
         * Squad Member Names
         */
        SMNs: string[]

        /**
         * Quad Bulldoze Targets
         */
        QBTIDs: Id<Structure>[]

        /**
         * Combat Request Name, the name of the room the creep should do combat in
         */
        CRN: string | undefined

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

    interface PowerCreep extends CreepFunctions, CreepProperties {
        /**
         * Wether the creep has used a power this tick
         */
        powered: boolean
    }

    interface PowerCreepMemory {
        /**
         * Commune Name
         */
        CN: string

        /**
         * Task name, the method for which the creep is trying to run inter tick
         */
        TN: keyof Operator

        /**
         * Task target, the ID of the target the creep is targeting for its task
         */
        TTID: Id<Structure | Source>

        /**
         * Task Room Name, the name of the room the creep is trying to go to for its task
         */
        TRN: string
    }

    // Structures

    interface Structure {
        estimatedHits: number
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
        intended: boolean
    }

    interface StructureTerminal {
        intended: boolean
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
        freeStore(): number

        /**
         * Finds the total free store capacity of a specific resource for this RoomObject
         */
        freeSpecificStore(resourceType?: ResourceConstant): number

        // RoomObject getters

        _effectsData: Map<PowerConstant | EffectConstant, RoomObjectEffect>

        readonly effectsData: Map<PowerConstant | EffectConstant, RoomObjectEffect>

        _estimatedHits: number

        estimatedHits: number

        _estimatedStore: Partial<StoreDefinition>

        readonly estimatedStore: Partial<StoreDefinition>
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
            roomStats: { [roomType in StatsRoomTypes]: { [roomName: string]: RoomStats | RoomCommuneStats } }

            terrainCoords: { [roomName: string]: CoordMap }

            lastReset: number

            /**
             * Room names that have controllers we own
             */
            communes: Set<string>

            roomManagers: { [roomName: string]: RoomManager }

            communeManagers: { [roomName: string]: CommuneManager }

            // Command functions

            /**
             * Deletes all properties of global
             */
            clearGlobal(): void

            /**
             * Deletes all properties of Memory
             */
            clearMemory(avoidKeys?: string[]): string

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
             * @param requestName The roomName of the claimRequest to respond to
             * @param commune The commune to respond to the claimRequest
             */
            claim(requestName: string, communeName?: string): string

            deleteClaimRequests(): string

            /**
             * Responds, or if needed, creates, an attack request for a specified room, by a specified room
             */
            createCombatRequest(
                requestName: string,
                type: CombatRequestTypes,
                opts?: { [key: string]: number },
                communeName?: string,
            ): string

            /**
             * Deletes combatRequests for a specified room, if there are any
             */
            deleteCombatRequest(requestName: string): string

            /**
             * Creates an allyCreepRequest for a specified room, that can optionally be assigned to a specified commune
             */
            allyCreepRequest(requestName: string, communeName?: string): string

            deleteBasePlans(roomName?: string): string
        }
    }

    interface StringMap<T> {
        [key: string]: T
    }
    type StringMapGeneric<V, K extends string> = {
        [key in K]: V
    }
}
