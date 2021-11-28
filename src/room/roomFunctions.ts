Room.prototype.get = function(roomObjectName: string) {

    const room: Room = this

    const roomObjects: {[key: string]: RoomObject} = {}

    interface RoomObjectOpts {
        [key: string]: any
        name: string,
        value: any,
        valueType: string,
        cacheMethod: string,
        cacheAmount?: number
    }

    interface RoomObject extends RoomObjectOpts {
        lastCache?: number
    }

    class RoomObject  {
        constructor(opts: RoomObjectOpts) {

            const roomObject: RoomObject = this

            // Apply opts

            for (const propertyName in opts) {

                roomObject[propertyName] = opts[propertyName]
            }

            // If cacheMethod is global

            if (roomObject.cacheMethod == 'global') {

                // Add lastCache property and stop

                roomObject.lastCache = Game.time
                return
            }
        }
        cache(): void {

            const roomObject: RoomObject = this

            if (roomObject.cacheMethod == 'memory') {

                // Store value in room's memory

                room.memory[roomObject.name] = roomObject.value
                return
            }

            if (roomObject.cacheMethod == 'global') {

                // Set the roomObjects last cache to this tick

                roomObject.lastCache = Game.time

                // Store roomObject in the room's global

                global[room.name][roomObject.name] = roomObject
                return
            }
        }
        getValue(): any {

            const roomObject: RoomObject = this

            // If roomObject's valueType is id, return it as an object with the ID

            if (roomObject.valueType == 'id') return global.findObjectWithId(roomObject.value)

            // If roomObject's type is pos, return the it as a RoomPosition

            if (roomObject.valueType == 'pos') return room.newPos(roomObject.value)

            // return the value of the roomObject

            return roomObject.value
        }
        getValueIfViable() {

            const roomObject: RoomObject = this

            let cachedRoomObject: RoomObject

            if (roomObject.cacheMethod == 'memory') {

                // Query room memory for cachedRoomObject

                cachedRoomObject = room.memory[roomObject.name]

                // If cachedRoomObject doesn't exist inform false

                if (!cachedRoomObject) return false

                // Inform cachedRoomObject's value

                return cachedRoomObject.getValue()
            }

            if (roomObject.cacheMethod == 'global') {

                // Query room's global for cachedRoomObject

                cachedRoomObject = room.memory[roomObject.name]

                // If cachedRoomObject doesn't exist inform false

                if (!cachedRoomObject) return false

                // If roomObject is past renewal date inform false

                if (cachedRoomObject.lastCache + cachedRoomObject.cacheAmount > Game.time) return false

                // Inform cachedRoomObject's value

                return cachedRoomObject.getValue()
            }

            return false
        }
    }

    function manageRoomObject(opts: RoomObjectOpts): RoomObject {

        // Find roomObject

        let roomObject: RoomObject = roomObjects[opts.name]

        // If the roomObject exists see if it's viable, otherwise inform undefined

        const roomObjectValue = roomObject ? roomObject.getValueIfViable() : undefined

        // If roomObject is viable

        if (roomObjectValue) {

            // Inform the roomObject

            return roomObject
        }

        // Create the new RoomObject

        roomObject = new RoomObject(opts)

        // Cache the roomObject based on its cacheMethod and inform the roomObject

        roomObject.cache()
        return roomObject
    }

    // Important Positions

    manageRoomObject({
        name: 'anchorPoint',
        value: room.memory.anchorPoint,
        valueType: 'pos',
        cacheMethod: 'memory',
    })

    // Resources

    manageRoomObject({
        name: 'mineral',
        value: room.find(FIND_MINERALS)[0],
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    function findIDsOfSources() {

        // Find sources

        const sources: Source[] = room.find(FIND_SOURCES)

        let sourceIDs: Id<Source>[] = []

        // Loop through each source

        for (const source of sources) {

            // Add source's id to sourceIDs

            sourceIDs.push(source.id)
        }

        return sourceIDs
    }

    manageRoomObject({
        name: 'sources',
        value: findIDsOfSources()[0],
        valueType: 'object',
        cacheMethod: 'memory',
    })

    manageRoomObject({
        name: 'source1',
        value: roomObjects.sources.getValue()[0],
        valueType: 'id',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    manageRoomObject({
        name: 'source2',
        value: roomObjects.sources.getValue()[1],
        valueType: 'id',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    // Dynamically create RoomObjects for each structureType

    // Loop through each structureType in the game

    for (const structureType of global.allStructureTypes) {

        // Create roomObject for structureType

        manageRoomObject({
            name: structureType,
            value: [],
            valueType: 'object',
            cacheMethod: 'global',
            cacheAmount: 1,
        })
    }

    // Dynamically add each structure to their RoomObject structureType

    // Loop through all structres in room

    for (const structure of room.find(FIND_STRUCTURES)) {

        // Group structure by structureType

        roomObjects[structure.structureType].value.push(structure)
    }

    // Harvest positions

    interface HarvestPosObj {
        type: string
        pos: RoomPosition
    }

    /**
     * Finds positions adjacent to a source that a creep can harvest
     * @param source source of which to find harvestPositions for
     * @returns source's harvestPositions, a list of RoomPositions
     */
    function findHarvestPositions(source: Source): HarvestPosObj[] {

        // Stop and inform empty array if there is no source

        if (!source) return []

        // Find positions adjacent to source

        const rect = { x1: source.pos.x - 1, y1: source.pos.y - 1, x2: source.pos.x + 1, y2: source.pos.y + 1 }
        const adjacentPositions: RoomPosition[] = global.getPositionsInsideRect(rect)

        const harvestPositions: HarvestPosObj[] = []

        // Find terrain in room

        const terrain = Game.map.getRoomTerrain(room.name)

        for (const pos of adjacentPositions) {

            // Iterate if terrain for pos is a wall

            if (terrain.get(pos.x, pos.y) == TERRAIN_MASK_WALL) continue

            // Convert position into a RoomPosition

            const harvestPosObj: HarvestPosObj = {
                type: 'normal',
                pos: room.newPos(pos),
            }

            // Add pos to harvestPositions

            harvestPositions.push(harvestPosObj)
        }

        return harvestPositions
    }

    /**
    * @param harvestPositions array of RoomPositions to filter
    * @returns the closest harvestPosition to the room's anchorPoint
    */
    function findClosestHarvestPosition(harvestPositions: RoomPosition[]): RoomPosition {

        // Filter harvestPositions by closest one to anchorPoint

        return roomObjects.anchorPoint.getValue().findClosestByRange(harvestPositions)
    }

    manageRoomObject({
        name: 'source1HarvestPositions',
        value: findHarvestPositions(roomObjects.source1.getValue()),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    manageRoomObject({
        name: 'source2HarvestPositions',
        value: findHarvestPositions(roomObjects.source2.getValue()),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    // Source links

    manageRoomObject({
        name: 'source1Link',
        value: findSourceLink(roomObjects.source1ClosestHarvestPosition.getValue()),
        valueType: 'pos',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    function findSourceLink(closestHarvestPos: RoomPosition) {

        // Stop and inform false if no closestHarvestPos

        if (!closestHarvestPos) return undefined

        // Find links

        const links: StructureLink[] = roomObjects.link.getValue()

        // Filter links that are near closestHarvestPos, inform the first one

        const linksNearHarvestPos = links.filter(link => link.pos.getRangeTo(closestHarvestPos) == 1)
        return linksNearHarvestPos[0]
    }

    //

    const roomObject = roomObjects[roomObjectName]

    // If the queries roomObject isn't in roomObjects

    if (!roomObject) {

        // Log an invalid query and inform undefined

        new CustomLog('Tried to get non-existent property', roomObjectName, global.colors.white, global.colors.red)
        return undefined
    }

    // Return the roomObject's queried value

    const value = roomObject.getValue()
    return value
}

Room.prototype.newPos = function(pos: RoomPosition) {

    const room: Room = this

    // Create an return roomPosition

    return new RoomPosition(pos.x, pos.y, room.name)
}

/**
    @param pos1 pos of the object performing the action
    @param pos2 pos of the object getting acted on
    @param [type] The status of action performed
*/
Room.prototype.actionVisual = function(pos1: RoomPosition, pos2: RoomPosition, type?: string) {

    const room = this

    // Construct colors for each type

    const colorsForTypes: {[key: string]: string} = {
        success: global.colors.lightBlue,
        fail: global.colors.red,
    }

    // If no type, type is success. Construct type from color

    if (!type) type = 'success'
    const color: string = colorsForTypes[type]

    // Create visuals

    room.visual.circle(pos2, { color: color })
    room.visual.line(pos1, pos2, { color: color })
}

interface PathGoal {
    pos: RoomPosition
    range: number
}

interface PathOpts {
    origin: RoomPosition
    goal: PathGoal
    avoidTypes: string[]
    plainCost: number
    swampCost: number
    maxRooms: number
    flee: boolean
    creep: Creep
    useRoads: boolean
    avoidEnemyRanges: boolean
    avoidImpassibleStructures: boolean
    prioritizeRamparts: boolean
}

interface RoomRoute {
    exit: ExitConstant
    room: string
}

interface PathObject {
    route: RoomRoute[] | -2 | undefined
    path: PathFinderPath
}

/**
 * @param opts options
 * @returns an array of RoomPositions
 */
Room.prototype.advancedFindPath = function(opts: PathOpts): PathObject {

    const room: Room = this

    // Construct pathObject

    const pathObject: PathObject = {
        route: generateRoute(),
        path: generatePath(),
    }

    // Construct route

    function generateRoute() {

        // If the goal is in the same room as the origin, inform that no route is needed

        if (opts.origin.roomName == opts.goal.pos.roomName) return undefined

        // Construct route by searching through rooms

        const route = Game.map.findRoute(opts.origin.roomName, opts.goal.pos.roomName, {

            // Essentially a costMatrix for the rooms, priority is for the lower values. Infinity is impassible

            routeCallback(roomName: string) {

                const roomMemory = Memory.rooms[roomName]

                // If room is in the goal, inform 1

                if (roomName == opts.goal.pos.roomName) return 1

                // If there is no memory for the room inform impassible

                if (!roomMemory) return Infinity

                // If the roomMemory's type isn't a type in avoidTypes inform 1

                if (!opts.avoidTypes.includes(roomMemory.type)) return 1

                // Inform to not use this room

                return Infinity
            }
        })

        // Inform route

        return route
    }

    // Construct path

    function generatePath() {

        const path: PathFinderPath = PathFinder.search(opts.origin, opts.goal, {
            plainCost: opts.plainCost,
            swampCost: opts.swampCost,
            maxRooms: opts.maxRooms,
            maxOps: 100000,
            flee: opts.flee,

            // Create costMatrixes for room tiles, where lower values are priority, and 255 or more is considered impassible

            roomCallback(roomName: string): boolean | CostMatrix {

                // If there isn't vision in this room inform to avoid this room

                const room = Game.rooms[roomName]
                if (!room) return false

                // Create a costMatrix

                const cm = new PathFinder.CostMatrix()

                // If useRoads is enabled

                if (opts.useRoads) {

                    // Get roads and loop through them

                    const roads: StructureRoad[] = room.get('road')
                    for (const road of roads) {

                        // Set road positions as prefered

                        cm.set(road.pos.x, road.pos.y, 1)
                    }
                }

                // If there is no route

                if (!pathObject.route) {

                    let y: number = 0
                    let x: number = 0

                    // Configure y and loop through top exits

                    y = 0
                    for (x = 0; x < 50; x++) {

                        cm.set(x, y, 255)
                    }

                    // Configure x and loop through left exits

                    x = 0
                    for (y = 0; y < 50; y++) {

                        cm.set(x, y, 255)
                    }

                    // Configure y and loop through bottom exits

                    y = 49
                    for (x = 0; x < 50; x++) {

                        cm.set(x, y, 255)
                    }

                    // Configure x and loop through right exits

                    x = 49
                    for (y = 0; y < 50; y++) {

                        cm.set(x, y, 255)
                    }
                }

                // If there is a request to avoid enemy ranges

                if (opts.avoidEnemyRanges) {

                    // Get enemies and loop through them

                    const enemyCreeps: Creep[] = room.get('enemyCreeps')
                    for (const enemyCreep of enemyCreeps) {

                        // Construct rect and get positions inside

                        const rect = {
                            x1: opts.creep.pos.x,
                            y1: opts.creep.pos.y,
                            x2: opts.creep.pos.x,
                            y2: opts.creep.pos.y
                        }
                        const positions: RoomPosition[] = global.getPositionsInsideRect(rect)

                        // Loop through positions

                        for (const pos of positions) {

                            // Set pos as impassible

                            cm.set(pos.x, pos.y, 255)
                        }
                    }
                }

                // If avoiding structures that can't be walked on is enabled

                if (opts.avoidImpassibleStructures) {

                    // Get and loop through ramparts

                    const ramparts: StructureRampart[] = room.get('rampart')
                    for (const rampart of ramparts) {

                        // If my rampart

                        if (rampart.my) {

                            // If prioritize ramparts is on

                            if (opts.prioritizeRamparts) {

                                // Set rampart pos as prefered

                                cm.set(rampart.pos.x, rampart.pos.y, 1)
                            }

                            // Iterate

                            continue
                        }

                        // Set pos as impassible

                        cm.set(rampart.pos.x, rampart.pos.y, 255)
                    }

                    // Loop through structureTypes of impassibleStructures

                    for (const structureType of global.impassibleStructures) {

                        // Get structures of type and loop through them

                        const structuresOfType = room.get(structureType)
                        for (const structure of structuresOfType) {

                            // Set pos as impassible

                            cm.set(structure.pos.x, structure.pos.y, 255)
                        }
                    }
                }

                // Define values for the costMatrix

                return cm
            }
        })

        return path
    }

    // Inform pathObject

    return pathObject
}

Room.prototype.scout = function() {

    const room: Room = this


}
