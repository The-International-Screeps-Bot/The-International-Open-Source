// If global is not constructed

if (!global.active) {

    // Record that global has been reconstructed

    global.active = true

    global.me = 'MarvinTMB' // My username
    global.allyList = ['hi'] // Allies

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

    global.creepRoles = [
        'sourceHarvester',
        'hauler'
    ]

    //

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
}
