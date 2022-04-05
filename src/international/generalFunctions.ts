import { constants } from "./constants"

/**
 * Finds the average trading price of a resourceType over a set amount of days
 */
export function findAvgPrice(resourceType: ResourceConstant, days: number = 14) {

    let avgPrice: number = 0

    return avgPrice
}

/**
 * Uses a provided ID to find an object associated with it
 */
export function findObjectWithID(id: Id<any>) {

    return Game.getObjectById(id) || undefined
}

/**
 * Takes a rectange and returns the positions inside of it in an array
 */
export function findPositionsInsideRect(rect: Rect) {

    const positions: Pos[] = []

    for (let x = rect.x1; x <= rect.x2; x++) {
        for (let y = rect.y1; y <= rect.y2; y++) {

            // Iterate if the pos doesn't map onto a room

            if (x < 0 || x >= constants.roomDimensions ||
                y < 0 || y >= constants.roomDimensions) continue

            // Otherwise ass the x and y to positions

            positions.push({ x, y })
        }
    }

    return positions
}

/**
 * Checks if two positions are equal
 */
export function arePositionsEqual(pos1: Pos, pos2: Pos) {

    return (pos1?.x == pos2?.x && pos1?.y == pos2?.y)
}

/**
 * Outputs HTML and CSS styled console logs
 * @param title Title of the log
 * @param message Main content of the log
 * @param color Colour of the text. Default is black
 * @param bgColor Colour of the background. Default is white
 */
export function customLog(title: string, message: any, color: string = constants.colors.black, bgColor: string = constants.colors.white) {

    // Create the title

    global.logs += `<div style='width: 90vw; text-align: center; align-items: center; justify-content: left; display: flex; background: ` + bgColor + `;'><div style='padding: 6px; font-size: 16px; font-weigth: 400; color: ` + color + `;'>` + title + `:</div>`

    // Create the content

    global.logs += `<div style='box-shadow: inset rgb(0, 0, 0, 0.1) 0 0 0 10000px; padding: 6px; font-size: 14px; font-weight: 200; color: ` + color + `;'>` + message + `</div></div>`
}

/**
 * Generates a pixel at the cost of depleting the bucket if the bucket is full
 */
export function advancedGeneratePixel() {

    // Stop if the bot is not running on MMO

    if (!constants.mmoShardNames.has(Game.shard.name)) return false

    // Stop if the cpu bucket isn't full

    if (Game.cpu.bucket != 10000) return false

    // Try to generate a pixel

    return Game.cpu.generatePixel()
}

/**
 * Incrememnts Memory.ID and informs the result
 * @returns an incremented ID
 */
export function newID() {

    return Memory.ID++
}

/**
 * Finds the distance between two rooms based on walkable exits while avoiding rooms with specified types
 */
export function advancedFindDistance(originRoomName: string, goalRoomName: string, typeWeights?: {[key: string]: number})  {

    // Try to find a route from the origin room to the goal room

    const findRouteResult = Game.map.findRoute(originRoomName, goalRoomName, {
        routeCallback(roomName) {

            // If the goal is in the room, inform 1

            if (roomName == goalRoomName) return 1

            // Get the room's memory

            const roomMemory = Memory.rooms[roomName]

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

/**
 *
 * @param distance The number of tiles between the hauling target and source
 * @param income The number of resources added to the pile each tick
 */
export function findCarryPartsRequired(distance: number, income: number) {

    return distance * 2 * income / CARRY_CAPACITY
}

/**
 * Finds a position equally between two positions
 */
export function findAvgBetweenPosotions(pos1: Pos, pos2: Pos) {

    // Inform the rounded average of the two positions

    return {
        x: Math.floor((pos1.x + pos2.x) / 2),
        y: Math.floor((pos1.y + pos2.y) / 2),
    }
}

/**
 * Gets the range between two positions' x and y
 * @param x1 the first position's x
 * @param y1 the first position's y
 * @param x2 the second position's x
 * @param y2 the second position's y
 */
export function getRangeBetween(x1: number, y1: number, x2: number, y2: number) {

    // Find the range using pythagorus through the axis differences

    return Math.floor(Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2)))
}

export function findCPUColor(CPU: number): string {

    // Inform color based on percent of cpu used of limit

    if (CPU > Game.cpu.limit * 0.6) return constants.colors.green
    if (CPU > Game.cpu.limit * 0.9) return constants.colors.green
    return constants.colors.green
}

export function createPackedPosMap(innerArray?: boolean) {

    // Construct the position map

    const packedPosMap: PackedPosMap = []

    // Loop through each x and y in the room

    for (let x = 0; x < constants.roomDimensions; x++) {
        for (let y = 0; y < constants.roomDimensions; y++) {

            // Add an element for this pos

            packedPosMap.push(innerArray ? [] : undefined)
        }
    }

    // Inform the position map

    return packedPosMap
}

export function unPackAsPos(packedPos: number) {

    // Inform an unpacked pos

    return {
        x: Math.floor(packedPos / constants.roomDimensions),
        y: Math.floor(packedPos % constants.roomDimensions)
    }
}

export function unPackAsRoomPos(packedPos: number, roomName: string) {

    // Inform an unpacked RoomPosition

    return new RoomPosition(Math.floor(packedPos / constants.roomDimensions), Math.floor(packedPos % constants.roomDimensions), roomName)
}

export function pack(pos: Pos) {

    // Inform a packed pos

    return pos.x * constants.roomDimensions + pos.y
}
