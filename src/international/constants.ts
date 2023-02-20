// General

export const mmoShardNames = new Set(['shard0', 'shard1', 'shard2', 'shard3'])

export const roomTypeProperties: Set<keyof RoomMemory> = new Set([
    'remotes',
    'deposits',
    'powerBanks',
    'NC',
    'PC',
    'MHC',
    'HU',
    'AT',
    'LAT',
    'Ab',
    'S',

    'CN',
    'RE',
    'data',

    'owner',
    'level',

    'powerEnabled',
    'towers',
    'hasTerminal',
    'energy',
    'OS',
    'DS',

    'portalsTo',
])

export const roomTypes: Record<RoomTypes, Set<keyof RoomMemory>> = {
    commune: new Set(['remotes', 'deposits', 'powerBanks', 'PC', 'MHC', 'HU', 'AT', 'LAT', 'Ab', 'S']),
    remote: new Set(['CN', 'RE', 'data', 'NC', 'PC']),
    ally: new Set(['owner', 'level', 'NC', 'PC']),
    allyRemote: new Set(['owner', 'NC', 'PC']),
    enemy: new Set(['owner', 'level', 'powerEnabled', 'towers', 'hasTerminal', 'energy', 'NC', 'PC', 'OS', 'DS']),
    enemyRemote: new Set(['owner', 'NC', 'PC']),
    neutral: new Set(['NC', 'PC']),
    keeper: new Set(['owner']),
    keeperCenter: new Set(['owner']),
    highway: new Set([]),
    intersection: new Set(['portalsTo']),
}

export const constantRoomTypes: Set<Partial<RoomTypes>> = new Set(['keeper', 'keeperCenter', 'highway', 'intersection'])

export const roomTypesUsedForStats = ['commune', 'remote']

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
    'remoteSourceHarvester0',
    'remoteSourceHarvester1',
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
    'hauler',
    'builder',
    'maintainer',
    'controllerUpgrader',
    'remoteSourceHarvester0',
    'remoteSourceHarvester1',
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
    remoteSourceHarvester0,
    remoteSourceHarvester1,
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

// Set of messages to randomly apply to commune rooms

export const communeSign = 'A commune of the proletariat. Bourgeoisie not welcome here!'

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
    'Die',
    'Tigga',
    'die!',
    undefined,
    'Read',
    'Das',
    'Kapital',
    'on',
    'marxists',
    '.org',
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
export const rampartSet: Set<StructureConstant> = new Set([STRUCTURE_RAMPART])

export const structureTypesByBuildPriority: StructureConstant[] = [
    STRUCTURE_SPAWN,
    STRUCTURE_EXTENSION,
    STRUCTURE_CONTAINER,
    STRUCTURE_ROAD,
    STRUCTURE_STORAGE,
    STRUCTURE_TOWER,
    STRUCTURE_WALL,
    STRUCTURE_RAMPART,
    STRUCTURE_LINK,
    STRUCTURE_TERMINAL,
    STRUCTURE_EXTRACTOR,
    STRUCTURE_LAB,
    STRUCTURE_FACTORY,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_NUKER,
    STRUCTURE_OBSERVER,
]

export const structureTypesByNumber = {
    empty: 0,
    spawn: 1,
    extension: 2,
    container: 3,
    tower: 4,
    storage: 5,
    road: 6,
    wall: 7,
    rampart: 8,
    terminal: 9,
    extractor: 10,
    link: 11,
    lab: 12,
    factory: 13,
    powerSpawn: 14,
    nuker: 15,
    observer: 16,
}

export const numbersByStructureTypes = {
    0: 'empty',
    1: STRUCTURE_SPAWN,
    2: STRUCTURE_EXTENSION,
    3: STRUCTURE_CONTAINER,
    4: STRUCTURE_TOWER,
    5: STRUCTURE_STORAGE,
    6: STRUCTURE_ROAD,
    7: STRUCTURE_WALL,
    8: STRUCTURE_RAMPART,
    9: STRUCTURE_TERMINAL,
    10: STRUCTURE_EXTRACTOR,
    11: STRUCTURE_LINK,
    12: STRUCTURE_LAB,
    13: STRUCTURE_FACTORY,
    14: STRUCTURE_POWER_SPAWN,
    15: STRUCTURE_NUKER,
    16: STRUCTURE_OBSERVER,
}

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
        protectionOffset: 7,
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
        size: 3,
        structures: {
            road: [
                { x: 1, y: 1 },
                { x: 2, y: 0 },
                { x: 3, y: 0 },
                { x: 0, y: 3 },
                { x: 0, y: 2 },
                { x: 1, y: 4 },
                { x: 2, y: 4 },
                { x: 4, y: 2 },
                { x: 4, y: 1 },
                { x: 3, y: 3 },
            ],
            link: [{ x: 2, y: 3 }],
            factory: [{ x: 2, y: 1 }],
            nuker: [{ x: 1, y: 2 }],
            terminal: [{ x: 1, y: 3 }],
            storage: [{ x: 3, y: 1 }],
            powerSpawn: [{ x: 3, y: 2 }],
            empty: [{ x: 2, y: 2 }],
        },
    },
    extensions: {
        offset: 2,
        protectionOffset: 4,
        size: 3,
        structures: {
            extension: [
                { x: 1, y: 2 },
                { x: 2, y: 1 },
                { x: 2, y: 3 },
                { x: 2, y: 2 },
                { x: 3, y: 2 },
            ],
            road: [
                { x: 1, y: 3 },
                { x: 0, y: 2 },
                { x: 1, y: 1 },
                { x: 2, y: 0 },
                { x: 3, y: 1 },
                { x: 4, y: 2 },
                { x: 3, y: 3 },
                { x: 2, y: 4 },
            ],
        },
    },
    labs: {
        offset: 1,
        protectionOffset: 5,
        size: 2,
        asymmetry: 1,
        structures: {
            road: [
                { x: 2, y: 2 },
                { x: 1, y: 1 },
            ],
            lab: [
                { x: 0, y: 1 },
                { x: 0, y: 2 },
                { x: 1, y: 2 },
                { x: 1, y: 3 },
                { x: 2, y: 3 },
                { x: 1, y: 0 },
                { x: 2, y: 0 },
                { x: 2, y: 1 },
                { x: 3, y: 1 },
                { x: 3, y: 2 },
            ],
        },
    },
    tower: {
        offset: 0,
        protectionOffset: 2,
        size: 1,
        structures: {
            tower: [{ x: 0, y: 0 }],
        },
    },
    extension: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            extension: [{ x: 0, y: 0 }],
        },
    },
    observer: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            observer: [{ x: 0, y: 0 }],
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
    rampart: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            rampart: [{ x: 0, y: 0 }],
        },
    },/*
    gridExtension: {
        offset: 0,
        protectionOffset: 0,
        size: 1,
        structures: {
            extension: [{ x: 0, y: 0 }],
        },
    } */
}

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
export const terminalResourceTargets: ResourceTarget[] = [
    {
        resource: RESOURCE_BATTERY,
        conditions: function (communeManager) {
            return communeManager.room.structures.factory.length
        },
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.005
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.015
        },
    },
    {
        resource: RESOURCE_ENERGY,
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
    {
        resource: RESOURCE_HYDROGEN,
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027
        },
    },
    {
        resource: RESOURCE_OXYGEN,
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027
        },
    },
    {
        resource: RESOURCE_UTRIUM,
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027
        },
    },
    {
        resource: RESOURCE_KEANIUM,
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027
        },
    },
    {
        resource: RESOURCE_LEMERGIUM,
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027
        },
    },
    {
        resource: RESOURCE_ZYNTHIUM,
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027
        },
    },
    {
        resource: RESOURCE_CATALYST,
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.027
        },
    },
    {
        resource: RESOURCE_OXIDANT,
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    {
        resource: RESOURCE_REDUCTANT,
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    {
        resource: RESOURCE_ZYNTHIUM_BAR,
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    {
        resource: RESOURCE_LEMERGIUM_BAR,
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    {
        resource: RESOURCE_UTRIUM_BAR,
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    {
        resource: RESOURCE_KEANIUM_BAR,
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    {
        resource: RESOURCE_PURIFIER,
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    {
        resource: RESOURCE_GHODIUM_MELT,
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.01
        },
    },
    {
        resource: RESOURCE_POWER,
        conditions: function (communeManager) {
            return communeManager.room.structures.powerSpawn.length
        },
        min: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.002
        },
        max: function (communeManager) {
            return communeManager.storingStructuresCapacity * 0.015
        },
    },
    {
        resource: RESOURCE_METAL,
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return 0
        },
    },
    {
        resource: RESOURCE_BIOMASS,
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return 0
        },
    },
    {
        resource: RESOURCE_SILICON,
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return 0
        },
    },
    {
        resource: RESOURCE_MIST,
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return 0
        },
    },
    {
        resource: RESOURCE_ALLOY,
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return 0
        },
    },
    {
        resource: RESOURCE_CELL,
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return 0
        },
    },
    {
        resource: RESOURCE_WIRE,
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return 0
        },
    },
    {
        resource: RESOURCE_CONDENSATE,
        min: function (communeManager) {
            return 0
        },
        max: function (communeManager) {
            return 0
        },
    },
]

export enum PlayerData {
    /**
     * Generally how good their offense is
     */
    offensiveStrength,
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
    lastAttack,
}

export enum RemoteData {
    remoteSourceHarvester0,
    remoteSourceHarvester1,
    remoteHauler0,
    remoteHauler1,
    remoteReserver,
    remoteCoreAttacker,
    remoteBuilder,
    remoteDismantler,
    minDamage,
    minHeal,
    enemyReserved,
    invaderCore,
    abandon,
    onlyInvader,
    disableCachedPaths,
    /**
     * Wether or not we are
     */
    active,
}

export enum ClaimRequestData {
    claimer,
    vanguard,
    minDamage,
    minHeal,
    abandon,
    score,
}

export enum CombatRequestData {
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
}

export enum HaulRequestData {
    transfer,
    distance,
    timer,
    priority,
    abandon,
}

export enum AllyCreepRequestData {
    allyVanguard,
    abandon,
}

export enum DepositNeeds {
    depositHarvester,
    depositHauler,
}

export const remoteHarvesterRoles: ('remoteSourceHarvester0' | 'remoteSourceHarvester1')[] = [
    'remoteSourceHarvester0',
    'remoteSourceHarvester1',
]

export const remoteHaulerRoles: ('remoteHauler0' | 'remoteHauler1')[] = ['remoteHauler0', 'remoteHauler1']

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
export const remoteRoles: (
    | 'remoteSourceHarvester0'
    | 'remoteSourceHarvester1'
    | 'remoteReserver'
    | 'remoteDefender'
    | 'remoteCoreAttacker'
    | 'remoteDismantler'
)[] = [
    'remoteSourceHarvester0',
    'remoteSourceHarvester1',
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

export const CPUBucketRenewThreshold = 5000
export const prefferedCommuneRange = 6

/**
 * Roles that should attempt relaying
 */
export const relayRoles: Set<CreepRoles> = new Set(['hauler', 'remoteHauler'])

// The dowwngrade timer for when upgrading the controller is required

export const controllerDowngradeUpgraderNeed = 10000

/**
 * Used to modify the remaining bucket amount, resulting in the default cacheAmount for moveRequests
 */
export const cacheAmountModifier = 25

export const minHarvestWorkRatio = 1.66666666667

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

const allowedSquadCombinations: { [squadSize: string]: Partial<Record<CreepRoles, Set<CreepRoles>>> } = {
    2: {
        antifaRangedAttacker: new Set(['antifaRangedAttacker']),
        antifaAttacker: new Set(['antifaHealer']),
        antifaDismantler: new Set(['antifaHealer']),
        antifaHealer: new Set(['antifaAttacker', 'antifaDismantler']),
    },
    4: {
        antifaRangedAttacker: new Set(['antifaRangedAttacker', 'antifaAttacker', 'antifaDismantler']),
        antifaAttacker: new Set(['antifaRangedAttacker', 'antifaAttacker', 'antifaDismantler']),
        antifaDismantler: new Set(['antifaRangedAttacker', 'antifaAttacker', 'antifaDismantler']),
    },
}

export { allowedSquadCombinations }

export const defaultPlainCost = 1
export const defaultRoadPlanningPlainCost = 2
export const defaultSwampCost = 3
export const defaultCreepSwampCost = 8

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

export const quadTransformOffsets: Record<QuadTransformTypes, { x: number; y: number }[]> = {
    none: [
        {
            x: 0,
            y: 0,
        },
        {
            x: 0,
            y: 0,
        },
        {
            x: 0,
            y: 0,
        },
        {
            x: 0,
            y: 0,
        },
    ],
    rotateLeft: [
        {
            x: 0,
            y: 1,
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
            x: -1,
            y: 0,
        },
    ],
    rotateRight: [
        {
            x: 1,
            y: 0,
        },
        {
            x: 0,
            y: -1,
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
    tradeHorizontal: [
        {
            x: 1,
            y: 0,
        },
        {
            x: 1,
            y: 0,
        },
        {
            x: -1,
            y: 0,
        },
        {
            x: -1,
            y: 0,
        },
    ],
    tradeVertical: [
        {
            x: 0,
            y: 1,
        },
        {
            x: 0,
            y: -1,
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
}

export const quadTransformIndexes: { [key in QuadTransformTypes]: number[] } = {
    none: [0, 1, 2, 3],
    rotateLeft: [1, 2, 3, 0],
    rotateRight: [3, 2, 1, 0],
    tradeHorizontal: [3, 2, 1, 0],
    tradeVertical: [1, 0, 3, 2],
}

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

export const remoteTypeWeights: Partial<{ [key in RoomTypes]: number }> = {
    keeper: Infinity,
    enemy: Infinity,
    enemyRemote: Infinity,
    ally: Infinity,
    allyRemote: Infinity,
}

export const maxClaimRequestDistance = 10
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
    ClaimRequestManagerCPUUsage = 'clrmcu',
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
        x: -1,
        y: 0,
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
        y: -1,
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
