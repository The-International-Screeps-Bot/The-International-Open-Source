import { ErrorMapper } from 'other/ErrorMapper';
import { customColors, roomDimensions, roomTypeProperties, roomTypes, RoomMemoryKeys, RoomTypes, } from './constants';
/**
 * Finds the average trading price of a resourceType over a set amount of days
 */
export function getAvgPrice(resourceType, days = 2) {
    // Get the market history for the specified resourceType
    const history = Game.market.getHistory(resourceType);
    if (!history.length)
        return 1;
    // Init the totalPrice
    let totalPrice = 0;
    // Iterate through each index less than days
    for (let index = 0; index <= days; index += 1) {
        if (!history[index])
            continue;
        totalPrice += history[index].avgPrice;
    }
    // Inform the totalPrice divided by the days
    return totalPrice / days;
}
/**
 * Uses a provided ID to find an object associated with it
 */
export function findObjectWithID(ID) {
    return Game.getObjectById(ID) || undefined;
}
/**
 * Check if an x and y are valid when mapped onto a room
 */
export function doesXYExist(x, y) {
    return x >= 0 && x < roomDimensions && y >= 0 && y < roomDimensions;
}
/**
 * Check if a coord is valid when mapped onto a room
 */
export function doesCoordExist(coord) {
    return coord.x >= 0 && coord.x < roomDimensions && coord.y >= 0 && coord.y < roomDimensions;
}
/**
 * Takes a rectange and returns the coords inside of it in an array
 */
export function findCoordsInsideRect(x1, y1, x2, y2) {
    const coords = [];
    for (let x = x1; x <= x2; x += 1) {
        for (let y = y1; y <= y2; y += 1) {
            // Iterate if the pos doesn't map onto a room
            if (x < 0 || x >= roomDimensions || y < 0 || y >= roomDimensions)
                continue;
            // Otherwise pass the x and y to positions
            coords.push({ x, y });
        }
    }
    return coords;
}
/**
 * Takes a coord and returns the coords inside of it in an array
 */
export function findCoordsInRangeXY(startX, startY, range) {
    const coords = [];
    for (let x = startX - range; x <= startX + range; x += 1) {
        for (let y = startY - range; y <= startY + range; y += 1) {
            // Iterate if the pos doesn't map onto a room
            if (startX < 0 || startX >= roomDimensions || startY < 0 || startY >= roomDimensions)
                continue;
            // Otherwise pass the x and y to positions
            coords.push({ x, y });
        }
    }
    return coords;
}
/**
 * Takes a coord and returns the positions inside of it in an array
 */
export function findCoordsInRange(coord, range) {
    return findCoordsInRangeXY(coord.x, coord.y, range);
}
export function findAdjacentCoordsToXY(x, y) {
    const positions = [];
    for (let i = x - 1; i <= x + 1; i += 1) {
        for (let j = y - 1; j <= y + 1; j += 1) {
            // Iterate if the pos doesn't map onto a room
            if (i < 0 || i >= roomDimensions || j < 0 || j >= roomDimensions)
                continue;
            if (x === i && y === j)
                continue;
            // Otherwise pass the x and y to positions
            positions.push({ x: i, y: j });
        }
    }
    return positions;
}
export function findAdjacentCoordsToCoord(coord) {
    return findAdjacentCoordsToXY(coord.x, coord.y);
}
/**
 * Checks if two coords are equal
 */
export function areCoordsEqual(coord1, coord2) {
    return coord1.x === coord2.x && coord1.y === coord2.y;
}
/**
 * Checks if two positions are equal
 */
export function arePositionsEqual(pos1, pos2) {
    return pos1.roomName === pos2.roomName && pos1.x === pos2.x && pos1.y === pos2.y;
}
/**
 * Outputs HTML and CSS styled console logs
 * @param title Title of the log
 * @param message Main content of the log
 * @param color Colour of the text. Default is black
 * @param bgColor Colour of the background. Default is white
 */
export function customLog(title, message, opts) {
    var _a;
    if (!Memory.logging)
        return;
    if (!opts)
        opts = {};
    if (!opts.textColor)
        opts.textColor = customColors.black;
    if (!opts.bgColor)
        opts.bgColor = customColors.white;
    // Create the title
    global.logs += `<div style='width: 85vw; text-align: center; align-items: center; justify-content: left; display: flex; background: ${opts.bgColor}; margin-left: ${((_a = opts.superPosition) !== null && _a !== void 0 ? _a : 0) * 8}px;'><div style='padding: 3px; font-size: 14px; font-weigth: 400; color: ${opts.textColor};'>${title}:</div>`;
    // Create the content
    global.logs += `<div style='box-shadow: inset rgb(0, 0, 0, 0.1) 0 0 0 10000px; padding: 3px; font-size: 14px; font-weight: 200; color: ${opts.textColor};'>${message !== null && message !== void 0 ? message : ''}</div></div>`;
}
/**
 * Incrememnts Memory.ID and informs the result
 * @returns an incremented ID
 */
export function newID() {
    return (Memory.ID += 1).toString();
}
/**
 * Finds the distance between two rooms based on walkable exits while avoiding rooms with specified types
 */
export function advancedFindDistance(originRoomName, goalRoomName, opts = {}) {
    // Try to find a route from the origin room to the goal room
    const findRouteResult = Game.map.findRoute(originRoomName, goalRoomName, {
        routeCallback(roomName) {
            const roomMemory = Memory.rooms[roomName];
            if (!roomMemory) {
                if (roomName === goalRoomName)
                    return 1;
                return 50;
            }
            if (opts.avoidDanger && roomMemory[RoomMemoryKeys.type] === RoomTypes.remote) {
                if (roomMemory[RoomMemoryKeys.abandonRemote]) {
                    return 30;
                }
            }
            // If the goal is in the room
            if (roomName === goalRoomName)
                return 1;
            // If the type is in typeWeights, inform the weight for the type
            if (opts.typeWeights && opts.typeWeights[roomMemory[RoomMemoryKeys.type]])
                return opts.typeWeights[roomMemory[RoomMemoryKeys.type]];
            return 1;
        },
    });
    // If findRouteResult didn't work, inform a path length of Infinity
    if (findRouteResult === ERR_NO_PATH)
        return Infinity;
    // inform the path's length
    return findRouteResult.length;
}
/**
 *
 * @param distance The number of tiles between the hauling target and source
 * @param income The number of resources added to the pile each tick
 */
export function findCarryPartsRequired(distance, income) {
    return Math.ceil((distance * 2 * income) / CARRY_CAPACITY);
}
export function findLinkThroughput(range, income = LINK_CAPACITY) {
    return Math.min(LINK_CAPACITY / range, income) * (1 - LINK_LOSS_RATIO);
}
/**
 * Finds a position equally between two positions
 */
export function findAvgBetweenCoords(pos1, pos2) {
    // Inform the rounded average of the two positions
    return {
        x: Math.floor((pos1.x + pos2.x) / 2),
        y: Math.floor((pos1.y + pos2.y) / 2),
    };
}
/**
 * Gets the range between two positions' x and y (Half Manhattan)
 * @param x1 the first position's x
 * @param y1 the first position's y
 * @param x2 the second position's x
 * @param y2 the second position's y
 */
export function getRangeXY(x1, x2, y1, y2) {
    // Find the range using Chebyshev's formula
    return Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1));
}
export function getRange(coord1, coord2) {
    return getRangeXY(coord1.x, coord2.x, coord1.y, coord2.y);
}
/**
 * Finds the closest object with a position to a given target, by range (Half Manhattan)
 */
export function findClosestObject(target, objects) {
    let minRange = Infinity;
    let closest = undefined;
    for (const object of objects) {
        const range = getRangeXY(target.x, object.pos.x, target.y, object.pos.y);
        if (range > minRange)
            continue;
        minRange = range;
        closest = object;
    }
    return closest;
}
/**
 * Finds the closest object with a position to a given target, by range, in a specified range (Half Manhattan)
 */
export function findClosestObjectInRange(target, objects, range) {
    let minRange = Infinity;
    let closest = undefined;
    for (const object of objects) {
        const range = getRangeXY(target.x, object.pos.x, target.y, object.pos.y);
        if (range > minRange)
            continue;
        minRange = range;
        closest = object;
    }
    // Inform the closest object, if within range
    if (minRange <= range)
        return closest;
    return false;
}
/**
 * Finds the closest position to a given target (Half Manhattan)
 */
export function findClosestCoord(target, positions) {
    let minRange = Infinity;
    let closestI = 0;
    for (let i = 0; i < positions.length; i++) {
        const pos = positions[i];
        const range = getRangeXY(target.x, pos.x, target.y, pos.y);
        if (range > minRange)
            continue;
        minRange = range;
        closestI = i;
    }
    return [positions[closestI], closestI];
}
/**
 * Finds the closest position to a given target (Half Manhattan)
 */
export function findClosestPos(target, positions) {
    let minRange = Infinity;
    let closest = undefined;
    for (const pos of positions) {
        const range = getRangeXY(target.x, pos.x, target.y, pos.y);
        if (range > minRange)
            continue;
        minRange = range;
        closest = pos;
    }
    return closest;
}
/**
 * Gets the range between two positions' x and y (Euclidean)
 */
export function getRangeEucXY(x1, x2, y1, y2) {
    // Find the range using Chebyshev's formula
    return Math.round(Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2)) * 10) / 10;
}
export function getRangeEuc(coord1, coord2) {
    return getRangeEucXY(coord1.x, coord2.x, coord1.y, coord2.y);
}
/**
 * Finds the closest object with a position to a given target (Euclidean)
 */
export function findClosestObjectEuc(target, objects) {
    let minRange = Infinity;
    let closest = undefined;
    for (const object of objects) {
        const range = getRangeEucXY(target.x, object.pos.x, target.y, object.pos.y);
        if (range >= minRange)
            continue;
        minRange = range;
        closest = object;
    }
    return closest;
}
/**
 * Finds the closest object with a position to a given target (Euclidean)
 */
export function findFurthestObjectEuc(target, objects) {
    let maxRange = Infinity;
    let furthest = undefined;
    for (const object of objects) {
        const range = getRangeEucXY(target.x, object.pos.x, target.y, object.pos.y);
        if (range <= maxRange)
            continue;
        maxRange = range;
        furthest = object;
    }
    return furthest;
}
/**
 * Finds the closest position to a given target (Euclidean)
 */
export function findClosestPosEuc(target, positions) {
    let minRange = Infinity;
    let closest = undefined;
    for (const pos of positions) {
        const range = getRangeEucXY(target.x, pos.x, target.y, pos.y);
        if (range >= minRange)
            continue;
        minRange = range;
        closest = pos;
    }
    return closest;
}
export function findCPUColor() {
    const CPU = Game.cpu.getUsed();
    // Inform color based on percent of cpu used of limit
    if (CPU > Game.cpu.limit * 0.6)
        return customColors.green;
    if (CPU > Game.cpu.limit * 0.9)
        return customColors.green;
    return customColors.green;
}
export function createPosMap(innerArray, initialValue) {
    // Construct the position map
    const packedPosMap = [];
    // Loop through each x and y in the room
    for (let x = 0; x < roomDimensions; x += 1) {
        for (let y = 0; y < roomDimensions; y += 1) {
            // Add an element for this pos
            packedPosMap.push(innerArray ? [] : initialValue);
        }
    }
    // Inform the position map
    return packedPosMap;
}
export function packAsNum(pos) {
    // Inform a packed pos
    return pos.x * roomDimensions + pos.y;
}
export function packXYAsNum(x, y) {
    // Inform a packed pos
    return x * roomDimensions + y;
}
export function unpackNumAsCoord(packedCoord) {
    // Inform an unpacked pos
    return {
        x: Math.floor(packedCoord / roomDimensions),
        y: Math.floor(packedCoord % roomDimensions),
    };
}
export function unpackNumAsPos(packedPos, roomName) {
    // Inform an unpacked RoomPosition
    return new RoomPosition(Math.floor(packedPos / roomDimensions), Math.floor(packedPos % roomDimensions), roomName);
}
export function findCreepInQueueMatchingRequest(queue, requestPackedPos) {
    // Loop through each creepName of the queue
    for (const creepName of queue) {
        // Get the creep using the creepName
        const queuedCreep = Game.creeps[creepName];
        // If the queuedCreep's pos is equal to the moveRequest, inform the creep
        if (packAsNum(queuedCreep.pos) === requestPackedPos)
            return queuedCreep;
    }
    return undefined;
}
/**
 * Finds the largest possible transaction amount given a budget and starting amount
 * @param budget The number of energy willing to be invested in the trade
 * @param amount The number of resources that would like to be traded
 * @param roomName1
 * @param roomName2
 * @returns
 */
export function findLargestTransactionAmount(budget, amount, roomName1, roomName2) {
    budget = Math.max(budget, 1);
    // So long as the the transactions cost is more than the budget
    while (Game.market.calcTransactionCost(amount, roomName1, roomName2) >= budget) {
        // Decrease amount exponentially
        amount = (amount - 1) * 0.8;
    }
    return Math.floor(amount);
}
/**
 * Finds the name of the closest commune, exluding the specified roomName
 */
export function findClosestCommuneName(roomName) {
    const communesNotThis = [];
    for (const communeName of global.communes) {
        if (roomName == communeName)
            continue;
        communesNotThis.push(communeName);
    }
    return communesNotThis.sort((a, b) => Game.map.getRoomLinearDistance(roomName, a) -
        Game.map.getRoomLinearDistance(roomName, b))[0];
}
export function findClosestClaimType(roomName) {
    return Array.from(global.communes).sort((a, b) => Game.map.getRoomLinearDistance(roomName, a) -
        Game.map.getRoomLinearDistance(roomName, b))[0];
}
export function findClosestRoomName(start, targets) {
    let minRange = Infinity;
    let closest = undefined;
    for (const target of targets) {
        const range = Game.map.getRoomLinearDistance(start, target);
        if (range > minRange)
            continue;
        minRange = range;
        closest = target;
    }
    return closest;
}
/**
 * Generatesa a random integer between two thresholds
 */
export function randomIntRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
export function findFunctionCPU(func) {
    const CPU = Game.cpu.getUsed();
    func();
    customLog('CPU for ' + func, Game.cpu.getUsed() - CPU);
}
export function isXYExit(x, y) {
    return x <= 0 || x >= roomDimensions - 1 || y <= 0 || y >= roomDimensions - 1;
}
export function isExit(coord) {
    return (coord.x <= 0 ||
        coord.x >= roomDimensions - 1 ||
        coord.y <= 0 ||
        coord.y >= roomDimensions - 1);
}
export function randomTick(max = 20) {
    return Game.time % Math.floor(Math.random() * max) === 0;
}
export function randomChance(number = 10) {
    return Math.floor(Math.random() * number) === number;
}
export function randomRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}
/**
 * Removes roomType-based values in the room's memory that don't match its type
 */
export function cleanRoomMemory(roomName) {
    const roomMemory = Memory.rooms[roomName];
    // Loop through keys in the room's memory
    for (const key in roomMemory) {
        // Iterate if key is not part of roomTypeProperties
        if (!roomTypeProperties.has(key))
            continue;
        // Iterate if key is part of this roomType's properties
        if (roomTypes[roomMemory[RoomMemoryKeys.type]].has(key))
            continue;
        delete roomMemory[key];
    }
}
export function isNearRoomEdge(coord, minRange) {
    if (coord.x <= minRange)
        return true;
    if (coord.x - roomDimensions - 1 <= minRange)
        return true;
    if (coord.y <= minRange)
        return true;
    if (coord.y - roomDimensions - 1 <= minRange)
        return true;
    return false;
}
/**
 * Increases priority as a percentage of capacity used
 * @param reverse Decreases priority as a percentage of capacity used
 */
export function scalePriority(capacity, amount, multiplier = 1, reverse) {
    if (reverse) {
        return (1 - amount / capacity) * multiplier;
    }
    return (amount / capacity) * multiplier;
}
export function makeRoomCoord(roomName) {
    // Find the numbers in the room's name
    let [name, cx, x, cy, y] = roomName.match(/^([WE])([0-9]+)([NS])([0-9]+)$/);
    return {
        x: cx === 'W' ? ~x : parseInt(x),
        y: cy === 'S' ? ~y : parseInt(y),
    };
}
export function roomNameFromRoomXY(x, y) {
    return ((x < 0 ? 'W' + String(~x) : 'E' + String(x)) + (y < 0 ? 'S' + String(~y) : 'N' + String(y)));
}
export function roomNameFromRoomCoord(roomCoord) {
    return roomNameFromRoomXY(roomCoord.x, roomCoord.y);
}
export function forRoomNamesInRangeXY(startX, startY, range, f) {
    for (let x = startX - range; x <= startX + range; x += 1) {
        for (let y = startY - range; y <= startY + range; y += 1) {
            if (startX === x && startY === y)
                continue;
            f(x, y);
        }
    }
}
export function forRoomNamesAroundRangeXY(startX, startY, range, f) {
    for (let x = startX - range; x <= startX + range; x += 1) {
        for (let y = startY - range; y <= startY + range; y += 1) {
            if (startX === x && startY === y)
                continue;
            f(x, y);
        }
    }
}
export function isXYInRoom(x, y) {
    return x >= 0 && x < roomDimensions && y >= 0 && y < roomDimensions;
}
export function isXYInBorder(x, y, inset) {
    return (x > inset && x < roomDimensions - 1 - inset && y > inset && y < roomDimensions - 1 - inset);
}
export function roundTo(num, decimals) {
    return parseFloat(num.toFixed(decimals));
}
/**
 * Ripped from @external https://github.com/Mirroar/hivemind
 * Runs a callback within a try/catch block while using the ErrorMapper to trace error
 *
 * @param {function} callback The callback to run.
 * @return {mixed} Whatever the original fuction returns.
 */
export function tryErrorMapped(callback) {
    try {
        return callback();
    }
    catch (error) {
        let stackTrace = error.stack;
        if (error instanceof Error) {
            stackTrace = _.escape(ErrorMapper.sourceMappedStackTrace(error));
        }
        console.log('<span style="color:red">' + error.name + stackTrace + '</span>');
    }
    return undefined;
}
export function forAdjacentCoords(startCoord, f) {
    for (let x = startCoord.x - 1; x <= startCoord.x + 1; x += 1) {
        for (let y = startCoord.y - 1; y <= startCoord.y + 1; y += 1) {
            if (x == startCoord.x && y === startCoord.y)
                continue;
            if (isXYExit(x, y))
                continue;
            f({ x, y });
        }
    }
}
/**
 * Excludes center around range
 */
export function forCoordsAroundRange(startCoord, range, f) {
    for (let x = startCoord.x - range; x <= startCoord.x + range; x += 1) {
        for (let y = startCoord.y - range; y <= startCoord.y + range; y += 1) {
            if (x == startCoord.x && y === startCoord.y)
                continue;
            // Iterate if the pos doesn't map onto a room
            if (x < 0 || x >= roomDimensions || y < 0 || y >= roomDimensions)
                continue;
            f({ x, y });
        }
    }
}
/**
 * includes center around range
 */
export function forCoordsInRange(startCoord, range, f) {
    for (let x = startCoord.x - range; x <= startCoord.x + range; x += 1) {
        for (let y = startCoord.y - range; y <= startCoord.y + range; y += 1) {
            // Iterate if the pos doesn't map onto a room
            if (x < 0 || x >= roomDimensions || y < 0 || y >= roomDimensions)
                continue;
            f({ x, y });
        }
    }
}
export function randomVal(array) {
    return array[randomIntRange(0, array.length)];
}
export function findRangeFromExit(coord) {
    const dx = Math.min(coord.x, roomDimensions - 1 - coord.x);
    const dy = Math.min(coord.y, roomDimensions - 1 - coord.y);
    return Math.min(dx, dy);
}
/**
 * Finds the weighted range of a coord from an exit, where the weight effects values
 */
export function findWeightedRangeFromExit(coord, weight) {
    const dx = Math.min(coord.x, roomDimensions - 1 - coord.x);
    const dy = Math.min(coord.y, roomDimensions - 1 - coord.y);
    const weightedRange = Math.pow(Math.min(dx, dy), weight);
    return roundTo(weightedRange, 2);
}
/**
 * @example splitAt('foo, 1), // ["f", "oo"]
 */
export function splitStringAt(string, index) {
    return [string.slice(0, index), string.slice(index)];
}
export function findHighestScore(iter, f) {
    let highestScore = 0;
    for (const val of iter) {
        const score = f(val);
        if (score === false)
            continue;
        if (score <= highestScore)
            continue;
        highestScore = score;
    }
    return highestScore;
}
export function findWithHighestScore(iter, f) {
    let highestScore = 0;
    let bestVal;
    for (const val of iter) {
        const score = f(val);
        if (score === false)
            continue;
        if (score <= highestScore)
            continue;
        highestScore = score;
        bestVal = val;
    }
    return [highestScore, bestVal];
}
export function findLowestScore(iter, f) {
    let lowestScore = Infinity;
    for (const val of iter) {
        const score = f(val);
        if (score === false)
            continue;
        if (score >= lowestScore)
            continue;
        lowestScore = score;
    }
    return lowestScore;
}
export function findWithLowestScore(iter, f) {
    let lowestScore = Infinity;
    let bestVal;
    for (const val of iter) {
        const score = f(val);
        if (score === false)
            continue;
        if (score >= lowestScore)
            continue;
        lowestScore = score;
        bestVal = val;
    }
    return [lowestScore, bestVal];
}
/**
 * Sorts an array in place. This method mutates the array and returns a reference to the same array.
 * Like `array.sort((a, b) => score(a)-score(b))` but with cache
 */
export function sortBy(array, score, reversed) {
    const reverseSign = reversed ? -1 : 1;
    const cache = new Map(array.map(t => [t, score(t) * reverseSign]));
    return array.sort((a, b) => cache.get(a) - cache.get(b));
}
export function randomOf(array) {
    return array[Math.floor(Math.random() * array.length)];
}
export function visualizePath(path, color = customColors.yellow, visualize = Memory.roomVisuals) {
    if (!visualize)
        return;
    for (let i = 0; i < path.length; i++) {
        const nextPos = path[i + 1];
        if (!nextPos)
            break;
        const pos = path[i];
        if (nextPos.roomName !== pos.roomName)
            continue;
        new RoomVisual(pos.roomName).line(pos, nextPos, {
            color,
            opacity: 0.2,
        });
    }
}
