interface Constants {
     /**
      * The username of the account the bot is running for
      */
     me: string

     /**
      * The names of the shards for the mmo server
      */
     mmoShardNames: Set<string>

     /**
      * An array of usernames of players to avoid trading with
      */
     tradeBlacklist: Set<string>

     /**
      * A set of properties that are relative to a room's type
      */
     roomTypeProperties: { [key: string]: boolean }

     /**
      * A set of roomTypes with the properties they should be assigned
      */
     roomTypes: { [key: string]: { [key: string]: boolean } }

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
     impassibleStructureTypes: StructureConstant[]

     /**
      * an array of structureTypes ordered by build priority
      */
     structureTypesByBuildPriority: BuildableStructureConstant[]

     structureTypesByNumber: { [key: string]: number }

     numbersByStructureTypes: { [key: string]: BuildableStructureConstant | 'empty' }

     styleForStructureTypes: { [key: string]: CircleStyle }
}

export const constants: Partial<Constants> = {}

// constants.me = Memory.me
constants.me = Memory.me
constants.mmoShardNames = new Set(['shard0', 'shard1', 'shard2', 'shard3'])

export const allyList = new Set(['Q13214', 'HerrKai', 'clarkok', 'PandaMaster'])

constants.tradeBlacklist = new Set([])

constants.roomTypeProperties = {
     source1: true,
     source2: true,
     remotes: true,
     commodities: true,
     powerBanks: true,
     notClaimable: true,

     commune: true,
     needs: true,
     sourceEfficacies: true,
     abandoned: true,

     owner: true,
     level: true,

     powerEnabled: true,
     towers: true,
     hasTerminal: true,
     storedEnergy: true,

     portalsTo: true,
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
          needs: true,
          sourceEfficacies: true,
          abandoned: true,
          notClaimable: true,
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
          hasTerminal: true,
          storedEnergy: true,
          notClaimable: true,
     },
     enemyRemote: {
          owner: true,
          notClaimable: true,
     },
     neutral: {
          notClaimable: true,
     },
     keeper: {
          owner: true,
     },
     keeperCenter: {
          owner: true,
     },
     highway: {},
     intersection: {
          portalsTo: true,
     },
}

constants.creepRoles = [
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
     'scout',
     'claimer',
     'vanguard',
     'antifa',
]

// Set of messages to randomly apply to commune rooms

constants.communeSigns = ['A commune of the proletariat. Bourgeoisie not welcome here!']

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
     brown: '#aa7253',
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

constants.impassibleStructureTypes = [
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

constants.structureTypesByBuildPriority = [
     STRUCTURE_SPAWN,
     STRUCTURE_EXTENSION,
     STRUCTURE_CONTAINER,
     STRUCTURE_TOWER,
     STRUCTURE_STORAGE,
     STRUCTURE_ROAD,
     STRUCTURE_WALL,
     STRUCTURE_RAMPART,
     STRUCTURE_TERMINAL,
     STRUCTURE_LINK,
     STRUCTURE_EXTRACTOR,
     STRUCTURE_LAB,
     STRUCTURE_FACTORY,
     STRUCTURE_POWER_SPAWN,
     STRUCTURE_NUKER,
     STRUCTURE_OBSERVER,
]

constants.structureTypesByNumber = {
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

constants.numbersByStructureTypes = {
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

export const stamps: Record<StampTypes, Partial<Stamp>> = {
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
          protectionOffset: 1,
          size: 1,
          structures: {
               link: [{ x: 0, y: 0 }],
          },
     },
     sourceExtension: {
          offset: 0,
          protectionOffset: 1,
          size: 1,
          structures: {
               extension: [{ x: 0, y: 0 }],
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
     boardingRampart: {
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
     remoteDefender: 4,
     remoteCoreAttacker: 5,
     remoteBuilder: 6,
}

export const claimRequestNeedsIndex = {
     claimer: 0,
     vanguard: 1,
     defender: 2,
}

export const attackRequestNeedsIndex = {
     ranged: 0,
     attack: 1,
     dismantle: 2,
}

export const remoteHarvesterRoles: ('source1RemoteHarvester' | 'source2RemoteHarvester')[] = [
     'source1RemoteHarvester',
     'source2RemoteHarvester',
]

export const spawnByRoomRemoteRoles: ('source1RemoteHarvester' | 'source2RemoteHarvester' | 'remoteReserver')[] = [
     'source1RemoteHarvester',
     'source2RemoteHarvester',
     'remoteReserver',
]

export const builderSpawningWhenStorageThreshold = 40000

export const upgraderSpawningWhenStorageThreshold = 60000

export const CPUBucketCapacity = 10000

export const CPUBucketRenewThreshold = 5000
export const prefferedCommuneRange = 6
export const allyTrading = false
export const relayRoles: Partial<CreepRoles>[] = ['hauler', 'remoteHauler']
