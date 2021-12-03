global.findAvgPrice = function(resourceType, days) {

    let avgPrice: number = 0

    return avgPrice
}

global.findObjectWithId = function(id) {

    return Game.getObjectById(id) || undefined
}

global.findPositionsInsideRect = function(rect) {

    const positions: Pos[] = []

    for (let x = rect.x1; x <= rect.x2; x++) {
        for (let y = rect.y1; y <= rect.y2; y++) {

            positions.push({ x: x, y: y })
        }
    }

    return positions
}

global.arePositionsAlike = function(pos1, pos2) {

    if (pos1.x == pos2.x && pos1.y == pos2.y) return true
    return false
}

global.customLog = function(title, message, color, bgColor) {

    // Assign defaults if parameters were missing

    if (!color) color = global.colors.black
    if (!bgColor) bgColor = global.colors.white

    // Construct log

    let log: string = ``

    // Create the title

    log += `<div style='width: 90vw; text-align: center; align-items: center; justify-content: left; display: flex; background: ` + bgColor + `;'><div style='padding: 6px; font-size: 16px; font-weigth: 400; color: ` + color + `;'>` + title + `:</div>`

    // Create the content

    log += `<div style='box-shadow: inset rgb(0, 0, 0, 0.1) 0 0 0 10000px; padding: 6px; font-size: 14px; font-weight: 200; color: ` + color + `;'>` + message + `</div></div>`

    // Add this to logs for output

    global.logs += log
}

global.advancedGeneratePixel = function() {

    // Stop if the bot is not running on MMO

    if (!global.mmoShards.includes(Game.shard.name)) return false

    // Stop if the cpu bucket isn't full

    if (Game.cpu.bucket != 10000) return false

    // Try to generate a pixel

    return Game.cpu.generatePixel()
}

// Commands

global.killAllCreeps = function() {

    // Loop through each creepName

    for (const creepName in Game.creeps) {

        // Construct and suicide the creep

        const creep = Game.creeps[creepName]
        creep.suicide()
    }

    return 'Killed all creeps'
}
