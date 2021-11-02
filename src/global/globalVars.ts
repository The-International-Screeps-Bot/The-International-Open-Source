// If global is not constructed

if (!global.active) {

    // Record that global has been reconstructed

    global.active = true

    global.me = 'MarvinTMB' // My username
    global.allyList = [] // Allies

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
        'SourceHarvester'
    ]

    global.roomDimensions = 50
}
