import { mmoShardNames, myColors, roomDimensions } from './constants'

/**
 * Finds the average trading price of a resourceType over a set amount of days
 */
export function getAvgPrice(resourceType: MarketResourceConstant, days = 2) {
    // Get the market history for the specified resourceType

    const history = Game.market.getHistory(resourceType)

    // Init the totalPrice

    let totalPrice = 0

    // Iterate through each index less than days

    for (let index = 0; index <= days; index += 1) totalPrice += history[index].avgPrice

    // Inform the totalPrice divided by the days

    return totalPrice / days
}

/**
 * Uses a provided ID to find an object associated with it
 */
export function findObjectWithID<T extends Id<any>>(ID: T): fromId<T> | undefined {
    return Game.getObjectById(ID) || undefined
}

/**
 * Takes a rectange and returns the positions inside of it in an array
 */
export function findCoordsInsideRect(x1: number, y1: number, x2: number, y2: number) {
    const positions: Coord[] = []

    for (let x = x1; x <= x2; x += 1) {
        for (let y = y1; y <= y2; y += 1) {
            // Iterate if the pos doesn't map onto a room

            if (x < 0 || x >= roomDimensions || y < 0 || y >= roomDimensions) continue

            // Otherwise ass the x and y to positions

            positions.push({ x, y })
        }
    }

    return positions
}

/**
 * Checks if two positions are equal
 */
export function arePositionsEqual(pos1: Coord, pos2: Coord) {
    return pos1.x === pos2.x && pos1.y === pos2.y
}

/**
 * Outputs HTML and CSS styled console logs
 * @param title Title of the log
 * @param message Main content of the log
 * @param color Colour of the text. Default is black
 * @param bgColor Colour of the background. Default is white
 */
export function customLog(title: any, message: any, color: string = myColors.black, bgColor: string = myColors.white) {
    // Create the title

    global.logs += `<div style='width: 85vw; text-align: center; align-items: center; justify-content: left; display: flex; background: ${bgColor};'><div style='padding: 6px; font-size: 16px; font-weigth: 400; color: ${color};'>${title}:</div>`

    // Create the content

    global.logs += `<div style='box-shadow: inset rgb(0, 0, 0, 0.1) 0 0 0 10000px; padding: 6px; font-size: 14px; font-weight: 200; color: ${color};'>${message}</div></div>`
}

/**
 * Incrememnts Memory.ID and informs the result
 * @returns an incremented ID
 */
export function newID() {
    return (Memory.ID += 1)
}

/**
 * Finds the distance between two rooms based on walkable exits while avoiding rooms with specified types
 */
export function advancedFindDistance(
    originRoomName: string,
    goalRoomName: string,
    typeWeights?: { [key: string]: number },
) {
    // Try to find a route from the origin room to the goal room

    const findRouteResult = Game.map.findRoute(originRoomName, goalRoomName, {
        routeCallback(roomName) {
            // If the goal is in the room, inform 1

            if (roomName === goalRoomName) return 1

            // Get the room's memory

            const roomMemory = Memory.rooms[roomName]

            // If there is no memory for the room inform impassible

            if (!roomMemory) return Infinity

            // If the type is in typeWeights, inform the weight for the type

            if (typeWeights[roomMemory.type]) return typeWeights[roomMemory.type]

            // Inform to consider this room

            return 2
        },
    })

    // If findRouteResult didn't work, inform a path length of Infinity

    if (findRouteResult === ERR_NO_PATH) return Infinity

    // inform the path's length

    return findRouteResult.length
}

/**
 *
 * @param distance The number of tiles between the hauling target and source
 * @param income The number of resources added to the pile each tick
 */
export function findCarryPartsRequired(distance: number, income: number) {
    return (distance * 2 * income) / CARRY_CAPACITY
}

/**
 * Finds a position equally between two positions
 */
export function findAvgBetweenPositions(pos1: Coord, pos2: Coord) {
    // Inform the rounded average of the two positions

    return {
        x: Math.floor((pos1.x + pos2.x) / 2),
        y: Math.floor((pos1.y + pos2.y) / 2),
    }
}

/**
 * Gets the range between two positions' x and y (Half Manhattan)
 * @param x1 the first position's x
 * @param y1 the first position's y
 * @param x2 the second position's x
 * @param y2 the second position's y
 */
export function getRange(x1: number, x2: number, y1: number, y2: number) {
    // Find the range using Chebyshev's formula

    return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))
}

/**
 * Finds the closest object with a position to a given target, by range (Half Manhattan)
 */
export function findClosestObject<T extends _HasRoomPosition>(target: RoomPosition | Coord, objects: T[]) {
    let minRange = Infinity
    let closest = undefined

    for (const object of objects) {
        const range = getRange(target.x, object.pos.x, target.y, object.pos.y)

        if (range > minRange) continue

        minRange = range
        closest = object
    }

    return closest
}

/**
 * Finds the closest object with a position to a given target, by range, in a specified range (Half Manhattan)
 */
 export function findClosestObjectInRange<T extends _HasRoomPosition>(target: RoomPosition | Coord, objects: T[], range: number) {
    let minRange = Infinity
    let closest = undefined

    for (const object of objects) {
        const range = getRange(target.x, object.pos.x, target.y, object.pos.y)

        if (range > minRange) continue

        minRange = range
        closest = object
    }

    // Inform the closest object, if within range

    if (minRange <= range) return closest
    return false
}

/**
 * Finds the closest position to a given target (Half Manhattan)
 */
export function findClosestPos<T extends RoomPosition | Coord>(target: RoomPosition | Coord, positions: T[]) {
    let minRange = Infinity
    let closest = undefined

    for (const pos of positions) {
        const range = getRange(target.x, pos.x, target.y, pos.y)

        if (range > minRange) continue

        minRange = range
        closest = pos
    }

    return closest
}

/**
 * Gets the range between two positions' x and y (Euclidean)
 * @param x1 the first position's x
 * @param y1 the first position's y
 * @param x2 the second position's x
 * @param y2 the second position's y
 */
export function getRangeEuc(x1: number, x2: number, y1: number, y2: number) {
    // Find the range using Chebyshev's formula

    return Math.round(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) * 10) / 10
}

/**
 * Finds the closest object with a position to a given target (Euclidean)
 */
export function findClosestObjectEuc<T extends _HasRoomPosition>(target: RoomPosition | Coord, objects: T[]) {
    let minRange = Infinity
    let closest = undefined

    for (const object of objects) {
        const range = getRangeEuc(target.x, object.pos.x, target.y, object.pos.y)

        if (range > minRange) continue

        minRange = range
        closest = object
    }

    return closest
}

/**
 * Finds the closest position to a given target (Euclidean)
 */
export function findClosestPosEuc<T extends RoomPosition | Coord>(target: RoomPosition | Coord, positions: T[]) {
    let minRange = Infinity
    let closest = undefined

    for (const pos of positions) {
        const range = getRangeEuc(target.x, pos.x, target.y, pos.y)

        if (range > minRange) continue

        minRange = range
        closest = pos
    }

    return closest
}

export function findCPUColor(): string {
    const CPU = Game.cpu.getUsed()

    // Inform color based on percent of cpu used of limit

    if (CPU > Game.cpu.limit * 0.6) return myColors.green
    if (CPU > Game.cpu.limit * 0.9) return myColors.green
    return myColors.green
}

export function createPosMap(innerArray?: boolean, initialValue?: string | number) {
    // Construct the position map

    const packedPosMap: PosMap<any> = []

    // Loop through each x and y in the room

    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            // Add an element for this pos

            packedPosMap.push(innerArray ? [] : initialValue)
        }
    }

    // Inform the position map

    return packedPosMap
}

export function unpackAsPos(packedPos: number) {
    // Inform an unpacked pos

    return {
        x: Math.floor(packedPos / roomDimensions),
        y: Math.floor(packedPos % roomDimensions),
    }
}

export function unpackAsRoomPos(packedPos: number, roomName: string) {
    // Inform an unpacked RoomPosition

    return new RoomPosition(Math.floor(packedPos / roomDimensions), Math.floor(packedPos % roomDimensions), roomName)
}

export function pack(pos: Coord) {
    // Inform a packed pos

    return pos.x * roomDimensions + pos.y
}

export function packXY(x: number, y: number) {
    // Inform a packed pos

    return x * roomDimensions + y
}

export function findCreepInQueueMatchingRequest(queue: string[], requestPackedPos: number) {
    // Loop through each creepName of the queue

    for (const creepName of queue) {
        // Get the creep using the creepName

        const queuedCreep = Game.creeps[creepName]

        // If the queuedCreep's pos is equal to the moveRequest, inform the creep

        if (pack(queuedCreep.pos) === requestPackedPos) return queuedCreep
    }

    return undefined
}

export function findRemoteSourcesByEfficacy(roomName: string): ('source1' | 'source2')[] {
    // Get the room's sourceNames

    const sourceNames: ('source1' | 'source2')[] = ['source1', 'source2']

    // Get the remote's sourceEfficacies

    const { sourceEfficacies } = Memory.rooms[roomName]

    // Limit sourceNames to the number of sourceEfficacies

    if (sourceNames.length > sourceEfficacies.length) sourceNames.splice(sourceEfficacies.length - 1, 1)

    // Sort sourceNames by efficacy, informing the result

    return sourceNames.sort(function (a, b) {
        return (
            Memory.rooms[roomName].sourceEfficacies[sourceNames.indexOf(a)] -
            Memory.rooms[roomName].sourceEfficacies[sourceNames.indexOf(b)]
        )
    })
}

/**
 * Finds the largest possible transaction amount given a budget and starting amount
 * @param budget The number of energy willing to be invested in the trade
 * @param amount The number of resources that would like to be traded
 * @param roomName1
 * @param roomName2
 * @returns
 */
export function findLargestTransactionAmount(budget: number, amount: number, roomName1: string, roomName2: string) {
    budget = Math.max(budget, 1)

    // So long as the the transactions cost is more than the budget

    while (Game.market.calcTransactionCost(amount, roomName1, roomName2) >= budget) {
        // Decrease amount exponentially

        amount = (amount - 1) * 0.8
    }

    return Math.floor(amount)
}

/**
 * Finds the name of the closest commune, exluding the specified roomName
 */
export function findClosestCommuneName(roomName: string) {
    const communesNotThis = Memory.communes.filter(communeName => roomName !== communeName)

    return communesNotThis.sort(
        (a, b) => Game.map.getRoomLinearDistance(roomName, a) - Game.map.getRoomLinearDistance(roomName, b),
    )[0]
}

export function findClosestClaimType(roomName: string) {
    const claimTypes = Memory.communes
        .concat(Object.keys(Memory.claimRequests))
        .filter(claimRoomName => roomName !== claimRoomName)

    return claimTypes.sort(
        (a, b) => Game.map.getRoomLinearDistance(roomName, a) - Game.map.getRoomLinearDistance(roomName, b),
    )[0]
}

export function findClosestRoomName(start: string, targets: string[]) {
    let minRange = Infinity
    let closest = undefined

    for (const target of targets) {
        const range = Game.map.getRoomLinearDistance(start, target)

        if (range > minRange) continue

        minRange = range
        closest = target
    }

    return closest
}

/**
 * Generates a random integer between two thresholds
 */
export function randomIntRange(min: number, max: number) {
    return Math.floor(Math.random() * (max - min) + min)
}
