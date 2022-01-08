interface Constants {

    /**
     * The username of the account the bot is running for
     */
    me: string

    /**
     * The names of the shards for the mmo server
     */
    mmoShardNames: string[]

    /**
     * An array of usernames of players to treat as allies
     */
    allyList: string[]

    /**
     * An array of usernames of players to avoid trading with
     */
    tradeBlacklist: string[]

    /**
     * A set of properties that are relative to a room's type
     */
    roomTypeProperties: {[key: string]: boolean}

    /**
     * A set of roomTypes with the properties they should be assigned
     */
    roomTypes: {[key: string]: {[key: string]: boolean}}

    /**
     * an array of strings of names of roles
     */
    creepRoles: CreepRoles[]

    /**
     * An array of messages of what to sign comunes with
     */
    communeSigns: string[]

    /**
     * An array of strings of messages of what to sign non-communes with
     */
    nonCommuneSigns: string[]

    /**
     * The hulistic dimensions of rooms
     */
    roomDimensions: number

    /**
     * An object with colour names as keys and hex codes as properties
     */
    colors: Colors

    /**
     * An array of all the structureTypes in the game
     */
    allStructureTypes: StructureConstant[]

    /**
     * An array of structureTypes that cannot be walked over
     */
    impassibleStructures: StructureConstant[]

    buildings: Buildings
}

export const constants: Partial<Constants> = {}

constants.roomDimensions = 50

constants.me = 'MarvinTMB'
constants.mmoShardNames = [
    'shard0',
    'shard1',
    'shard2',
    'shard3'
]

constants.allyList = [
    "Q13214",
    "Orlet",
    "BarryOSeven",
    "slowmotionghost",
]
constants.tradeBlacklist = ['hi']

constants.roomTypeProperties = {
    type: true,

    commune: true,
    source1: true,
    source2: true,
    remotes: true,
    commodities: true,
    powerBanks: true,

    owner: true,
    level: true,

    powerEnabled: true,
    towers: true,
    terminal: true,
    storedEnergy: true,
}

constants.roomTypes = {
    commune: {
        source1: true,
        source2: true,
        remotes: true,
        commodities: true,
        powerBanks: true,
    },
    remote: {
        commune: true,
        source1: true,
        source2: true,
        reserverNeed: true,
        builderNeed: true,
    },
    ally: {
        level: true,
    },
    allyRemote: {
        owner: true,
    },
    enemy: {
        level: true,
        powerEnabled: true,
        towers: true,
        terminal: true,
        storedEnergy: true,
    },
    enemyRemote: {
        owner: true,
    },
    keeper: {
        owner: true,
    },
    keeperCenter: {
        owner: true,
    },
    neutral: {

    },
    highway: {

    },
}

constants.creepRoles = [
    'sourceHarvester',
    'hauler',
    'controllerUpgrader',
    'mineralHarvester',
    'antifa',
]

// Set of messages to randomly apply to commune rooms

constants.communeSigns = [
    'A commune of the proletariat. Bourgeoisie not welcome here!'
]

// Set of messages to randomly apply to non-commune rooms

constants.nonCommuneSigns = [
    'The top 1% have more money than the poorest 4.5 billion',
    'McDonalds workers in the US make $10/hour. In Denmark, as a result of unions, they make $22/hour',
    'We have democracy in our policial system, why do we not have it in our companies?',
    'Workers of the world, unite!',
    'Real democracy requires democracy in the workplace - Richard Wolff',
    'Adults spend a combined 13 years of their life under a dictatorship: the workplace',
]

//

constants.colors = {
    white: '#ffffff',
    lightGrey: '#eaeaea',
    lightBlue: '#0f66fc',
    darkBlue: '#02007d',
    black: '#000000',
    yellow: '#d8f100',
    red: '#d10000',
    green: '#00d137',
}

constants.roomDimensions = 50

constants.allStructureTypes = [
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

constants.impassibleStructures = [
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

constants.buildings = {
    main: {
        "extension": { "pos": [{ "x": 2, "y": 1 }, { "x": 1, "y": 1 }, { "x": 4, "y": 1 }, { "x": 1, "y": 2 }, { "x": 2, "y": 3 }, { "x": 3, "y": 2 }, { "x": 5, "y": 2 }, { "x": 5, "y": 1 }, { "x": 4, "y": 3 }, { "x": 3, "y": 4 }, { "x": 1, "y": 5 }, { "x": 1, "y": 4 }, { "x": 2, "y": 5 }, { "x": 4, "y": 5 }, { "x": 5, "y": 5 }, { "x": 5, "y": 4 }] },
        "road": { "pos": [{ "x": 3, "y": 0 }, { "x": 2, "y": 0 }, { "x": 1, "y": 0 }, { "x": 0, "y": 1 }, { "x": 0, "y": 2 }, { "x": 0, "y": 3 }, { "x": 0, "y": 4 }, { "x": 4, "y": 0 }, { "x": 5, "y": 0 }, { "x": 6, "y": 1 }, { "x": 6, "y": 2 }, { "x": 6, "y": 4 }, { "x": 6, "y": 3 }, { "x": 6, "y": 5 }, { "x": 5, "y": 6 }, { "x": 4, "y": 6 }, { "x": 3, "y": 6 }, { "x": 2, "y": 6 }, { "x": 1, "y": 6 }, { "x": 0, "y": 5 }, { "x": 24, "y": 3 }] },
        "spawn": { "pos": [{ "x": 3, "y": 5 }, { "x": 3, "y": 1 }] },
        "container": { "pos": [{ "x": 5, "y": 3 }, { "x": 1, "y": 3 }] },
        "link": { "pos": [{ "x": 3, "y": 3 }] }
    },
    hub: {
        "spawn": { "pos": [{ "x": 1, "y": 2 }] },
        "link": { "pos": [{ "x": 0, "y": 0 }] },
        "factory": { "pos": [{ "x": 1, "y": 0 }] },
        "nuker": { "pos": [{ "x": 0, "y": 1 }] },
        "terminal": { "pos": [{ "x": 0, "y": 2 }] },
        "storage": { "pos": [{ "x": 2, "y": 0 }] },
        "powerSpawn": { "pos": [{ "x": 2, "y": 1 }] },
        "observer": { "pos": [{ "x": 2, "y": 2 }] }
    },
    extensions: {
        "extension": { "pos": [{ "x": 1, "y": 2 }, { "x": 2, "y": 1 }, { "x": 2, "y": 3 }, { "x": 2, "y": 2 }, { "x": 3, "y": 2 }] },
        "road": { "pos": [{ "x": 1, "y": 3 }, { "x": 0, "y": 2 }, { "x": 1, "y": 1 }, { "x": 2, "y": 0 }, { "x": 3, "y": 1 }, { "x": 4, "y": 2 }, { "x": 3, "y": 3 }, { "x": 2, "y": 4 }] }
    },
    towers: {
        "road": { "pos": [{ "x": 0, "y": 0 }, { "x": 1, "y": 1 }, { "x": 2, "y": 2 }] },
        "tower": { "pos": [{ "x": 0, "y": 1 }, { "x": 0, "y": 2 }, { "x": 1, "y": 2 }, { "x": 1, "y": 0 }, { "x": 2, "y": 0 }, { "x": 2, "y": 1 }] }
    },
    labs: {
        "road": { "pos": [{ "x": 3, "y": 3 }, { "x": 2, "y": 2 }, { "x": 1, "y": 1 }, { "x": 0, "y": 0 }] },
        "lab": { "pos": [{ "x": 0, "y": 1 }, { "x": 0, "y": 2 }, { "x": 1, "y": 2 }, { "x": 1, "y": 3 }, { "x": 2, "y": 3 }, { "x": 1, "y": 0 }, { "x": 2, "y": 0 }, { "x": 2, "y": 1 }, { "x": 3, "y": 1 }, { "x": 3, "y": 2 }] }
    },
}
