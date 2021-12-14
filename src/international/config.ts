/**
 * Configures features like Memory, global and object prototypes required to run the bot
 */
export function config() {

    // Construct global if it isn't constructed yet

    // Check if global is constructed

    if (!global.constructed) {

        // Record that global is now constructed

        global.constructed = true

        global.me = 'MarvinTMB'
        global.privateServerName = 'CarsonComputer'
        global.mmoShards = [
            'shard0',
            'shard1',
            'shard2',
            'shard3'
        ]

        global.allyList = [
            "Q13214",
            "Orlet",
            "BarryOSeven",
            "slowmotionghost",
        ]
        global.tradeBlacklist = ['hi']

        global.tasks = {}

        global.roomTypeProperties = {
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

        global.roomTypes = {
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

        global.roomTasks = {}

        global.creepRoles = [
            'sourceHarvester',
            'hauler'
        ]

        global.internationalTaskTypes = [
            'recieve',
            'attack',
            'claim',
            'establish',
        ]

        global.roomTaskTypes = [
            'withdraw',
            'transfer',
            'build',
            'pull',
            'harvestSource',
            'harvestMineral',
            'linkTransfer',
        ]

        // Set of messages to randomly apply to commune rooms

        global.communeSignMessages = [
            'A commune of the proletariat. Bourgeoisie not welcome here!'
        ]

        // Set of messages to randomly apply to non-commune rooms

        global.nonCommuneSignMessages = [
            'The top 1% have more money than the poorest 4.5 billion',
            'McDonalds workers in the US make $10/hour. In Denmark, as a result of unions, they make $22/hour',
            'We have democracy in our policial system, why do we not have it in our companies?',
            'Workers of the world, unite!',
            'Real democracy requires democracy in the workplace - Richard Wolff',
            'Adults spend a combined 13 years of their life under a dictatorship: the workplace',
        ]

        //

        global.colors = {
            white: '#ffffff',
            lightGrey: '#eaeaea',
            lightBlue: '#0f66fc',
            darkBlue: '#02007d',
            black: '#000000',
            yellow: '#d8f100',
            red: '#d10000',
            green: '#00d137',
        }

        global.roomDimensions = 50

        global.allStructureTypes = [
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

        global.impassibleStructures = [
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
    }

    // Construct Memory if it isn't constructed yet

    // Check if Memory is constructed

    if (!Memory.constructed) {

        // Record that Memory is now constructed

        Memory.constructed = true

        // Construct foundation

        Memory.rooms = {}
        Memory.creeps = {}
        Memory.powerCreeps = {}
        Memory.flags = {}
        Memory.spawns = {}

        Memory.ID = 0
        Memory.constructionSites = {}

        // Config settings

        Memory.roomVisuals = false
        Memory.mapVisuals = false
        Memory.cpuLogging = false

        //

        Memory.memoryLimit = 2097
    }
}
