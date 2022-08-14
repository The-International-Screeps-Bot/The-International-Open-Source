/**
 * Increment by 1 when a change has been made that will break previous versions of the bot
 */
export const breakingVersion = 74

// Settings

/**
 * Default value, do not change. Modify this property in Memory instead
 */
export const roomVisuals = false

/**
 * Default value, do not change. Modify this property in Memory instead
 */
export const baseVisuals = false

/**
 * Default value, do not change. Modify this property in Memory instead
 */
export const mapVisuals = false

/**
 * Default value, do not change. Modify this property in Memory instead
 */
export const CPULogging = false

/**
 * Default value, do not change. Modify this property in Memory instead
 */
export const roomStats: 0 | 1 | 2 = 1

/**
 * Default value, do not change. Modify this property in Memory instead
 */
export const allyList = [
    'MarvinTMB',
    'Q13214',
    'HerrKai',
    'clarkok',
    'PandaMaster',
    'lokenwow',
    'Morningtea',
    'LittleBitBlue',
    'Raggy',
    'DefaultO',
    'Allorrian',
]

/**
 * Default value, do not change. Modify this property in Memory instead
 */
export const pixelSelling = false

/**
 * Default value, do not change. Modify this property in Memory instead
 */
export const pixelGeneration = false

/**
 * Default value, do not change. Modify this property in Memory instead
 */
export const tradeBlacklist = ['']

/**
 * Default value, do not change. Modify this property in Memory instead
 */
export const autoClaim = true

/**
 * Default value, do not change. Modify this property in Memory instead
 */
export const publicRamparts = false

/**
 * Default value, do not change. Modify this property in Memory instead
 */
export const allyTrading = true

// General

/**
 * Please avoid changing this. If you do change it, don't push it to the main repository
 */
export const simpleAlliesSegment = 90

export const mmoShardNames = new Set(['shard0', 'shard1', 'shard2', 'shard3'])

interface RoomTypeProperties {
    [key: string]: boolean
}

export const roomTypeProperties: RoomTypeProperties = {
    source1: true,
    source2: true,
    remotes: true,
    deposits: true,
    powerBanks: true,
    notClaimable: true,
    planned: true,
    HS: true,
    HU: true,

    commune: true,
    needs: true,
    sourceEfficacies: true,
    abandoned: true,

    owner: true,
    level: true,

    powerEnabled: true,
    towers: true,
    hasTerminal: true,
    energy: true,
    OT: true,
    DT: true,

    portalsTo: true,
}

export const roomTypes: Record<RoomTypes, RoomType> = {
    commune: {
        source1: true,
        source2: true,
        remotes: true,
        deposits: true,
        powerBanks: true,
        planned: true,
        HS: true,
        HU: true,
    },
    remote: {
        commune: true,
        source1: true,
        source2: true,
        needs: true,
        sourceEfficacies: true,
        abandoned: true,
        notClaimable: true,
        planned: true,
    },
    ally: {
        owner: true,
        level: true,
    },
    allyRemote: {
        owner: true,
    },
    enemy: {
        owner: true,
        level: true,
        powerEnabled: true,
        towers: true,
        hasTerminal: true,
        energy: true,
        notClaimable: true,
        OT: true,
        DT: true,
    },
    enemyRemote: {
        owner: true,
        notClaimable: true,
    },
    neutral: {
        notClaimable: true,
        planned: true,
    },
    keeper: {
        owner: true,
    },
    keeperCenter: {
        owner: true,
    },
    highway: {
        commune: true,
    },
    intersection: {
        portalsTo: true,
    },
}
export const roomTypesUsedForStats = ['commune', 'remote']

export const creepRoles: CreepRoles[] = [
    'source1Harvester',
    'source2Harvester',
    'hauler',
    'controllerUpgrader',
    'builder',
    'maintainer',
    'mineralHarvester',
    'hubHauler',
    'fastFiller',
    'meleeDefender',
    'source1RemoteHarvester',
    'source2RemoteHarvester',
    'remoteHauler',
    'remoteReserver',
    'remoteDefender',
    'remoteCoreAttacker',
    'remoteDismantler',
    'scout',
    'claimer',
    'vanguard',
    'allyVanguard',
    'vanguardDefender',
    'antifaAssaulter',
    'antifaSupporter',
]

const trafficPriorities: Map<Partial<CreepRoles>, number> = new Map()

trafficPriorities.set('meleeDefender', Infinity)

trafficPriorities.set('source1RemoteHarvester', 1)
trafficPriorities.set('source2RemoteHarvester', 1)

export { trafficPriorities }

// Set of messages to randomly apply to commune rooms

export const communeSigns = ['A commune of the proletariat. Bourgeoisie not welcome here!']

// Set of messages to randomly apply to non-commune rooms

export const nonCommuneSigns = [
    'The top 1% have more money than the poorest 4.5 billion',
    'McDonalds workers in the US make $10/hour. In Denmark, as a result of unions, they make $22/hour',
    'We have democracy in our policial system, why do we not have it in our companies?',
    'Workers of the world, unite!',
    'Real democracy requires democracy in the workplace - Richard Wolff',
    'Adults spend a combined 13 years of their life under a dictatorship: the workplace',
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

export const myColors = {
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
        size: 3,
        structures: {
            road: [
                { x: 1, y: 0 },
                { x: 2, y: 0 },
                { x: 3, y: 0 },
                { x: 0, y: 3 },
                { x: 0, y: 2 },
                { x: 0, y: 1 },
                { x: 1, y: 4 },
                { x: 2, y: 4 },
                { x: 4, y: 2 },
                { x: 4, y: 1 },
                { x: 3, y: 3 },
            ],
            extension: [{ x: 2, y: 3 }],
            link: [{ x: 1, y: 1 }],
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
        protectionOffset: 3,
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
        offset: 2,
        protectionOffset: 5,
        size: 5,
        structures: {
            road: [
                { x: 3, y: 3 },
                { x: 2, y: 2 },
                { x: 1, y: 1 },
                { x: 0, y: 0 },
            ],
            empty: [
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
            /* lab: [{ x: 0, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 2, y: 3 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 3, y: 2 }] */
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
    },
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

export const remoteNeedsIndex = {
    source1RemoteHarvester: 0,
    source2RemoteHarvester: 1,
    remoteHauler: 2,
    remoteReserver: 3,
    remoteCoreAttacker: 4,
    remoteBuilder: 5,
    remoteDismantler: 6,
    minDamage: 7,
    minHeal: 8,
    enemyReserved: 9,
    invaderCore: 10,
}

export const claimRequestNeedsIndex = {
    claimer: 0,
    vanguard: 1,
    vanguardDefender: 2,
}

export const attackRequestNeedsIndex = {
    ranged: 0,
    attack: 1,
    dismantle: 2,
    downgrader: 3,
    minDamage: 4,
    minHeal: 5,
}

export const allyCreepRequestNeedsIndex = {
    allyVanguard: 0,
}

export const depositNeedsIndex = {
    depositHarvester: 0,
    depositHauler: 1,
}

export const remoteHarvesterRoles: ('source1RemoteHarvester' | 'source2RemoteHarvester')[] = [
    'source1RemoteHarvester',
    'source2RemoteHarvester',
]

export const spawnByRoomRemoteRoles: (
    | 'source1RemoteHarvester'
    | 'source2RemoteHarvester'
    | 'remoteReserver'
    | 'remoteDefender'
    | 'remoteCoreAttacker'
    | 'remoteDismantler'
)[] = [
    'source1RemoteHarvester',
    'source2RemoteHarvester',
    'remoteReserver',
    'remoteDefender',
    'remoteCoreAttacker',
    'remoteDismantler',
]

export const builderSpawningWhenStorageThreshold = 40000

export const upgraderSpawningWhenStorageThreshold = 60000

export const CPUBucketCapacity = 10000
export const CPUMaxPerTick = 500

export const CPUBucketRenewThreshold = 5000
export const prefferedCommuneRange = 6
export const relayRoles: Partial<CreepRoles>[] = ['hauler', 'remoteHauler']

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

export const safemodeTargets: StructureConstant[] = [
    STRUCTURE_SPAWN,
    STRUCTURE_TOWER,
    STRUCTURE_STORAGE,
    STRUCTURE_TERMINAL,
]

export const haulerUpdateDefault = 1500

export const rampartUpkeepCost = RAMPART_DECAY_AMOUNT / REPAIR_POWER / RAMPART_DECAY_TIME
export const roadUpkeepCost = ROAD_DECAY_AMOUNT / REPAIR_POWER / ROAD_DECAY_TIME
export const containerUpkeepCost = CONTAINER_DECAY / REPAIR_POWER / CONTAINER_DECAY_TIME_OWNED
export const remoteContainerUpkeepCost = CONTAINER_DECAY / REPAIR_POWER / CONTAINER_DECAY_TIME

export const minOnboardingRamparts = 1
export const maxRampartGroupSize = 12
