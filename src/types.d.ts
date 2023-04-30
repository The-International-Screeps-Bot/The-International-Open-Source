import { CommuneManager } from './room/commune/commune'
import { RoomManager } from './room/room'
import { Duo } from './room/creeps/roleManagers/antifa/duo'
import { Quad } from './room/creeps/roleManagers/antifa/quad'
import {
    WorkRequestKeys,
    CombatRequestKeys,
    CreepMemoryKeys,
    CreepRoomLogisticsRequestKeys,
    DepositRequestKeys,
    HaulRequestKeys,
    NukeRequestKeys,
    PlayerMemoryKeys,
    PowerCreepMemoryKeys,
    PowerRequestKeys,
    RoomMemoryKeys,
    RoomTypes,
} from 'international/constants'
import { Operator } from 'room/creeps/powerCreeps/operator'
import { MeleeDefender } from 'room/creeps/roleManagers/commune/defenders/meleeDefender'
import { Settings } from 'international/settings'
import { DynamicSquad } from 'room/creeps/roleManagers/antifa/dynamicSquad'
import { BasePlans } from 'room/construction/basePlans'

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

    interface RoomCoord extends Coord {}

    interface Rect {
        x1: number
        y1: number
        x2: number
        y2: number
    }

    interface CostMatrix {
        _bits: Uint8Array
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

    type PartsByPriority =
        | 'tough'
        | 'claim'
        | 'attack'
        | 'ranged_attack'
        | 'secondaryTough'
        | 'work'
        | 'carry'
        | 'move'
        | 'secondaryAttack'
        | 'heal'

    interface ResourceTarget {
        conditions?(communeManager: CommuneManager): any
        min(communeManager?: CommuneManager): number
        max(communeManager?: CommuneManager): number
    }

    type SquadTypes = 'duo' | 'quad' | 'dynamic'
    type SquadCombatTypes = 'rangedAttack' | 'attack' | 'dismantle'
    type SquadMoveTypes = 'transport' | 'attack'

    type RemoteStampTypes = 'road' | 'container'

    type StampTypes =
        | 'fastFiller'
        | 'hub'
        | 'inputLab'
        | 'outputLab'
        | 'tower'
        | 'observer'
        | 'sourceLink'
        | 'sourceExtension'
        | 'container'
        | 'extractor'
        | 'road'
        | 'minCutRampart'
        | 'onboardingRampart'
        | 'shieldRampart'
        | 'gridExtension'
        | 'nuker'
        | 'powerSpawn'

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

    type StampAnchors = Partial<Record<StampTypes, Coord[]>>
    /**
     * key of packed stamp type with values of packed coord list
     */
    type PackedStampAnchors = Partial<{ [packedStampType: string]: string }>

    type PosMap<T> = T[]

    type CoordMap = Uint8Array

    type CreepRoles =
        | 'sourceHarvester'
        | 'hauler'
        | 'requestHauler'
        | 'controllerUpgrader'
        | 'builder'
        | 'maintainer'
        | 'mineralHarvester'
        | 'hubHauler'
        | 'fastFiller'
        | 'meleeDefender'
        | 'rangedDefender'
        | 'remoteSourceHarvester'
        | 'remoteHauler'
        | 'remoteReserver'
        | 'remoteDefender'
        | 'remoteCoreAttacker'
        | 'remoteDismantler'
        | 'scout'
        | 'claimer'
        | 'vanguard'
        | 'allyVanguard'
        | 'antifaRangedAttacker'
        | 'antifaAttacker'
        | 'antifaHealer'
        | 'antifaDismantler'
        | 'antifaDowngrader'

    interface TerminalRequest {
        ID: string
        /**
         * Preference from 0-1 where 1 is least prefered
         */
        priority: number
        amount: number
        resource: ResourceConstant
        roomName: string
    }

    interface BasePlanCoord {
        structureType: BuildableStructureConstant
        minRCL: number
    }

    interface RampartPlanCoord {
        minRCL: number
        /**
         * Flase or truthy number
         */
        coversStructure: number
        /**
         * Flase or truthy number
         */
        buildForNuke: number
        /**
         * Flase or truthy number
         */
        buildForThreat: number
    }

    type QuadTransformTypes = 'none' | 'rotateLeft' | 'rotateRight' | 'tradeHorizontal' | 'tradeVertical'

    interface PathGoal {
        pos: RoomPosition
        range: number
    }

    interface CustomPathFinderArgs {
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

        weightCoords?: { [roomName: string]: { [packedCoord: string]: number } }

        /**
         * The name of the costMatrix to weight. Will apply minimal alterations in use
         */
        weightCostMatrix?: string

        /**
         * The names of the costMatrixes to weight. Will apply onto cost matrix in use
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

        weightStructurePlans?: boolean
    }

    interface BasePlanAttempt {
        score: number
        stampAnchors: PackedStampAnchors
        basePlans: string
        rampartPlans: string
        communeSources: Id<Source>[]
        sourceHarvestPositions: string[]
        sourcePaths: string[]
        mineralHarvestPositions: string
        mineralPath: string
        centerUpgradePos: string
        upgradePath: string
    }

    interface RCLPlannedStructureType {
        structures: number
        minRCL: number
    }

    interface CombatStrength {
        dismantle: number
        melee: number
        ranged: number
        heal: number
    }

    interface FindClosestPos {
        coordMap: CoordMap
        sources: Coord[]
        targetCondition(coord: Coord): boolean
        /**
         * Wether or not to attempt a cardinal flood
         */
        cardinalFlood?: boolean
        visuals?: boolean
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
        /**
         * The protection offset of the stamp
         */
        protectionOffset?: number
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

    interface MoveRequestOpts extends CustomPathFinderArgs {
        cacheAmount?: number
    }

    interface MoveRequestByPathOpts {
        packedPath: string
        loose?: boolean
        remoteName?: string
    }

    type OrderedStructurePlans = BuildObj[]

    interface BuildObj {
        structureType: BuildableStructureConstant
        x: number
        y: number
    }

    interface SpawnRequestArgs {
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

    interface SpawnRequestSkeleton {
        role: CreepRoles
        priority: number
        defaultParts: number
        bodyPartCounts: { [key in PartsByPriority]: number }
    }

    interface SpawnRequest {
        role: CreepRoles
        priority: number
        defaultParts: number
        bodyPartCounts: { [key in PartsByPriority]: number }
        body?: BodyPartConstant[]
        tier: number
        cost: number
        extraOpts: SpawnOptions
    }

    type FlagNames = 'disableTowerAttacks' | 'internationalDataVisuals'

    type RoomLogisticsRequestTypes = 'transfer' | 'withdraw' | 'pickup' | 'offer'

    interface RoomLogisticsRequest {
        ID: string
        type: RoomLogisticsRequestTypes
        /**
         * Consider in weighting the task, lower is more preffered
         */
        priority?: number
        targetID: Id<AnyStoreStructure | Creep | Tombstone | Ruin | Resource>
        resourceType: ResourceConstant
        amount: number
        /**
         * If the responder should only take the task if it will use its full capacity. Default is false
         */
        onlyFull?: boolean
        /**
         * The ID of a roomLogisticsTask or store structure
         */
        delivery?: Id<AnyStoreStructure> | string
        /**
         * Wether the responder should interact with reserveStore of the target
         */
        noReserve?: boolean
        // /**
        //  * The estimated income, positive or negative that is expected per tick for the request target
        //  */
        // income?: number
        // /**
        //  * The amount for the potential or actual responding creep
        //  */
        // personalAmount?: number
    }

    interface CreateRoomLogisticsRequestArgs {
        type: RoomLogisticsRequestTypes
        target: AnyStoreStructure | Creep | Tombstone | Ruin | Resource
        resourceType?: ResourceConstant
        onlyFull?: boolean
        priority?: number
        maxAmount?: number
    }

    interface findNewRoomLogisticsRequestArgs {
        types?: Set<RoomLogisticsRequestTypes>
        /**
         * Use this to command certain resourceTypes
         */
        resourceTypes?: Set<ResourceConstant>
        /**
         * DO NOT USE THIS TO COMMAND CERTAIN RESOURCETYPES, instead use resourceTypes
         */
        conditions?(request: RoomLogisticsRequest): any
    }

    interface PowerTask {
        taskID: string
        targetID: Id<Structure | Source>
        powerType: PowerConstant
        packedCoord: string
        cooldown: number
        priority: number
    }

    interface ControllerLevel {
        level: number
        progress: number
        progressTotal: number
    }
    interface RoomStats {
        /**
         * Game Time
         */
        gt: number
        /**
         * Remote Count
         */
        rc: number
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
        /**
         * Remote Room CPU Usage
         */
        rrocu: number
        /**
         * Remote Room Visuals Manager CPU Usage
         */
        rrvmcu: number
        /**
         * Remote Construction Manager CPU Usage
         */
        rcmcu: number
        /**
         * Remote Role Manager CPU Usage
         */
        rrolmcu: number
        /**
         * Remote Role Manager Per Creep CPU Usage
         */
        rrolmpccu: number
        /**
         * Remote End Tick Creep Manager CPU Usage
         */
        retcmcu: number
        /**
         * Remote Power Role Manager CPU Usage
         */
        rprmcu: number
        /**
         * Remote Power Role Manager Per Creep CPU Usage
         */
        rprmpccu: number
    }

    interface RoomCommuneStats extends RoomStats {
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
         * Power Creep Count
         */
        pcc: number
        /**
         * Spawn Usage as a decimal
         */
        su: number
        /**
         * Ally Creep Request Manager CPU Usage
         */
        acrmcu: number
        /**
         * Claim Request Manager CPU Usage
         */
        clrmcu: number
        /**
         * Tower Manager CPU Usage
         */
        tmcu: number
        /**
         * Spawn Manager CPU Usage
         */
        smcu: number
        /**
         * Combat Request Manager CPU Usage
         */
        cormcu: number
        /**
         * Defence Manager CPU Usage
         */
        dmcu: number
        /**
         * Spawn Request Manager CPU Usage
         */
        srmcu: number
        /**
         * Room CPU Usage
         */
        rocu: number
        /**
         * Room Visuals Manager CPU Usage
         */
        rvmcu: number
        /**
         * Construction Manager CPU Usage
         */
        cmcu: number
        /**
         * Role Manager CPU Usage
         */
        rolmcu: number
        /**
         * Role Manager Per Creep CPU Usage
         */
        rolmpccu: number
        /**
         * End Tick Creep Manager CPU Usage
         */
        etcmcu: number
        /**
         * Power Role Manager CPU Usage
         */
        prmcu: number
        /**
         * Power Role Manager Per Creep CPU Usage
         */
        prmpccu: number
    }

    interface CpuUsers {
        /**
         * International Manager CPU Usage
         */
        imcu: number

        /**
         * Creep Organizer CPU Usage
         */
        cocu: number

        /**
         * Map Visuals Manager CPU Usage
         */
        mvmcu: number

        /**
         * Power Creep Organizer CPU Usage
         */
        pccu: number

        /**
         * Tick Config CPU Usage
         */
        tccu: number

        /**
         * Room Manager CPU Usage
         */
        roomcu: number

        /**
         * Stats Manager CPU Usage
         */
        smcu: number
    }

    type InternationalStatNames = keyof CpuUsers
    type RoomStatNames = keyof RoomStats
    type RoomCommuneStatNames = keyof RoomCommuneStats

    interface Stats {
        lastReset: number

        lastTickTimestamp: number
        lastTick: number
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

        heapUsage: number
        gcl: ControllerLevel

        gpl: ControllerLevel
        rooms: { [roomName: string]: Partial<RoomCommuneStats> }
        constructionSiteCount: number
        CPUUsers: CpuUsers
    }

    type StatsRoomTypes = RoomTypes.commune | RoomTypes.remote

    interface ShardVisionMemory {
        shards?: { [shardName: string]: number }
        lastSeen: number
    }

    interface Memory extends Settings {
        /**
         * The name of the user
         */
        me: string

        /**
         * An ongoing record of the latest ID assigned by the bot
         */
        ID: number

        chantIndex: number

        /**
         * the tick of the last holistic configuration opperation
         */
        lastConfig: number

        /**
         * An object of constrctionsSites with keys of site IDs and properties of the site's age
         */
        constructionSites: { [ID: string]: number }

        /**
         *
         */
        workRequests: { [roomName: string]: Partial<WorkRequest> }

        combatRequests: { [roomName: string]: Partial<CombatRequest> }

        haulRequests: { [roomName: string]: Partial<HaulRequest> }

        nukeRequests: { [roomName: string]: Partial<NukeRequest> }

        stats: Partial<Stats>

        players: { [playerName: string]: Partial<PlayerMemory> }

        masterPlan: { resources?: { [key in ResourceConstant]?: number } }

        // Other

        profiler: ProfilerMemory
    }

    interface RawMemory {
        _parsed: Memory
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

    type InterfaceToKV<T> = {
        [K in keyof T]: { key: K; value: T[K] }
    }[keyof T]

    interface RoomGlobal {
        [key: string]: any

        // Paths

        source1PathLength: number
        source2PathLength: number
        upgradePathLength: number

        // Containers

        sourceContainers: Id<StructureContainer>[]
        fastFillerContainerLeft: Id<StructureContainer> | undefined
        fastFillerContainerRight: Id<StructureContainer> | undefined
        controllerContainer: Id<StructureContainer> | undefined
        mineralContainer: Id<StructureContainer> | undefined

        // Links

        controllerLink: Id<StructureLink> | undefined
        fastFillerLink: Id<StructureLink> | undefined
        hubLink: Id<StructureLink> | undefined

        //

        defaultCostMatrix: number[]
    }

    interface TotalEnemyCombatStrength {
        melee: number
        ranged: number
        heal: number
        dismantle: number
    }

    interface Room {
        /**
         * The names of creeps harvesting each source
         */
        creepsOfSource: string[][]

        estimatedSourceIncome: number[]

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
        creepsFromRoom: Partial<{ [key in CreepRoles]: string[] }>

        /**
         * The cumulative amount of creeps with a communeName value of this room's name
         */
        creepsFromRoomAmount: number

        /**
         * An object with keys of roles and properties of the number of creeps with the role from this room
         */
        creepsOfRemote: { [remoteName: string]: Partial<{ [key in CreepRoles]: string[] }> }

        /**
         * A set of roomNames representing the targets stof scouts from this commune
         */
        scoutTargets: Set<string>

        /**
         * Arguments for construction spawn requests
         */
        spawnRequestsArgs: SpawnRequestArgs[]

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
        creepPositions: { [packedCoord: string]: string }

        /**
         * A matrix with indexes of packed coords and values of creep names
         */
        powerCreepPositions: { [packedCoord: string]: string }

        /**
         * A matrix with indexes of packed coords and values of creep names
         */
        moveRequests: { [packedCoord: string]: string[] }

        roomManager: RoomManager

        communeManager: CommuneManager

        /**
         * The names of creeps looking to join a squad
         */
        squadRequests: Set<string>

        roomLogisticsRequests: { [key in RoomLogisticsRequestTypes]: { [ID: string]: RoomLogisticsRequest } }
        powerTasks: { [ID: string]: PowerTask }

        attackingDefenderIDs: Set<Id<Creep>>
        defenderEnemyTargetsWithDamage: Map<Id<Creep>, number>
        defenderEnemyTargetsWithDefender: Map<Id<Creep>, Id<Creep>[]>
        towerAttackTarget: Creep

        upgradeStrength: number
        mineralHarvestStrength: number

        /**
         * The carry parts needed to effectively run the commune
         */
        haulerNeed: number

        usedRampartIDs: Map<Id<StructureRampart>, Id<Creep>>

        // Functions

        /**
         *
         * @param pos1 The position of the thing performing the action
         * @param pos2 The position of the thing getting intereacted with
         * @param type The type of interaction, success if not provided
         */
        actionVisual(pos1: RoomPosition, pos2: RoomPosition, type?: string): void

        targetVisual(coord1: Coord, coord2: Coord, visualize?: boolean): void

        /**
         * Tries to delete a task with the provided ID and response state
         */
        deleteTask(taskID: any, responder: boolean): void

        scoutByRoomName(): number | false

        scoutRemote(scoutingRoom?: Room): number | false
        scoutEnemyReservedRemote(): number | false
        scoutEnemyUnreservedRemote(): number | false
        scoutMyRemote(scoutingRoom: Room): number | false

        scoutEnemyRoom(): number

        basicScout(): number

        /**
         * Finds the type of a room and initializes its custom properties
         * @param scoutingRoom The room that is performing the scout operation
         */
        advancedScout(scoutingRoom: Room): number

        makeRemote(scoutingRoom: Room): boolean

        createAttackCombatRequest(opts?: Partial<CombatRequest>): void

        createHarassCombatRequest(opts?: Partial<CombatRequest>): void

        createDefendCombatRequest(opts?: Partial<CombatRequest>): void

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
         * Flood fills a room until it finds one of a set of positions
         */
        findClosestPos(opts: FindClosestPos): RoomPosition | false

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
        findAdjacentPositions(rx: number, ry: number): RoomPosition[]

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

        visualizeCoordMap(coordMap: CoordMap, color?: boolean, magnification?: number): void

        visualizeCostMatrix(cm: CostMatrix, color?: boolean, magnification?: number): void

        coordHasStructureTypes(coord: Coord, types: Set<StructureConstant>): boolean

        createPowerTask(target: Structure | Source, powerType: PowerConstant, priority: number): PowerTask | false

        highestWeightedStoringStructures(resourceType: ResourceConstant): AnyStoreStructure | false

        createRoomLogisticsRequest(args: CreateRoomLogisticsRequestArgs): void

        partsOfRoles: Partial<{ [key in CreepRoles]: Partial<{ [key in BodyPartConstant]: number }> }>

        getPartsOfRole(role: CreepRoles): Partial<{ [key in BodyPartConstant]: number }>

        createWorkRequest(): boolean

        findSwampPlainsRatio(): number

        // General roomFunctions

        workRequestManager(): void
        combatRequestManager(): void

        trafficManager(): void

        // Spawn functions

        constructSpawnRequests(opts: SpawnRequestArgs | false): void

        findMaxCostPerCreep(maxCostPerCreep: number): number

        createSpawnRequest(
            priority: number,
            role: CreepRoles,
            defaultParts: number,
            bodyPartCounts: { [key in PartsByPriority]: number },
            tier: number,
            cost: number,
            memory: any,
        ): void

        spawnRequestIndividually(opts: SpawnRequestArgs): void

        spawnRequestByGroup(opts: SpawnRequestArgs): void

        // Market functions

        advancedSell(resourceType: ResourceConstant, amount: number, targetAmount: number): boolean

        advancedBuy(resourceType: ResourceConstant, amount: number, targetAmount: number): boolean

        // Construction functions

        remoteConstructionManager(): void

        remotePlanner(commune: Room): boolean

        clearOtherStructures(): void

        remoteConstructionPlacement(): void

        communeConstructionPlacement(): void

        findStructureAtCoord<T extends Structure>(coord: Coord, conditions: (structure: T) => boolean): T | false
        findStructureAtXY<T extends Structure>(x: number, y: number, conditions: (structure: T) => boolean): T | false

        findCSiteAtCoord<T extends ConstructionSite>(coord: Coord, conditions: (cSite: T) => boolean): T | false
        findCSiteAtXY<T extends ConstructionSite>(x: number, y: number, conditions: (cSite: T) => boolean): T | false

        findStructureInsideRect<T extends Structure>(
            x1: number,
            y1: number,
            x2: number,
            y2: number,
            condition: (structure: T) => boolean,
        ): T | false

        findStructureInRange<T extends Structure>(
            startCoord: Coord,
            range: number,
            condition: (structure: T) => boolean,
        ): T | false

        /**
         * Generates a square visual at the specified coordinate
         */
        coordVisual(x: number, y: number, fill?: string): void

        // Room Getters

        _global: RoomGlobal
        readonly global: RoomGlobal

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

        _enemyCSites: ConstructionSite[]
        readonly enemyCSites: ConstructionSite[]

        _allyCSites: ConstructionSite[]
        readonly allyCSites: ConstructionSite[]

        _allyCSitesByType: Partial<Record<StructureConstant, ConstructionSite[]>>
        readonly allyCSitesByType: Record<StructureConstant, ConstructionSite[]>

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

        _usedSourceHarvestCoords: Set<string>
        readonly usedSourceHarvestCoords: Set<string>

        _usedUpgradeCoords: Set<string>
        readonly usedUpgradeCoords: Set<string>

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

        _fastFillerContainerLeft: StructureContainer | false
        readonly fastFillerContainerLeft: StructureContainer | undefined

        _fastFillerContainerRight: StructureContainer | false
        readonly fastFillerContainerRight: StructureContainer | undefined

        _controllerContainer: StructureContainer | false
        readonly controllerContainer: StructureContainer | undefined

        _mineralContainer: StructureContainer | false
        readonly mineralContainer: StructureContainer | false

        // Links

        _fastFillerLink: StructureLink | false
        readonly fastFillerLink: StructureLink | false

        _hubLink: StructureLink | false
        readonly hubLink: StructureLink | false

        _droppedEnergy: Resource[]
        readonly droppedEnergy: Resource[]

        _droppedResources: Resource[]
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

        _enemyThreatGoals: PathGoal[]
        readonly enemyThreatGoals: PathGoal[]

        _flags: Partial<{ [key in FlagNames]: Flag }>
        readonly flags: { [key in FlagNames]: Flag }

        _factory: StructureFactory
        readonly factory: StructureFactory

        _powerSpawn: StructurePowerSpawn
        readonly powerSpawn: StructurePowerSpawn

        _nuker: StructureNuker
        readonly nuker: StructureNuker

        _observer: StructureObserver
        readonly observer: StructureObserver

        _resourcesInStoringStructures: Partial<{ [key in ResourceConstant]: number }>
        readonly resourcesInStoringStructures: { [key in ResourceConstant]: number }

        _unprotectedEnemyCreeps: Creep[]
        readonly unprotectedEnemyCreeps: Creep[]

        _exitCoords: Set<string>
        readonly exitCoords: Set<string>

        _advancedLogistics: boolean
        readonly advancedLogistics: boolean

        _defaultCostMatrix: CostMatrix
        readonly defaultCostMatrix: CostMatrix

        _totalEnemyCombatStrength: TotalEnemyCombatStrength
        readonly totalEnemyCombatStrength: TotalEnemyCombatStrength
    }

    interface DepositRecord {
        decay: number
        needs: number[]
    }

    interface IdealSquadMembers {}

    interface CreepFunctions {
        preTickManager(): void

        endTickManager(): void

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

        findUpgradePos(): RoomPosition | false

        /**
         * Attempts multiple methods to upgrade the controller
         */
        advancedUpgradeController(): boolean

        advancedBuild(): number
        builderGetEnergy(): number

        /**
         * Attempts multiple methods to build one of our construction sites
         */
        advancedBuildCSite(cSite: ConstructionSite): number

        /**
         * Attempts multiple methods to build an ally construction site
         */
        advancedBuildAllyCSite(): boolean

        /**
         *
         */
        findNewRampartRepairTarget(): StructureRampart | false
        /**
         *
         */
        findNewRepairTarget(): Structure<BuildableStructureConstant> | false
        /**
         *
         */
        findRepairTarget(): Structure<BuildableStructureConstant> | false

        /**
         * Find a source index when not necessarily in a commune or remote
         */
        findSourceIndex(): boolean
        findCommuneSourceIndex(): boolean
        findRemoteSourceIndex(): boolean

        /**
         * Find a source harvest pos when not necessarily in a commune or remote
         */
        findSourceHarvestPos(sourceIndex: number): RoomPosition | false
        findCommuneSourceHarvestPos(sourceIndex: number): false | RoomPosition
        findRemoteSourceHarvestPos(sourceIndex: number): false | RoomPosition

        findMineralHarvestPos(): false | RoomPosition

        /**
         *
         */
        needsNewPath(path: RoomPosition[] | undefined, opts: MoveRequestOpts): boolean

        /**
         *
         */
        createMoveRequestByPath(opts: MoveRequestOpts, pathOpts: MoveRequestByPathOpts): boolean | 'unpathable'

        /**
         *
         */
        createMoveRequest(opts: MoveRequestOpts): boolean | 'unpathable'

        assignMoveRequest(coord: Coord): void

        findShoveCoord(avoidPackedCoords: Set<string>, targetCoord?: Coord): Coord

        shove(avoidPackedCoords?: Set<string>): boolean

        /**
         * Try to enforce a moveRequest and inform the result
         */
        runMoveRequest(): boolean

        /**
         *unpackCoordAsPos
         */
        recurseMoveRequest(queue?: string[]): void

        avoidEnemyThreatCoords(): boolean

        /**
         * Decides if the creep needs to get more resources or not
         */
        needsResources(): boolean

        /**
         * Wether the creep has a > 0 amount of a resorce that isn't energy
         */
        hasNonEnergyResource(): boolean

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
        moved?: string | 'moved' | 'wait'

        /**
         * The creep's opts when trying to make a moveRequest intra tick
         */
        pathOpts: CustomPathFinderArgs

        /**
         * Wether the creep is allowed accept room logistics requests that require delivery
         */
        noDelivery: boolean

        /**
         * The coordinate the creep would prefer to be shoved towards, if it is to be shoved
         */
        actionCoord: Coord

        _macroHealStrength: number
        /**
         * The heal strength of the creep alongside its neighbours that we dopn't own
         */
        readonly macroHealStrength: number

        _reserveHits: number
        /**
         * The max possible hits - accounting for nearby healers - subtracted by damage attempts
         */
        reserveHits: number

        _grossTowerDamage: number
        /**
         * The highest possible tower damage
         */
        readonly grossTowerDamage: number

        _netTowerDamage: number
        /**
         * The highest possible tower damage, accounting for maximum possible enemy heal
         */
        readonly netTowerDamage: number

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

        _isOnExit: boolean
        readonly isOnExit: boolean

        _exitTo: string | boolean
        readonly exitTo: string | boolean
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
        squad: Duo | Quad | DynamicSquad | undefined

        /**
         * Wether the squad has ran yet
         */
        squadRan: boolean

        /**
         * The ID of the spawn the creep is spawning in, if it is spawning
         */
        spawnID: Id<StructureSpawn>

        // Creep Functions

        activeRenew(): void

        passiveRenew(): void

        findBulzodeTargets(goalCoord: RoomPosition): Id<Structure>[]

        findQuadBulldozeTargets(goalCoord: RoomPosition): Id<Structure>[]

        manageSpawning(spawn: StructureSpawn): void

        roomLogisticsRequestManager(): void

        findRoomLogisticsRequest(args?: findNewRoomLogisticsRequestArgs): CreepRoomLogisticsRequest | 0
        findRoomLogisticsRequestTypes(args?: findNewRoomLogisticsRequestArgs): Set<RoomLogisticsRequestTypes>
        canAcceptRoomLogisticsRequest(requestType: RoomLogisticsRequestTypes, requestID: string): boolean
        createBackupStoringStructuresRoomLogisticsRequest(
            types?: Set<RoomLogisticsRequestTypes>,
            resourceTypes?: Set<ResourceConstant>,
        ): CreepRoomLogisticsRequest | 0
        createBackupStoringStructuresRoomLogisticsRequestTransfer(): CreepRoomLogisticsRequest | 0
        createBackupStoringStructuresRoomLogisticsRequestWithdraw(
            resourceTypes?: Set<ResourceConstant>,
        ): CreepRoomLogisticsRequest | 0
        findRoomLogisticRequestAmount(request: RoomLogisticsRequest): number

        runRoomLogisticsRequestAdvanced(args?: findNewRoomLogisticsRequestArgs): number
        runRoomLogisticsRequestsAdvanced(args?: findNewRoomLogisticsRequestArgs): boolean

        runRoomLogisticsRequest(): number
        runRoomLogisticsRequests(): boolean

        findCreepRoomLogisticsRequestAmount(
            type: RoomLogisticsRequestTypes,
            targetID: Id<AnyStoreStructure | Creep | Tombstone | Ruin | Resource>,
            amount: number,
            resourceType: ResourceConstant,
        ): number
        createCreepRoomLogisticsRequest(
            type: RoomLogisticsRequestTypes,
            targetID: Id<AnyStoreStructure | Creep | Tombstone | Ruin | Resource>,
            amount: number,
            resourceType?: ResourceConstant,
        ): number

        // Creep Getters

        _nameData: string[]
        nameData: string[]

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

        _defaultParts: number
        readonly defaultParts: number

        _customID: number
        readonly customID: number

        _strength: number
        /**
         * A numerical measurement of the combat abilites of the creep
         */
        readonly strength: number

        _upgradeStrength: number

        readonly upgradeStrength: number

        _combatStrength: CombatStrength

        readonly combatStrength: CombatStrength

        _defenceStrength: number

        /**
         * The multiplier to incoming damage the creep has
         */
        readonly defenceStrength: number

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

        _canMove: boolean
        readonly canMove: boolean

        _idealSquadMembers: IdealSquadMembers
        readonly idealSquadMembers: IdealSquadMembers
    }

    interface PowerCreep extends CreepFunctions, CreepProperties {
        /**
         * Wether the creep has used a power this tick
         */
        powered: boolean

        _powerCooldowns: Partial<Map<PowerConstant, number>>

        readonly powerCooldowns: Partial<Map<PowerConstant, number>>
    }

    // Structures

    interface Structure {
        nextHits: number

        // Getters

        _RCLActionable: boolean

        /**
         * Wether the structure is disable or not by the room's controller level
         */
        readonly RCLActionable: boolean
    }

    interface StructureSpawn {
        /**
         * Wether the spawn has renewed a creep this tick
         */
        renewed: boolean

        /**
         * Wether the structure has been transfered or withdrawn from
         */
        hasHadResourcesMoved: boolean

        // Functions

        testSpawn(spawnRequest: SpawnRequest, ID: number): ScreepsReturnCode

        advancedSpawn(spawnRequest: SpawnRequest, ID: number): ScreepsReturnCode
    }

    interface StructureExtension {
        /**
         * Wether the structure has been transfered or withdrawn from
         */
        hasHadResourcesMoved: boolean
    }

    interface StructureTower {
        estimateDamageGross(targetCoord: Coord): number
        /**
         * Accounts for enemy defence and macro heal
         */
        estimateDamageNet(target: Creep): number
    }

    interface StructureTerminal {
        intended: boolean
    }

    interface CustomStore extends StoreDefinition {
        parentID: Id<AnyStoreStructure>
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

        freeNextStoreOf(resourceType: ResourceConstant): number

        freeReserveStoreOf(resourceType: ResourceConstant): number

        // RoomObject getters

        _effectsData: Map<PowerConstant | EffectConstant, RoomObjectEffect>

        readonly effectsData: Map<PowerConstant | EffectConstant, RoomObjectEffect>

        _nextHits: number

        /**
         * The estimated hits amount next tick
         */
        nextHits: number

        // _nextStore: Partial<StoreDefinition>

        // /**
        //  * The estimated store values next tick
        //  */
        // readonly nextStore: Partial<StoreDefinition>

        _nextStore: Partial<CustomStore>

        /**
         * The estimated store values next tick
         */
        readonly nextStore: Partial<CustomStore>

        _usedNextStore: number

        readonly usedNextStore: number

        readonly freeNextStore: number

        _reserveStore: Partial<CustomStore>

        /**
         * The store values including that reserved by tasks
         */
        readonly reserveStore: Partial<CustomStore>

        _usedReserveStore: number

        readonly usedReserveStore: number

        readonly freeReserveStore: number

        _reservePowers: Set<PowerConstant>

        readonly reservePowers: Set<PowerConstant>
    }

    interface Resource {
        // Getters

        _nextAmount: number

        nextAmount: number

        _reserveAmount: number

        reserveAmount: number
    }

    interface Source {
        communeIndex: number | undefined
        remoteIndex: number | undefined
    }

    // Memory value types

    interface RoomMemory {
        [RoomMemoryKeys.type]: number
        [RoomMemoryKeys.lastScout]: number

        // Types specific

        [RoomMemoryKeys.owner]: string
        [RoomMemoryKeys.RCL]: number
        [RoomMemoryKeys.powerEnabled]: boolean
        [RoomMemoryKeys.constructionSiteTarget]: Id<ConstructionSite>
        [RoomMemoryKeys.stampAnchors]: PackedStampAnchors
        [RoomMemoryKeys.communeSources]: Id<Source>[]
        [RoomMemoryKeys.communeSourceHarvestPositions]: string[]
        [RoomMemoryKeys.communeSourcePaths]: string[]
        [RoomMemoryKeys.mineralPath]: string
        [RoomMemoryKeys.mineralPositions]: string
        [RoomMemoryKeys.centerUpgradePos]: string
        [RoomMemoryKeys.upgradePositions]: string
        [RoomMemoryKeys.upgradePath]: string
        [RoomMemoryKeys.basePlans]: string
        [RoomMemoryKeys.rampartPlans]: string
        [RoomMemoryKeys.mineral]: Id<Mineral>
        [RoomMemoryKeys.score]: number
        [RoomMemoryKeys.dynamicScore]: number
        [RoomMemoryKeys.dynamicScoreUpdate]: number
        [RoomMemoryKeys.communePlanned]: boolean

        // Commune

        [RoomMemoryKeys.remotes]: string[]
        [RoomMemoryKeys.powerBanks]: { [roomName: string]: number[] }
        [RoomMemoryKeys.deposits]: Record<Id<Deposit>, DepositRecord>
        [RoomMemoryKeys.workRequest]: string
        [RoomMemoryKeys.combatRequests]: string[]
        [RoomMemoryKeys.haulRequests]: string[]
        [RoomMemoryKeys.nukeRequest]: string
        [RoomMemoryKeys.threatened]: number
        [RoomMemoryKeys.lastAttacked]: number
        [RoomMemoryKeys.minHaulerCost]: number
        [RoomMemoryKeys.minHaulerCostUpdate]: number
        [RoomMemoryKeys.greatestRCL]: number
        [RoomMemoryKeys.abandoned]: boolean
        [RoomMemoryKeys.marketData]: {
            [RESOURCE_ENERGY]?: number
            sellAvg?: { [key in ResourceConstant]?: number }
            buyAvg?: { [key in ResourceConstant]?: number }
            aquire?: { [key in ResourceConstant]?: number }
        }
        [RoomMemoryKeys.factoryProduct]: CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM
        [RoomMemoryKeys.factoryUsableResources]: (
            | CommodityConstant
            | MineralConstant
            | RESOURCE_GHODIUM
            | RESOURCE_ENERGY
        )[]

        // Remote

        [RoomMemoryKeys.commune]: string
        [RoomMemoryKeys.maxSourceIncome]: number[]
        [RoomMemoryKeys.remoteSourceHarvesters]: number[]
        [RoomMemoryKeys.remoteHaulers]: number[]
        [RoomMemoryKeys.remoteReserver]: number
        [RoomMemoryKeys.remoteCoreAttacker]: number
        [RoomMemoryKeys.remoteBuilder]: number
        [RoomMemoryKeys.remoteDismantler]: number
        [RoomMemoryKeys.abandon]: number
        [RoomMemoryKeys.use]: boolean
        [RoomMemoryKeys.enemyReserved]: boolean
        [RoomMemoryKeys.invaderCore]: number
        [RoomMemoryKeys.disableCachedPaths]: boolean
        [RoomMemoryKeys.remotePlanned]: boolean
        [RoomMemoryKeys.remoteStampAnchors]: PackedStampAnchors
        [RoomMemoryKeys.reservationEfficacy]: number
        [RoomMemoryKeys.remoteControllerPath]: string
        [RoomMemoryKeys.remoteControllerPositions]: string
        [RoomMemoryKeys.remoteSources]: Id<Source>[]
        [RoomMemoryKeys.remoteSourceHarvestPositions]: string[]
        [RoomMemoryKeys.remoteSourcePaths]: string[]

        // Ally

        // Enemy

        [RoomMemoryKeys.terminal]: boolean
        [RoomMemoryKeys.towers]: number
        [RoomMemoryKeys.energy]: number
        [RoomMemoryKeys.defensiveStrength]: number
        [RoomMemoryKeys.offensiveThreat]: number

        // Highway

        [RoomMemoryKeys.portalsTo]: string[]
    }

    interface PlayerMemory {
        [PlayerMemoryKeys.offensiveThreat]: number
        [PlayerMemoryKeys.defensiveStrength]: number
        [PlayerMemoryKeys.hate]: number
        [PlayerMemoryKeys.lastAttacked]: number
    }

    interface WorkRequest {
        [WorkRequestKeys.claimer]: number
        [WorkRequestKeys.vanguard]: number
        [WorkRequestKeys.abandon]: number
        [WorkRequestKeys.responder]: string
        [WorkRequestKeys.priority]: number
        [WorkRequestKeys.allyVanguard]: number
        [WorkRequestKeys.forAlly]: boolean
        [WorkRequestKeys.hauler]: boolean
    }

    type CombatRequestTypes = 'attack' | 'harass' | 'defend'

    interface CombatRequest {
        [CombatRequestKeys.abandon]: number
        [CombatRequestKeys.rangedAttack]: number
        [CombatRequestKeys.abandon]: number
        [CombatRequestKeys.dismantle]: number
        [CombatRequestKeys.downgrade]: number
        [CombatRequestKeys.minDamage]: number
        [CombatRequestKeys.minMeleeHeal]: number
        [CombatRequestKeys.minRangedHeal]: number
        [CombatRequestKeys.maxTowerDamage]: number
        [CombatRequestKeys.quads]: number
        [CombatRequestKeys.priority]: number
        [CombatRequestKeys.quadQuota]: number
        [CombatRequestKeys.inactionTimerMax]: number
        [CombatRequestKeys.inactionTimer]: number
        [CombatRequestKeys.maxThreat]: number
        [CombatRequestKeys.abandonments]: number
        [CombatRequestKeys.type]: CombatRequestTypes
        [CombatRequestKeys.responder]: string
    }

    interface NukeRequest {
        [NukeRequestKeys.y]: number
        [NukeRequestKeys.x]: number
        [NukeRequestKeys.responder]: string
        [NukeRequestKeys.priority]: number
    }

    interface HaulRequest {
        [HaulRequestKeys.type]: 'transfer' | 'withdraw'
        [HaulRequestKeys.distance]: number
        [HaulRequestKeys.timer]: number
        [HaulRequestKeys.priority]: number
        [HaulRequestKeys.abandon]: number
        [HaulRequestKeys.responder]: string
    }

    interface DepositRequest {
        [DepositRequestKeys.depositHarvester]: number
        [DepositRequestKeys.depositHauler]: number
        [DepositRequestKeys.abandon]: number
        [DepositRequestKeys.responder]: string
        [DepositRequestKeys.type]: DepositConstant
    }

    interface PowerRequest {
        [PowerRequestKeys.target]: Id<Structure | Source>
        [PowerRequestKeys.type]: PowerConstant
        [PowerRequestKeys.cooldown]: number
    }

    interface CreepRoomLogisticsRequest {
        [CreepRoomLogisticsRequestKeys.type]: RoomLogisticsRequestTypes
        [CreepRoomLogisticsRequestKeys.target]: Id<AnyStoreStructure | Creep | Tombstone | Ruin | Resource>
        [CreepRoomLogisticsRequestKeys.resourceType]: ResourceConstant
        [CreepRoomLogisticsRequestKeys.amount]: number
        [CreepRoomLogisticsRequestKeys.onlyFull]?: boolean
        [CreepRoomLogisticsRequestKeys.noReserve]?: boolean
    }

    interface CreepMemory {
        [CreepMemoryKeys.preferRoads]: boolean
        [CreepMemoryKeys.sourceIndex]: number
        [CreepMemoryKeys.dying]: boolean
        [CreepMemoryKeys.packedCoord]: string
        [CreepMemoryKeys.path]: string
        [CreepMemoryKeys.goalPos]: string
        [CreepMemoryKeys.usedPathForGoal]: string
        [CreepMemoryKeys.lastCache]: number
        [CreepMemoryKeys.structureTarget]: Id<Structure<BuildableStructureConstant>>
        [CreepMemoryKeys.remote]: string
        [CreepMemoryKeys.scoutTarget]: string
        [CreepMemoryKeys.signTarget]: string
        [CreepMemoryKeys.roomLogisticsRequests]: CreepRoomLogisticsRequest[]
        [CreepMemoryKeys.needsResources]: boolean
        [CreepMemoryKeys.squadSize]: number
        [CreepMemoryKeys.squadType]: SquadTypes
        [CreepMemoryKeys.squadCombatType]: SquadCombatTypes
        [CreepMemoryKeys.isSquadFormed]: boolean
        [CreepMemoryKeys.squadMembers]: string[]
        [CreepMemoryKeys.quadBulldozeTargets]: Id<Structure>[]
        [CreepMemoryKeys.haulRequest]: string
        [CreepMemoryKeys.ticksWaited]: number
        [CreepMemoryKeys.recycleTarget]: Id<StructureSpawn | StructureContainer> | undefined
        [CreepMemoryKeys.rampartOnlyShoving]: boolean
        [CreepMemoryKeys.rampartTarget]: Id<StructureRampart>
        [CreepMemoryKeys.taskRoom]: string
        [CreepMemoryKeys.getPulled]: boolean
        [CreepMemoryKeys.combatRequest]: string
        /**
         * Wether the creep is/was trying to flee for their designated
         */
        [CreepMemoryKeys.flee]: boolean
        [CreepMemoryKeys.squadMoveType]: SquadMoveTypes
    }

    interface PowerCreepMemory {
        [PowerCreepMemoryKeys.commune]: string
        [PowerCreepMemoryKeys.task]: keyof Operator
        [PowerCreepMemoryKeys.taskTarget]: Id<Structure | Source>
        [PowerCreepMemoryKeys.taskPower]: PowerConstant
        [PowerCreepMemoryKeys.taskRoom]: string
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
            roomStats: { [roomType in StatsRoomTypes]: { [roomName: string]: Partial<RoomStats | RoomCommuneStats> } }
            CPUUsers: CpuUsers

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
            clearMemory(includeSettings?: boolean): string

            /**
             * Kills all creeps owned by the bot
             */
            killCreeps(roles?: CreepRoles[]): string

            /**
             * Removes all specified construction sites owned by the bot
             */
            removeCSites(removeInProgress?: boolean, types?: BuildableStructureConstant[]): string

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
             * @param requestName The roomName of the workRequest to respond to
             * @param commune The commune to respond to the workRequest
             */
            claim(requestName: string, communeName?: string, score?: number): string

            /**
             * Deletes workRequests for a specified room, if there are any
             * @param roomName The roomName of the workRequest to delete
             */
            deleteWorkRequest(roomName: string): string

            deleteWorkRequests(): string

            /**
             * Responds, or if needed, creates, an attack request for a specified room, by a specified room
             */
            combat(
                requestName: string,
                type: CombatRequestTypes,
                opts?: Partial<{ [key in keyof typeof CombatRequestKeys]: CombatRequestKeys }>,
                communeName?: string,
            ): string

            /**
             * Deletes combatRequests for a specified room, if there are any
             */
            deleteCombatRequest(requestName: string): string

            deleteBasePlans(roomName?: string): string

            usedHeap(): string
        }
    }

    interface StringMap<T> {
        [key: string]: T
    }
    type StringMapGeneric<V, K extends string> = {
        [key in K]: V
    }
}
