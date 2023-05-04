import { packCoord } from 'other/codec'

export enum PlayerMemoryKeys {
    /**
     * Generally how good their offense is
     */
    offensiveThreat,
    /**
     * Generally how good their defense is
     */
    defensiveStrength,
    /**
     * How much we want them dead
     */
    hate,
    /**
     * The last time we were attacked by them
     */
    lastAttacked,
}

export enum WorkRequestKeys {
    claimer,
    vanguard,
    abandon,
    responder,
    priority,
    allyVanguard,
    forAlly,
    hauler,
}

export enum HaulRequestKeys {
    type,
    distance,
    timer,
    priority,
    abandon,
    responder,
}

export enum NukeRequestKeys {
    x,
    y,
    responder,
    priority,
}

export enum DepositRequestKeys {
    depositHarvester,
    depositHauler,
    abandon,
    responder,
    /**
     * The type of resource the deposit provides
     */
    type,
}

export enum CombatRequestKeys {
    abandon,
    rangedAttack,
    attack,
    dismantle,
    downgrade,
    minDamage,
    minMeleeHeal,
    minRangedHeal,
    maxTowerDamage,
    quads,
    priority,
    quadQuota,
    inactionTimerMax,
    inactionTimer,
    maxThreat,
    abandonments,
    /**
     * The type of attack request
     */
    type,
    responder,
}

export enum CreepRoomLogisticsRequestKeys {
    type,
    target,
    resourceType,
    amount,
    onlyFull,
    noReserve,
}

export enum CreepMemoryKeys {
    preferRoads,
    sourceIndex,
    dying,
    packedCoord,
    path,
    goalPos,
    usedPathForGoal,
    lastCache,
    structureTarget,
    remote,
    scoutTarget,
    signTarget,
    roomLogisticsRequests,
    needsResources,
    squadSize,
    squadType,
    squadCombatType,
    isSquadFormed,
    squadMembers,
    quadBulldozeTargets,
    haulRequest,
    ticksWaited,
    recycleTarget,
    rampartOnlyShoving,
    rampartTarget,
    taskRoom,
    getPulled,
    combatRequest,
    flee,
    squadMoveType,
}

export enum PowerCreepMemoryKeys {
    commune,
    /**
     * The name of the method queued for operation
     */
    task,
    taskTarget,
    /**
     * The type of power the creep should use
     */
    taskPower,
    taskRoom,
}

export enum PowerRequestKeys {
    target,
    type,
    cooldown,
}

export enum RoomMemoryKeys {
    type,
    lastScout,

    // Types specific

    owner,
    RCL,
    powerEnabled,
    constructionSiteTarget,
    stampAnchors,
    communeSources,
    communeSourceHarvestPositions,
    communeSourcePaths,
    mineralPath,
    mineralPositions,
    centerUpgradePos,
    upgradePositions,
    upgradePath,
    basePlans,
    rampartPlans,
    mineral,
    score,
    dynamicScore,
    dynamicScoreUpdate,
    communePlanned,

    // Commune

    remotes,
    powerBanks,
    deposits,
    workRequest,
    combatRequests,
    haulRequests,
    nukeRequest,
    threatened,
    lastAttacked,
    minHaulerCost,
    minHaulerCostUpdate,
    greatestRCL,
    abandoned,
    marketData,
    factoryProduct,
    factoryUsableResources,

    // Remote

    commune,
    maxSourceIncome,
    remoteSourceHarvesters,
    remoteHaulers,
    remoteReserver,
    remoteCoreAttacker,
    remoteBuilder,
    remoteDismantler,
    abandon,
    use,
    enemyReserved,
    invaderCore,
    disableCachedPaths,
    remotePlanned,
    remoteStampAnchors,
    reservationEfficacy,
    remoteControllerPath,
    remoteControllerPositions,
    remoteSources,
    remoteSourceHarvestPositions,
    remoteSourcePaths,

    // Ally

    // Enemy

    terminal,
    towers,
    energy,
    defensiveStrength,
    offensiveThreat,

    // Intersection

    portalsTo,
}

// General

export const mmoShardNames = new Set(['shard0', 'shard1', 'shard2', 'shard3'])

export const roomTypeProperties: Set<keyof RoomMemory> = new Set([
    RoomMemoryKeys.remotes,
    RoomMemoryKeys.deposits,
    RoomMemoryKeys.powerBanks,
    RoomMemoryKeys.communePlanned,
    RoomMemoryKeys.minHaulerCost,
    RoomMemoryKeys.minHaulerCostUpdate,
    RoomMemoryKeys.threatened,
    RoomMemoryKeys.lastAttacked,
    RoomMemoryKeys.abandoned,
    RoomMemoryKeys.score,
    RoomMemoryKeys.dynamicScore,
    RoomMemoryKeys.dynamicScoreUpdate,

    RoomMemoryKeys.commune,
    RoomMemoryKeys.reservationEfficacy,

    RoomMemoryKeys.owner,
    RoomMemoryKeys.RCL,

    RoomMemoryKeys.powerEnabled,
    RoomMemoryKeys.towers,
    RoomMemoryKeys.terminal,
    RoomMemoryKeys.energy,
    RoomMemoryKeys.offensiveThreat,
    RoomMemoryKeys.defensiveStrength,

    RoomMemoryKeys.portalsTo,
])

export enum RoomTypes {
    commune,
    remote,
    ally,
    allyRemote,
    neutral,
    enemy,
    enemyRemote,
    keeper,
    keeperCenter,
    highway,
    intersection,
}

export const roomTypes: Record<number, Set<keyof RoomMemory>> = {
    [RoomTypes.commune]: new Set([
        RoomMemoryKeys.remotes,
        RoomMemoryKeys.deposits,
        RoomMemoryKeys.powerBanks,
        RoomMemoryKeys.communePlanned,
        RoomMemoryKeys.minHaulerCost,
        RoomMemoryKeys.minHaulerCostUpdate,
        RoomMemoryKeys.threatened,
        RoomMemoryKeys.lastAttacked,
        RoomMemoryKeys.abandoned,
        RoomMemoryKeys.score,
        RoomMemoryKeys.dynamicScore,
        RoomMemoryKeys.dynamicScoreUpdate,
    ]),
    [RoomTypes.remote]: new Set([
        RoomMemoryKeys.commune,
        RoomMemoryKeys.reservationEfficacy,
        RoomMemoryKeys.communePlanned,
    ]),
    [RoomTypes.ally]: new Set([RoomMemoryKeys.owner, RoomMemoryKeys.RCL, RoomMemoryKeys.communePlanned]),
    [RoomTypes.allyRemote]: new Set([RoomMemoryKeys.owner, RoomMemoryKeys.communePlanned]),
    [RoomTypes.enemy]: new Set([
        RoomMemoryKeys.owner,
        RoomMemoryKeys.RCL,
        RoomMemoryKeys.powerEnabled,
        RoomMemoryKeys.towers,
        RoomMemoryKeys.terminal,
        RoomMemoryKeys.energy,
        RoomMemoryKeys.communePlanned,
        RoomMemoryKeys.offensiveThreat,
        RoomMemoryKeys.defensiveStrength,
    ]),
    [RoomTypes.enemyRemote]: new Set([RoomMemoryKeys.owner, RoomMemoryKeys.communePlanned]),
    [RoomTypes.neutral]: new Set([RoomMemoryKeys.communePlanned]),
    [RoomTypes.keeper]: new Set([RoomMemoryKeys.owner]),
    [RoomTypes.keeperCenter]: new Set([RoomMemoryKeys.owner]),
    [RoomTypes.highway]: new Set([]),
    [RoomTypes.intersection]: new Set([RoomMemoryKeys.portalsTo]),
}

export const constantRoomTypes: Set<Partial<RoomTypes>> = new Set([
    RoomTypes.keeper,
    RoomTypes.keeperCenter,
    RoomTypes.highway,
    RoomTypes.intersection,
])

export const roomTypesUsedForStats = [RoomTypes.commune, RoomTypes.remote]

export const creepRoles: CreepRoles[] = [
    'sourceHarvester',
    'hauler',
    'requestHauler',
    'controllerUpgrader',
    'builder',
    'maintainer',
    'mineralHarvester',
    'hubHauler',
    'fastFiller',
    'meleeDefender',
    'rangedDefender',
    'remoteSourceHarvester',
    'remoteHauler',
    'remoteReserver',
    'remoteDefender',
    'remoteCoreAttacker',
    'remoteDismantler',
    'scout',
    'claimer',
    'vanguard',
    'allyVanguard',
    'antifaRangedAttacker',
    'antifaAttacker',
    'antifaHealer',
    'antifaDismantler',
    'antifaDowngrader',
]

/**
 * Roles that will interact with the room logistics system
 */
export const roomLogisticsRoles: Set<CreepRoles> = new Set([
    'sourceHarvester',
    'hauler',
    'builder',
    'maintainer',
    'controllerUpgrader',
    'remoteSourceHarvester',
    'remoteHauler',
    'hubHauler',
    'allyVanguard',
])

export const powerCreepClassNames: PowerClassConstant[] = ['operator']

export enum TrafficPriorities {
    remoteHauler,
    hauler,
    requestHauler,
    scout,
    hubHauler,
    fastFiller,
    sourceHarvester,
    mineralHarvester,
    remoteSourceHarvester,
    remoteReserver,
    remoteDismantler,
    remoteCoreAttacker,
    vanguard,
    allyVanguard,
    controllerUpgrader,
    builder,
    claimer,
    remoteDefender,
    meleeDefender,
    rangedDefender,
    maintainer,
    antifaDismantler,
    antifaDowngrader,
    antifaHealer,
    antifaAttacker,
    antifaRangedAttacker,
}

export const version = `v2.${Memory.breakingVersion}.0`

// Set of messages to randomly apply to commune rooms

export const communeSign = 'A commune of the proletariat. Bourgeoisie not welcome here! ' + version

// Set of messages to randomly apply to non-commune rooms

export const nonCommuneSigns = [
    'The top 1% have more money than the poorest 4.5 billion',
    'McDonalds workers in the US make $10/hour. In Denmark, as a result of unions, they make $22/hour',
    'We have democracy in our policial system, should we not have it in our companies too?',
    'Workers of the world, unite; you have nothing to lose but your chains!',
    'Real democracy requires democracy in the workplace - Richard Wolff',
    'Adults spend a combined 13 years of their life under a dictatorship: the workplace',
    'Socialism is about worker ownership over the workplace',
    'Are trans women women? Yes. Obviously.',
    'Advancing the LGBTQ+ agenda <3',
    'Does Jeff Bezos work 56,000 times harder than his average worker? Because he gets paid like it',
]

export const chant = [
    'Creeps',
    'of',
    Game.shard.name,
    'unite',
    'you',
    'have',
    'nothing',
    'to',
    'lose',
    'but',
    'your',
    'chains!',
    undefined,
]

export const roomDimensions = 50

export const allStructureTypes: StructureConstant[] = [
    STRUCTURE_SPAWN,
    STRUCTURE_EXTENSION,
    STRUCTURE_ROAD,
    STRUCTURE_WALL,
    STRUCTURE_RAMPART,
    STRUCTURE_KEEPER_LAIR,
    STRUCTURE_PORTAL,
    STRUCTURE_CONTROLLER,
    STRUCTURE_LINK,
    STRUCTURE_STORAGE,
    STRUCTURE_TOWER,
    STRUCTURE_OBSERVER,
    STRUCTURE_POWER_BANK,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_EXTRACTOR,
    STRUCTURE_LAB,
    STRUCTURE_TERMINAL,
    STRUCTURE_CONTAINER,
    STRUCTURE_NUKER,
    STRUCTURE_FACTORY,
    STRUCTURE_INVADER_CORE,
]

export const buildableStructureTypes: BuildableStructureConstant[] = [
    STRUCTURE_SPAWN,
    STRUCTURE_EXTENSION,
    STRUCTURE_ROAD,
    STRUCTURE_WALL,
    STRUCTURE_RAMPART,
    STRUCTURE_LINK,
    STRUCTURE_STORAGE,
    STRUCTURE_TOWER,
    STRUCTURE_OBSERVER,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_EXTRACTOR,
    STRUCTURE_LAB,
    STRUCTURE_TERMINAL,
    STRUCTURE_CONTAINER,
    STRUCTURE_NUKER,
    STRUCTURE_FACTORY,
]
export const buildableStructuresSet: Set<BuildableStructureConstant> = new Set(buildableStructureTypes)

export const impassibleStructureTypes: StructureConstant[] = [
    STRUCTURE_SPAWN,
    STRUCTURE_EXTENSION,
    STRUCTURE_WALL,
    STRUCTURE_KEEPER_LAIR,
    STRUCTURE_CONTROLLER,
    STRUCTURE_LINK,
    STRUCTURE_STORAGE,
    STRUCTURE_TOWER,
    STRUCTURE_OBSERVER,
    STRUCTURE_POWER_BANK,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_EXTRACTOR,
    STRUCTURE_LAB,
    STRUCTURE_TERMINAL,
    STRUCTURE_NUKER,
    STRUCTURE_FACTORY,
    STRUCTURE_INVADER_CORE,
]

export const impassibleStructureTypesSet = new Set(impassibleStructureTypes)

export const defaultStructureTypesByBuildPriority: StructureConstant[] = [
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

export const structureTypesToProtect: StructureConstant[] = [
    STRUCTURE_SPAWN,
    STRUCTURE_TOWER,
    STRUCTURE_LAB,
    STRUCTURE_TERMINAL,
    STRUCTURE_STORAGE,
    STRUCTURE_FACTORY,
    STRUCTURE_NUKER,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_OBSERVER,
    STRUCTURE_LINK,
]
export const structureTypesToProtectSet = new Set(structureTypesToProtect)

export const storingStructureTypesSet: Set<StructureConstant> = new Set([STRUCTURE_STORAGE, STRUCTURE_TERMINAL])

export const customColors = {
    white: '#ffffff',
    lightGrey: '#eaeaea',
    midGrey: '#bcbcbc',
    darkGrey: '#5e5e5e',
    lightBlue: '#0f66fc',
    darkBlue: '#02007d',
    black: '#000000',
    yellow: '#d8f100',
    red: '#d10000',
    green: '#00d137',
    brown: '#aa7253',
    purple: '#8b06a3',
    pink: '#d60ef9',
    orange: '#f27602',
    teal: '#02f2e2',
}

export const remoteStamps: Record<RemoteStampTypes, Stamp> = {
    container: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            container: [{ x: 0, y: 0 }],
        },
    },
    road: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            road: [{ x: 0, y: 0 }],
        },
    },
}

export const stamps: Record<StampTypes, Stamp> = {
    fastFiller: {
        offset: 3,
        protectionOffset: 6,
        size: 4,
        structures: {
            extension: [
                { x: 1, y: 1 },
                { x: 2, y: 1 },
                { x: 3, y: 1 },
                { x: 3, y: 2 },
                { x: 2, y: 3 },
                { x: 4, y: 1 },
                { x: 5, y: 1 },
                { x: 4, y: 3 },
                { x: 1, y: 4 },
                { x: 3, y: 4 },
                { x: 1, y: 5 },
                { x: 2, y: 5 },
                { x: 4, y: 5 },
                { x: 5, y: 5 },
                { x: 5, y: 4 },
            ],
            road: [
                { x: 3, y: 0 },
                { x: 2, y: 0 },
                { x: 1, y: 0 },
                { x: 0, y: 1 },
                { x: 0, y: 2 },
                { x: 0, y: 3 },
                { x: 0, y: 4 },
                { x: 4, y: 0 },
                { x: 5, y: 0 },
                { x: 6, y: 1 },
                { x: 6, y: 2 },
                { x: 6, y: 4 },
                { x: 6, y: 3 },
                { x: 6, y: 5 },
                { x: 5, y: 6 },
                { x: 4, y: 6 },
                { x: 3, y: 6 },
                { x: 2, y: 6 },
                { x: 1, y: 6 },
                { x: 0, y: 5 },
            ],
            spawn: [
                { x: 1, y: 2 },
                { x: 5, y: 2 },
                { x: 3, y: 5 },
            ],
            container: [
                { x: 1, y: 3 },
                { x: 5, y: 3 },
            ],
            link: [{ x: 3, y: 3 }],
            empty: [
                { x: 2, y: 2 },
                { x: 4, y: 2 },
                { x: 2, y: 4 },
                { x: 4, y: 4 },
            ],
        },
    },
    hub: {
        offset: 2,
        protectionOffset: 5,
        size: 0,
        structures: {
            storage: [
                { x: 1, y: 0 },
                { x: 0, y: 1 },
                { x: 2, y: 1 },
                { x: 1, y: 2 },
            ],
        },
    },
    gridExtension: {
        offset: 0,
        protectionOffset: 4,
        size: 1,
        structures: {
            extension: [{ x: 0, y: 0 }],
        },
    },
    inputLab: {
        offset: 0,
        protectionOffset: 4,
        size: 1,
        structures: {
            lab: [{ x: 0, y: 0 }],
        },
    },
    outputLab: {
        offset: 0,
        protectionOffset: 4,
        size: 1,
        structures: {
            lab: [{ x: 0, y: 0 }],
        },
    },
    tower: {
        offset: 0,
        protectionOffset: 4,
        size: 1,
        structures: {
            tower: [{ x: 0, y: 0 }],
        },
    },
    observer: {
        offset: 0,
        protectionOffset: 4,
        size: 1,
        structures: {
            observer: [{ x: 0, y: 0 }],
        },
    },
    nuker: {
        offset: 0,
        protectionOffset: 4,
        size: 1,
        structures: {
            nuker: [{ x: 0, y: 0 }],
        },
    },
    powerSpawn: {
        offset: 0,
        protectionOffset: 4,
        size: 1,
        structures: {
            powerSpawn: [{ x: 0, y: 0 }],
        },
    },
    sourceLink: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            link: [{ x: 0, y: 0 }],
        },
    },
    sourceExtension: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            extension: [{ x: 0, y: 0 }],
        },
    },
    container: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            container: [{ x: 0, y: 0 }],
        },
    },
    extractor: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            extractor: [{ x: 0, y: 0 }],
        },
    },
    road: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            road: [{ x: 0, y: 0 }],
        },
    },
    minCutRampart: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            rampart: [{ x: 0, y: 0 }],
        },
    },
    onboardingRampart: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            rampart: [{ x: 0, y: 0 }],
        },
    },
    shieldRampart: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            rampart: [{ x: 0, y: 0 }],
        },
    },
}
export const stampKeys = Object.keys(stamps) as StampTypes[]

export const minerals: Partial<ResourceConstant[]> = [
    RESOURCE_HYDROGEN,
    RESOURCE_OXYGEN,
    RESOURCE_UTRIUM,
    RESOURCE_KEANIUM,
    RESOURCE_LEMERGIUM,
    RESOURCE_ZYNTHIUM,
    RESOURCE_CATALYST,
]
export const boosts = [RESOURCE_CATALYZED_GHODIUM_ACID]
export const dismantleBoosts = [RESOURCE_ZYNTHIUM_HYDRIDE, RESOURCE_ZYNTHIUM_ACID, RESOURCE_CATALYZED_ZYNTHIUM_ACID]
export const dismantleBoostsSet = new Set(dismantleBoosts)
export const allResources = new Set(RESOURCES_ALL)

/**
 * The percent of the terminal to fill with each resource
 */
export const terminalResourceTargets: Partial<{ [key in ResourceConstant]: ResourceTarget }> = {
    [RESOURCE_BATTERY]: {
        conditions: function (communeManager) {
            return communeManager.room.roomManager.structures.factory.length
        },
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.005
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.015
        },
    },
    [RESOURCE_ENERGY]: {
        min: function (communeManager) {
            if (communeManager.room.controller.level < 8) {
                return communeManager.storedEnergyUpgradeThreshold * 1.2
            }

            return communeManager.minStoredEnergy
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.2
        },
    },
    [RESOURCE_HYDROGEN]: {
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027
        },
    },
    [RESOURCE_OXYGEN]: {
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027
        },
    },
    [RESOURCE_UTRIUM]: {
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027
        },
    },
    [RESOURCE_KEANIUM]: {
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027
        },
    },
    [RESOURCE_LEMERGIUM]: {
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027
        },
    },
    [RESOURCE_ZYNTHIUM]: {
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027
        },
    },
    [RESOURCE_CATALYST]: {
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027
        },
    },
    [RESOURCE_OXIDANT]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_REDUCTANT]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_ZYNTHIUM_BAR]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_LEMERGIUM_BAR]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_UTRIUM_BAR]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_KEANIUM_BAR]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_PURIFIER]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_GHODIUM_MELT]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_POWER]: {
        conditions: function (communeManager) {
            return communeManager.room.roomManager.structures.powerSpawn.length
        },
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.002
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.015
        },
    },
    [RESOURCE_METAL]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return 0
        },
    },
    [RESOURCE_BIOMASS]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return 0
        },
    },
    [RESOURCE_SILICON]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return 0
        },
    },
    [RESOURCE_MIST]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return 0
        },
    },
    [RESOURCE_ALLOY]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return 0
        },
    },
    [RESOURCE_CELL]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return 0
        },
    },
    [RESOURCE_WIRE]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return 0
        },
    },
    [RESOURCE_CONDENSATE]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return 0
        },
    },
    // Boosts
    [RESOURCE_UTRIUM_HYDRIDE]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_UTRIUM_HYDRIDE]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_KEANIUM_HYDRIDE]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_KEANIUM_OXIDE]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_LEMERGIUM_HYDRIDE]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_LEMERGIUM_OXIDE]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_ZYNTHIUM_HYDRIDE]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_ZYNTHIUM_OXIDE]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_GHODIUM_HYDRIDE]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    [RESOURCE_GHODIUM_OXIDE]: {
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
}

export const antifaRoles: (
    | 'antifaRangedAttacker'
    | 'antifaAttacker'
    | 'antifaHealer'
    | 'antifaDismantler'
    | 'antifaDowngrader'
)[] = ['antifaRangedAttacker', 'antifaAttacker', 'antifaHealer', 'antifaDismantler', 'antifaDowngrader']

/**
 * Roles for which to provide spawnGroups for based on their shared remoteName
 */
export const remoteRoles: /* | 'remoteSourceHarvester' */
('remoteReserver' | 'remoteDefender' | 'remoteCoreAttacker' | 'remoteDismantler')[] = [
    /* 'remoteSourceHarvester', */
    'remoteReserver',
    'remoteDefender',
    'remoteCoreAttacker',
    'remoteDismantler',
]

export enum RemoteHarvesterRolesBySourceIndex {
    remoteSourceHarvester0,
    remoteSourceHarvester1,
}

export enum RemoteHaulerRolesBySourceIndex {
    remoteHauler0,
    remoteHauler1,
}

export const CPUBucketCapacity = 10000
export const CPUMaxPerTick = 500

/**
 * Roles that should attempt relaying
 */
export const relayRoles: Set<CreepRoles> = new Set(['hauler', 'remoteHauler'])

/**
 * Used to modify the remaining bucket amount, resulting in the default cacheAmount for moveRequests
 */
export const cacheAmountModifier = 25

export const UNWALKABLE = -1
export const NORMAL = 0
export const PROTECTED = 1
export const TO_EXIT = 2
export const EXIT = 3

/**
 * Which structures should be safemoded when attacked
 */
export const safemodeTargets: StructureConstant[] = [
    STRUCTURE_SPAWN,
    STRUCTURE_TOWER,
    STRUCTURE_STORAGE,
    STRUCTURE_TERMINAL,
]

/**
 * The number of ticks to wait between hauler size updates
 */
export const haulerUpdateDefault = 1500

export const rampartUpkeepCost = RAMPART_DECAY_AMOUNT / REPAIR_POWER / RAMPART_DECAY_TIME
export const roadUpkeepCost = ROAD_DECAY_AMOUNT / REPAIR_POWER / ROAD_DECAY_TIME
export const containerUpkeepCost = CONTAINER_DECAY / REPAIR_POWER / CONTAINER_DECAY_TIME_OWNED
export const remoteContainerUpkeepCost = CONTAINER_DECAY / REPAIR_POWER / CONTAINER_DECAY_TIME

export const minOnboardingRamparts = 1
export const maxRampartGroupSize = 12

/**
 * Links should try to send when their store is more or equal to this multiplier
 */
export const linkSendThreshold = 0.9

/**
 * Links should receive when their store is less or equal to this multiplier
 */
export const linkReceiveTreshold = 0.25

export const powerSpawnRefillThreshold = 0.1

/**
 * Offsets from a creep's moveRequest for which to search for relay targets
 */
export const relayOffsets = {
    horizontal: [
        {
            x: 0,
            y: 0,
        },
        {
            x: -1,
            y: 0,
        },
        {
            x: 1,
            y: 0,
        },
    ],
    vertical: [
        {
            x: 0,
            y: 0,
        },
        {
            x: 0,
            y: -1,
        },
        {
            x: 0,
            y: 1,
        },
    ],
    topLeft: [
        {
            x: 0,
            y: 0,
        },
        {
            x: 1,
            y: 0,
        },
        {
            x: 0,
            y: 1,
        },
    ],
    topRight: [
        {
            x: 0,
            y: 0,
        },
        {
            x: -1,
            y: 0,
        },
        {
            x: 0,
            y: 1,
        },
    ],
    bottomLeft: [
        {
            x: 0,
            y: 0,
        },
        {
            x: 1,
            y: 0,
        },
        {
            x: 0,
            y: -1,
        },
    ],
    bottomRight: [
        {
            x: 0,
            y: 0,
        },
        {
            x: -1,
            y: 0,
        },
        {
            x: 0,
            y: -1,
        },
    ],
}

export const squadQuotas: Partial<{
    [key in SquadTypes]: Partial<{ [key in CreepRoles]: Partial<{ [key in CreepRoles]: number }> }>
}> = {
    duo: {
        antifaAttacker: {
            antifaAttacker: 1,
            antifaHealer: 1,
        },
        antifaDismantler: {
            antifaDismantler: 1,
            antifaHealer: 1,
        },
    },
    quad: {
        antifaRangedAttacker: {
            antifaRangedAttacker: 4,
        },
        antifaAttacker: {
            antifaAttacker: 1,
            antifaHealer: 3,
        },
        antifaDismantler: {
            antifaDismantler: 1,
            antifaHealer: 3,
        },
    },
    dynamic: {
        antifaRangedAttacker: {
            antifaAttacker: 1,
            antifaHealer: 1,
            antifaRangedAttacker: 1,
            antifaDismantler: 1,
        },
    },
}

export const defaultPlainCost = 1
export const defaultRoadPlanningPlainCost = 3
export const defaultSwampCost = 5
export const defaultCreepSwampCost = 8

/**
 * @constant 1 4
 * @constant 2 3
 */
export const quadAttackMemberOffsets = [
    {
        x: 0,
        y: 0,
    },
    {
        x: 0,
        y: 1,
    },
    {
        x: 1,
        y: 1,
    },
    {
        x: 1,
        y: 0,
    },
]
export const packedQuadAttackMemberOffsets = quadAttackMemberOffsets.map(coord => packCoord(coord))

export const RESULT_FAIL = 0
export const RESULT_SUCCESS = 1
export const RESULT_ACTION = 2
export const RESULT_NO_ACTION = 3
/**
 * Wether there was success or fail is irrelevant. Stop future action
 */
export const RESULT_STOP = 4

export const maxRemoteRoomDistance = 5
export const offsetsByDirection = [, [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]]

export const towerPowers = [PWR_OPERATE_TOWER, PWR_DISRUPT_TOWER]

export const remoteTypeWeights: Partial<{ [key: string]: number }> = {
    [RoomTypes.keeper]: Infinity,
    [RoomTypes.enemy]: Infinity,
    [RoomTypes.enemyRemote]: Infinity,
    [RoomTypes.ally]: Infinity,
    [RoomTypes.allyRemote]: Infinity,
}

export const maxWorkRequestDistance = 10
export const maxCombatDistance = 20
export const maxHaulDistance = 15

export const partsByPriority: PartsByPriority[] = [
    'tough',
    'claim',
    'attack',
    'ranged_attack',
    'secondaryTough',
    'work',
    'carry',
    'move',
    'secondaryAttack',
    'heal',
]

export const partsByPriorityPartType: { [key in PartsByPriority]: BodyPartConstant } = {
    [TOUGH]: TOUGH,
    [CLAIM]: CLAIM,
    [ATTACK]: ATTACK,
    [RANGED_ATTACK]: RANGED_ATTACK,
    secondaryTough: TOUGH,
    [WORK]: WORK,
    [CARRY]: CARRY,
    [MOVE]: MOVE,
    secondaryAttack: ATTACK,
    [HEAL]: HEAL,
}

export const rangedMassAttackMultiplierByRange = [1, 1, 0.4, 0.1]

export enum RoomStatNamesEnum {
    ControllerLevel = 'cl',
    EnergyInputHarvest = 'eih',
    EnergyInputBought = 'eib',
    EnergyOutputUpgrade = 'eou',
    EnergyOutputRepairOther = 'eoro',
    EnergyOutputRepairWallOrRampart = 'eorwr',
    EnergyOutputBuild = 'eob',
    EnergyOutputSold = 'eos',
    EnergyOutputSpawn = 'eosp',
    EnergyOutputPower = 'eop',
    MineralsHarvested = 'mh',
    EnergyStored = 'es',
    BatteriesStoredTimes10 = 'bes',
    CreepCount = 'cc',
    TotalCreepCount = 'tcc',
    PowerCreepCount = 'pcc',
    SpawnUsagePercentage = 'su',
    AllyCreepRequestManangerCPUUsage = 'acrmcu',
    WorkRequestManagerCPUUsage = 'clrmcu',
    TowerManagerCPUUsage = 'tmcu',
    SpawnManagerCPUUsage = 'smcu',
    CombatRequestManagerCPUUsage = 'cormcu',
    DefenceManagerCPUUsage = 'dmcu',
    SpawnRequestsManagerCPUUsage = 'srmcu',
    RoomCPUUsage = 'rocu',
    RoomVisualsManagerCPUUsage = 'rvmcu',
    ConstructionManagerCPUUsage = 'cmcu',
    RoleManagerCPUUsage = 'rolmcu',
    RoleManagerPerCreepCPUUsage = 'rolmpccu',
    EndTickCreepManagerCPUUsage = 'etcmcu',
    PowerRoleManagerCPUUsage = 'prmcu',
    PowerRoleManagerPerCreepCPUUsage = 'prmpccu',

    GameTime = 'gt',
    RemoteCount = 'rc',
    RemoteEnergyStored = 'res',
    RemoteEnergyInputHarvest = 'reih',
    RemoteEnergyOutputRepairOther = 'reoro',
    RemoteEnergyOutputBuild = 'reob',
    RemoteRoomCPUUsage = 'rrocu',
    RemoteRoomVisualsManagerCPUUsage = 'rrvmcu',
    RemoteConstructionManagerCPUUsage = 'rcmcu',
    RemoteRoleManagerCPUUsage = 'rrolmcu',
    RemoteRoleManagerPerCreepCPUUsage = 'rrolmpccu',
    RemoteEndTickCreepManagerCPUUsage = 'retcmcu',
    RemotePowerRoleManangerCPUUsage = 'rprmcu',
    RemotePowerRoleManagerPerCreepCPUUsage = 'rprmpccu',
}

export enum InternationalStatNamesEnum {
    InternationalManagerCPUUsage = 'imcu',
    CreepOrganizerCPUUsage = 'cocu',
    MapVisualsManangerCPUUsage = 'mvmcu',
    PowerCreepOrganizerCPUUsage = 'pccu',
    TickConfigCPUUsage = 'tccu',
    RoomManagerCPUUsage = 'roomcu',
    StatsManagerCPUUsage = 'smcu',
}

export const packedPosLength = 3
export const packedCoordLength = 2
export const cardinalOffsets = [
    {
        x: -1,
        y: 0,
    },
    {
        x: 1,
        y: 0,
    },
    {
        x: 0,
        y: -1,
    },
    {
        x: 0,
        y: 1,
    },
]

export const adjacentOffsets = [
    {
        x: -1,
        y: -1,
    },
    {
        x: 0,
        y: -1,
    },
    {
        x: 1,
        y: -1,
    },
    {
        x: 1,
        y: 0,
    },
    {
        x: 1,
        y: 1,
    },
    {
        x: 0,
        y: 1,
    },
    {
        x: -1,
        y: 1,
    },
    {
        x: -1,
        y: 0,
    },
]
export const defaultMinCutDepth = 7
/* export const defaultMineralPriority = {
    [H]:
}
 */
export const decayCosts: Partial<{ [key in BuildableStructureConstant]: number }> = {
    [STRUCTURE_ROAD]: roadUpkeepCost,
    [STRUCTURE_CONTAINER]: containerUpkeepCost,
}

export const dynamicScoreRoomRange = 8
export const maxControllerLevel = 8
export const preferredCommuneRange = 5.5
