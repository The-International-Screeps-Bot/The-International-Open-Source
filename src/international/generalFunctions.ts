import { constants } from "./constants"

interface GeneralFunctions {
    /**
     * Finds the average trading price of a resourceType over a set amount of days
     */
    findAvgPrice(resourceType: ResourceConstant, days: number): number

    /**
     * Uses a provided ID to find an object associated with it
     */
    findObjectWithId(ID: string): any

    /**
     * Takes a rectange and returns the positions inside of it in an array
     */
    findPositionsInsideRect(rect: Rect): Pos[]

    /**
     * Checks if two positions are equal
     */
    arePositionsEqual(pos1: Pos, pos2: Pos): boolean

    /**
     * Outputs HTML and CSS styled console logs
     * @param title Title of the log
     * @param message Main content of the log
     * @param color Colour of the text. Default is black
     * @param bgColor Colour of the background. Default is white
     */
    customLog(title: string, message: any, color?: string, bgColor?: string): void

    /**
     * Generates a pixel at the cost of depleting the bucket if the bucket is full
     */
    advancedGeneratePixel(): false | 0 | -6

    /**
     * Incrememnts Memory.ID and informs the result
     * @returns a new ID
     */
    newID(): number

    /**
     * Finds the distance between two rooms based on walkable exits while avoiding rooms with specified types
     */
    advancedFindDistance(originRoomName: string, goalRoomName: string, typeWeights?: {[key: string]: number}): number

    /**
     *
     * @param distance The number of tiles between the hauling target and source
     * @param income The number of resources added to the pile each tick
     */
    findCarryPartsRequired(distance: number, income: number): number

    /**
     * Finds a position equally between two positions
     */
    findAvgBetweenPosotions(pos1: Pos, pos2: Pos): Pos
}

export const generalFuncs: Partial<GeneralFunctions> = {}

generalFuncs.findAvgPrice = function(resourceType, days) {

    let avgPrice: number = 0

    return avgPrice
}

generalFuncs.findObjectWithId = function(id) {

    return Game.getObjectById(id) || undefined
}

generalFuncs.findPositionsInsideRect = function(rect) {

    const positions: Pos[] = []

    for (let x = rect.x1; x <= rect.x2; x++) {
        for (let y = rect.y1; y <= rect.y2; y++) {

            // Iterate if the pos doesn't map onto a room

            if (x < 0 || x >= constants.roomDimensions ||
                y < 0 || y >= constants.roomDimensions) continue

            // Otherwise ass the x and y to positions

            positions.push({ x: x, y: y })
        }
    }

    return positions
}

generalFuncs.arePositionsEqual = function(pos1, pos2) {

    if (pos1?.x == pos2?.x && pos1?.y == pos2?.y) return true
    return false
}

generalFuncs.customLog = function(title, message, color, bgColor) {

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

generalFuncs.advancedGeneratePixel = function() {

    // Stop if the bot is not running on MMO

    if (!constants.mmoShardNames.has(Game.shard.name)) return false

    // Stop if the cpu bucket isn't full

    if (Game.cpu.bucket != 10000) return false

    // Try to generate a pixel

    return Game.cpu.generatePixel()
}

generalFuncs.newID = function() {

    return Memory.ID++
}

generalFuncs.advancedFindDistance = function(originRoomName, goalRoomName, typeWeights)  {

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

generalFuncs.findCarryPartsRequired = function(distance, income) {

    return distance * 2 * income / CARRY_CAPACITY
}

generalFuncs.findAvgBetweenPosotions = function(pos1, pos2) {

    // Inform the rounded average of the two positions

    return {
        x: Math.floor((pos1.x + pos2.x) / 2),
        y: Math.floor((pos1.y + pos2.y) / 2),
    }
}
