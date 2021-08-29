function config() {

    // Eventually move this to tickConfig

    if (!Memory.data) {

        Memory.data = {}
    }

    // Creep data

    Memory.data.mineralsHarvested = 0

    Memory.data.boostsProduced = 0

    Memory.data.powerHarvested = 0

    Memory.data.powerProcessed = 0

    Memory.data.commoditiesHarvested = 0

    Memory.data.energyHarvested = 0

    Memory.data.controlPoints = 0

    Memory.data.energySpentOnConstruction = 0

    Memory.data.energySpentOnRepairs = 0

    Memory.data.energySpentOnBarricades = 0

    // Other data

    Memory.data.timeSpentSpawning = 0

    Memory.data.energySpentOnCreeps = 0

    Memory.data.energySpentOnPower = 0

    Memory.data.opsGenerated = 0

    Memory.data.cpuPerCreep = 0

    Memory.data.roomManager = {}

    Memory.data.marketAverages = {}

    // Global config

    if (!Memory.global) Memory.global = {}

    let globalValues = {
        resourceRequests: {},
        claimableRooms: [],
        newCommune: undefined,
    }

    for (let value in globalValues) {

        if (!Memory.global[value]) Memory.global[value] = globalValues[value]
    }

    Memory.global.totalEnergy = 0

    Memory.global.communes = []
    Memory.global.establishedRooms = []

    // Command defaults

    if (Memory.global.consoleMessages == undefined) Memory.global.consoleMessages = false
    if (Memory.global.mapVisuals == undefined) Memory.global.mapVisuals = false
    if (Memory.global.roomVisuals == undefined) Memory.global.roomVisuals = false

    // Room config

    for (let roomName in Game.rooms) {

        let room = Game.rooms[roomName]

        let controller = room.get("controller")
        if (!controller || !controller.my) continue

        Memory.global.communes.push(roomName)

        let roomValues = {
            remoteRooms: {},
            deposits: {},
            boosts: {},
            storedEnergy: 0,
        }

        for (let value in roomValues) {

            if (!room.memory[value]) room.memory[value] = roomValues[value]
        }
    }
}

module.exports = config