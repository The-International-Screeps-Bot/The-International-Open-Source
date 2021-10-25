Room.prototype.get = function(roomObjectName: string) {

    const room = this

    // Check if value is cached. If so then return it

    let cachedValue: any

    cachedValue = findRoomObjectInGlobal(roomObjectName)
    if (cachedValue) return cachedValue

    cachedValue = findRoomObjectInMemory(roomObjectName)
    if (cachedValue) return cachedValue

    /**
     *
     * @param roomObjectName name of roomObject
     * @returns roomObject
     */
    function findRoomObjectInGlobal(roomObjectName: string) {

        // Stop if there is no stored object

        if (!global[room.name][roomObjectName]) return

        //

        const cacheAmount = global[room.name][roomObjectName].cacheAmount
        const lastCache = global[room.name][roomObjectName].lastCache

        // Stop if time is greater than lastCache + cacheAmount

        if (lastCache + cacheAmount < Game.time) return

        // See if roomObject's type is an id

        if (global[room.name][roomObjectName].type == 'id') {

            return global.findObjectWithId(global[room.name][roomObjectName].value)
        }

        // Return the value of the roomObject

        return global[room.name][roomObjectName].value
    }

    /**
     *
     * @param roomObjectName name of roomObject
     * @returns roomObject
     */
    function findRoomObjectInMemory(roomObjectName: string) {

        // Stop if there is no stored object

        if (!room.memory[roomObjectName]) return

        // See if roomObject's type is an id

        if (room.memory[roomObjectName].type == 'id') {

            return global.findObjectWithId(room.memory[roomObjectName].value)
        }

        // Return the value of the roomObject

        return room.memory[roomObjectName].value
    }

    interface RoomObject {
        value: object
        cacheAmount: number
        lastCache: number
        type: string
    }

    /**
     * @param value roomObject
     * @param cacheAmount if in global, how long to store roomObject for
     * @param storeMethod where to store the roomObject
     * @param type id or object
     */
    class RoomObject {
        constructor(value: any, cacheAmount: number, storeMethod: string, type: string) {

            this.value = value
            this.type = type

            if (storeMethod == 'global') {

                this.cacheAmount = cacheAmount
                this.lastCache = Game.time

                return
            }
        }
    }

    //

    let roomObjects: {[key: string]: any} = {}

    // Resources

    roomObjects.mineral = findRoomObjectInGlobal('mineral') || new RoomObject(room.find(FIND_MINERALS)[0], Infinity, 'global', 'object')
    roomObjects.sources = findRoomObjectInGlobal('sources') || new RoomObject(room.find(FIND_SOURCES), Infinity, 'global', 'object')
    roomObjects.source1 = findRoomObjectInMemory('source1') || new RoomObject(roomObjects.sources.value[0], Infinity, 'memory', 'id')
    if (roomObjects.sources[1]) roomObjects.source2 = findRoomObjectInMemory('source2') || new RoomObject(roomObjects.sources.value[1], Infinity, 'memory', 'id')

    // Loop through all structres in room

    for (let structure of room.find(FIND_STRUCTURES)) {

        // Create catagory if it doesn't exist

        if (!roomObjects[structure.structureType]) roomObjects[structure.structureType] = []

        // Group structure by structureType

        roomObjects[structure.structureType].push(structure)
    }

    // Harvest positions

    roomObjects.source1HarvestPositions = findRoomObjectInGlobal('source1HarvestPositions') || new RoomObject(findHarvestPositions(roomObjects.source1.value), Infinity, 'global', 'object')
    roomObjects.source1ClosestHarvestPosition = findRoomObjectInGlobal('source1ClosestHarvestPosition') || new RoomObject(roomObjects.source1HarvestPositions.value.filter(pos => pos.type == 'closest')[0], Infinity, 'memory', 'object')

    if (roomObjects.sources[1]) roomObjects.source2HarvestPositions = findRoomObjectInGlobal('source2HarvestPositions') || new RoomObject(findHarvestPositions(roomObjects.source2.value), Infinity, 'global', 'object')
    if (roomObjects.sources[1]) roomObjects.source2ClosestHarvestPosition = findRoomObjectInGlobal('source2ClosestHarvestPosition') || new RoomObject(roomObjects.source2HarvestPositions.value.filter(pos => pos.type == 'closest')[0], Infinity, 'memory', 'object')

    /**
     * Finds positions adjacent to a source that a creep can harvest
     * @param source source object
     * @returns sources harvest positions
     */
    function findHarvestPositions(source: {[key: string]: any}) {

        let cm = new PathFinder.CostMatrix()

        const terrain = Game.map.getRoomTerrain(room.name)

        // Loop through room positions

        for (let x = 0; x < global.roomSize; x++) {
            for (let y = 0; y < global.roomSize; y++) {

                // Iterate if terrain for pos isn't wall

                if (terrain.get(x, y) != TERRAIN_MASK_WALL) continue

                // Set pos in costMatrix to 255

                cm.set(x, y, 255)
            }
        }

        // Find positions adjacent to source

        const rect = { x1: source.pos.x - 1, y1: source.pos.y - 1, x2: source.pos.x + 1, y2: source.pos.y + 1 }
        const adjacentPositions = global.getPositionsInsideRect(rect)

        console.log(JSON.stringify(adjacentPositions))

        let harvestPositions = []

        for (let pos of adjacentPositions) {

            // Iterate if value for pos in costMatrix is 255

            if (cm.get(pos.x, pos.y) == 255) continue

            // Add pos to harvestPositions

            harvestPositions.push(pos)
        }

        return harvestPositions
    }
}
