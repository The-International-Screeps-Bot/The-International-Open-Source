import { constants } from './constants'

/**
 * Finds the average trading price of a resourceType over a set amount of days
 */
export function getAvgPrice(resourceType: MarketResourceConstant, days = 2) {
     // Get the market history for the specified resourceType

     const history = Game.market.getHistory(resourceType)

     // Init the totalPrice

     let totalPrice = 0

     // Iterate through each index less than days

     for (let index = 0; index < days - 1; index++) {
          totalPrice += history[index].avgPrice
     }

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
export function findPositionsInsideRect(x1: number, y1: number, x2: number, y2: number) {
     const positions: Coord[] = []

     for (let x = x1; x <= x2; x++) {
          for (let y = y1; y <= y2; y++) {
               // Iterate if the pos doesn't map onto a room

               if (x < 0 || x >= constants.roomDimensions || y < 0 || y >= constants.roomDimensions) continue

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
     return pos1?.x == pos2?.x && pos1?.y == pos2?.y
}

/**
 * Outputs HTML and CSS styled console logs
 * @param title Title of the log
 * @param message Main content of the log
 * @param color Colour of the text. Default is black
 * @param bgColor Colour of the background. Default is white
 */
export function customLog(
     title: string,
     message: any,
     color: string = constants.colors.black,
     bgColor: string = constants.colors.white,
) {
     // Create the title

     global.logs += `<div style='width: 90vw; text-align: center; align-items: center; justify-content: left; display: flex; background: ${bgColor};'><div style='padding: 6px; font-size: 16px; font-weigth: 400; color: ${color};'>${title}:</div>`

     // Create the content

     global.logs += `<div style='box-shadow: inset rgb(0, 0, 0, 0.1) 0 0 0 10000px; padding: 6px; font-size: 14px; font-weight: 200; color: ${color};'>${message}</div></div>`
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
export function advancedFindDistance(
     originRoomName: string,
     goalRoomName: string,
     typeWeights?: { [key: string]: number },
) {
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
          },
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
     return (distance * 2 * income) / CARRY_CAPACITY
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
     // Find the range using Chebyshev's formula

     return Math.max(Math.abs(x1 - x2), Math.abs(y1 - y2))
}

/**
 * Gets the range between two position's differences
 * @param xDif the difference between the two location's x's
 * @param yDif the difference between the two location's y's
 * @returns The range between the two position's differences
 */
export function getRange(xDif: number, yDif: number) {
     // Find the range using Chebyshev's formula

     return Math.max(Math.abs(xDif), Math.abs(yDif))
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

export function unpackAsPos(packedPos: number) {
     // Inform an unpacked pos

     return {
          x: Math.floor(packedPos / constants.roomDimensions),
          y: Math.floor(packedPos % constants.roomDimensions),
     }
}

export function unpackAsRoomPos(packedPos: number, roomName: string) {
     // Inform an unpacked RoomPosition

     return new RoomPosition(
          Math.floor(packedPos / constants.roomDimensions),
          Math.floor(packedPos % constants.roomDimensions),
          roomName,
     )
}

export function pack(pos: Pos) {
     // Inform a packed pos

     return pos.x * constants.roomDimensions + pos.y
}

export function findCreepInQueueMatchingRequest(queue: string[], requestPackedPos: number) {
     // Loop through each creepName of the queue

     for (const creepName of queue) {
          // Get the creep using the creepName

          const queuedCreep = Game.creeps[creepName]

          // If the queuedCreep's pos is equal to the moveRequest, inform the creep

          if (pack(queuedCreep.pos) == requestPackedPos) return queuedCreep
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

     while (Game.market.calcTransactionCost(amount, roomName1, roomName2) > budget) {
          // Decrease amount exponentially

          amount *= 0.8
     }

     return amount
}

/**
 * Finds the name of the closest commune, exluding the specified roomName
 */
export function findClosestCommuneName(roomName: string) {
     const communesNotThis = Memory.communes.filter(communeName => roomName != communeName)

     return communesNotThis.sort(
          (a, b) => Game.map.getRoomLinearDistance(roomName, a) - Game.map.getRoomLinearDistance(roomName, b),
     )[0]
}

export function findClosestClaimType(roomName: string) {
     const claimTypes = Memory.communes
          .concat(Object.keys(Memory.claimRequests))
          .filter(claimRoomName => roomName != claimRoomName)

     return claimTypes.sort(
          (a, b) => Game.map.getRoomLinearDistance(roomName, a) - Game.map.getRoomLinearDistance(roomName, b),
     )[0]
}

export function findStrengthOfParts(body: BodyPartConstant[]) {
     let strength = 0

     for (const part of body) {
          switch (part) {
               case RANGED_ATTACK:
                    strength += RANGED_ATTACK_POWER
                    break
               case ATTACK:
                    strength += ATTACK_POWER
                    break
               case HEAL:
                    strength += HEAL_POWER
                    break
               default:
                    strength++
          }
     }

     return strength
}
