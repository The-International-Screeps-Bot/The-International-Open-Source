import { constants } from 'international/constants'

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

            // Iterate if the pos doesn't map onto a room

            if (x < 0 || x >= constants.roomDimensions ||
                y < 0 || y >= constants.roomDimensions) continue

            positions.push({ x: x, y: y })
        }
    }

    return positions
}

global.arePositionsEqual = function(pos1, pos2) {

    if (pos1?.x == pos2?.x && pos1?.y == pos2?.y) return true
    return false
}

global.customLog = function(title, message, color, bgColor) {

    // Assign defaults if parameters were missing

    if (!color) color = constants.colors.black
    if (!bgColor) bgColor = constants.colors.white

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

    if (!constants.mmoShardNames.includes(Game.shard.name)) return false

    // Stop if the cpu bucket isn't full

    if (Game.cpu.bucket != 10000) return false

    // Try to generate a pixel

    return Game.cpu.generatePixel()
}

global.newID = function() {

    return Memory.ID++
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

global.advancedGetValue = function(key, defaultValue) {

    // If there is no value for the global reference of the key create one

    if (!global[key]) global[key] = defaultValue

    // Inform the global key reference's value

    return global[key]
}

global.advancedFindDistance = function(originRoomName, goalRoomName, typeWeights)  {

    // Try to find a route from the origin room to the goal room

    const findRouteResult = Game.map.findRoute(originRoomName, goalRoomName, {
        routeCallback(roomName) {

            const roomMemory = Memory.rooms[roomName]

            // If the goal is in the room, inform 1

            if (roomName == goalRoomName) return 1

            // If there is no memory for the room inform impassible

            if (!roomMemory) return Infinity

            // If the type is in typeWeights, inform the weight for the type

            if (typeWeights[roomMemory.type]) return typeWeights[roomMemory.type]

            // Inform to consider this room

            return 2
        }
    })

    // If findRouteResult didn't work, inform a path length of Infinity

    if (findRouteResult == ERR_NO_PATH) return Infinity

    // inform the path's length

    return findRouteResult.length
}

global.findCarryPartsRequired = function(distance, income) {

    return distance * 2 * income / CARRY_CAPACITY
}

global.findAvgBetweenPosotions = function(pos1, pos2) {

    return pos1
}
