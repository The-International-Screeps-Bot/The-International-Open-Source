/**
Configures features needed to run the bot
*/
export function config() {

    // Construct global if it isn't constructed yet

    // Check if global is constructed

    if (!global.constructed) {

        // Record that global is now constructed

        global.constructed = true

        global.me = 'MarvinTMB'
        global.allyList = [
            "Q13214",
            "Orlet",
            "BarryOSeven",
            "slowmotionghost",
        ]
        global.tradeBlacklist = ['hi']

        global.tasks = {}

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
        global.log = ``
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

        // Config settings

        Memory.roomVisuals = false
        Memory.mapVisuals = false
        Memory.cpuLogging = false

        // General

        Memory.communes = []

        Memory.energy = 0

        Memory.boosts = {}

        // CPU

        Memory.cpuUsage = 0
        Memory.cpuLimit = Game.cpu.limit
        Memory.cpuBucket = Game.cpu.bucket

        // Memory

        Memory.memorUsage = Math.floor(RawMemory.get().length / 1000)
        Memory.memoryLimit = 2097
    }
}
