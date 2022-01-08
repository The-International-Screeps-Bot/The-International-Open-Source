import { retry } from 'async'
import { constants } from 'international/constants'
import { filter } from 'lodash'
import { RoomTask } from './roomTasks'


Room.prototype.get = function(roomObjectName) {

    const room = this

    const roomObjects: Partial<Record<RoomObjectName, RoomObject>> = {}

    interface RoomObjectOpts {
        [key: string | number]: any
        name: RoomObjectName,
        value: any,
        valueType: 'pos' | 'id' | 'object',
        cacheMethod: 'global' | 'memory',
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

            // Add roomObject to roomObjects

            roomObjects[roomObject.name] = roomObject

            // If cacheMethod is memory

            if (roomObject.cacheMethod == 'memory') {

                // Store value in room's memory

                room.memory[roomObject.name] = roomObject.value
                return
            }

            // If cacheMethod is global

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

                cachedRoomObject = global[room.name][roomObject.name]

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

    function manageRoomObject(opts: RoomObjectOpts): void {

        // Find roomObject

        let roomObject: RoomObject = roomObjects[opts.name]

        // If the roomObject exists see if it's viable, otherwise inform undefined

        const roomObjectValue = roomObject ? roomObject.getValueIfViable() : undefined

        // If roomObject is viable

        if (roomObjectValue) {

            // Inform the roomObject

            return
        }

        // Create the new RoomObject

        roomObject = new RoomObject(opts)

        // Cache the roomObject based on its cacheMethod and inform the roomObject

        roomObject.cache()
        return
    }

    // Important Positions

    manageRoomObject({
        name: 'anchorPoint',
        value: room.newPos({ x: 25, y: 25 }) /* room.memory.anchorPoint */,
        valueType: 'pos',
        cacheMethod: 'memory',
    })

    // Resources

    manageRoomObject({
        name: 'mineral',
        value: room.find(FIND_MINERALS)[0].id,
        valueType: 'id',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    function findSourceIdIfExists(source: Source): false | string {

        if (!source) return false

        return source.id
    }

    manageRoomObject({
        name: 'source1',
        value: findSourceIdIfExists(room.find(FIND_SOURCES)[0]),
        valueType: 'id',
        cacheMethod: 'memory',
    })

    manageRoomObject({
        name: 'source2',
        value: findSourceIdIfExists(room.find(FIND_SOURCES)[1]),
        valueType: 'id',
        cacheMethod: 'memory',
    })

    manageRoomObject({
        name: 'sources',
        value: [roomObjects.source1.getValue(), roomObjects.source2.getValue()],
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    // Dynamically create RoomObjects for each structureType

    // Loop through each structureType in the game

    for (const structureType of constants.allStructureTypes) {

        // Create roomObject for structures with the structureType

        manageRoomObject({
            name: structureType,
            value: [],
            valueType: 'object',
            cacheMethod: 'global',
            cacheAmount: 1,
        })

        // Create a roomObject for sites with the structureType

        manageRoomObject({
            name: `${structureType}CSite`,
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

    // Dynamically add each cSite to their RoomObject structureType

    // Loop through all cSites in room

    for (const cSite of room.find(FIND_MY_CONSTRUCTION_SITES)) {

        // Group cSites by structureType

        roomObjects[cSite.structureType].value.push(cSite)
    }

    // Construction sites based on owner

    function findEnemySites() {

        // Inform constuction sites that aren't owned by a member of the allyList

        return room.find(FIND_HOSTILE_CONSTRUCTION_SITES, {
            filter: cSite => !constants.allyList.includes(cSite.owner.username)
        })
    }

    manageRoomObject({
        name: 'enemyCSites',
        value: findEnemySites(),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: 1,
    })

    function findAllySites() {

        // Inform constuction sites that aren't owned by a member of the allyList

        return room.find(FIND_HOSTILE_CONSTRUCTION_SITES, {
            filter: cSite => constants.allyList.includes(cSite.owner.username)
        })
    }

    manageRoomObject({
        name: 'allyCSites',
        value: findAllySites(),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: 1,
    })

    // Harvest positions

    /**
     * Finds positions adjacent to a source that a creep can harvest
     * @param source source of which to find harvestPositions for
     * @returns source's harvestPositions, a list of positions
     */
    function findHarvestPositions(source: Source): Pos[] {

        // Stop and inform empty array if there is no source

        if (!source) return []

        // Find positions adjacent to source

        const rect: Rect = { x1: source.pos.x - 1, y1: source.pos.y - 1, x2: source.pos.x + 1, y2: source.pos.y + 1 }
        const adjacentPositions: Pos[] = global.findPositionsInsideRect(rect)

        const harvestPositions: Pos[] = []

        // Find terrain in room

        const terrain = Game.map.getRoomTerrain(room.name)

        for (const pos of adjacentPositions) {

            // Iterate if terrain for pos is a wall

            if (terrain.get(pos.x, pos.y) == TERRAIN_MASK_WALL) continue

            // Add pos to harvestPositions

            harvestPositions.push(room.newPos(pos))
        }

        return harvestPositions
    }

    /**
    * @param harvestPositions array of RoomPositions to filter
    * @returns the closest harvestPosition to the room's anchorPoint
    */
    function findClosestHarvestPosition(harvestPositions: RoomPosition[]): RoomPosition {

        // Filter harvestPositions by closest one to anchorPoint

        return room.find(FIND_MY_SPAWNS)[0].pos.findClosestByRange(harvestPositions)
    }

    manageRoomObject({
        name: 'source1HarvestPositions',
        value: findHarvestPositions(roomObjects.source1.getValue()),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    manageRoomObject({
        name: 'source1ClosestHarvestPosition',
        value: findClosestHarvestPosition(roomObjects.source1HarvestPositions.getValue()),
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

    manageRoomObject({
        name: 'source2ClosestHarvestPosition',
        value: findClosestHarvestPosition(roomObjects.source2HarvestPositions.getValue()),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    // Source containers

    function findSourceContainer(closestHarvestPos: RoomPosition): string | false {

        // Stop and inform false if no closestHarvestPos

        if (!closestHarvestPos) return false

        // Find containers

        const containers: StructureContainer[] = roomObjects.container.getValue()

        // Iterate through containers

        for (const container of containers) {

            // If the container is on the closestHarvestPos, inform its id

            if (container.pos.getRangeTo(closestHarvestPos) == 0) return container.id
        }

        return false
    }

    manageRoomObject({
        name: 'source1Container',
        value: findSourceContainer(roomObjects.source1ClosestHarvestPosition.getValue()),
        valueType: 'id',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    manageRoomObject({
        name: 'source2Container',
        value: findSourceContainer(roomObjects.source2ClosestHarvestPosition.getValue()),
        valueType: 'id',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    // controllerContainer

    function findControllerContainer(): string | false {

        // Stop and inform false if no closestHarvestPos

        if (!room.controller) return false

        // Find containers

        const containers: StructureContainer[] = roomObjects.container.getValue()

        // Iterate through containers

        for (const container of containers) {

            // If the container is near the harvestPos inform its id

            if (container.pos.getRangeTo(room.controller.pos) <= 2) return container.id
        }

        return false
    }

    manageRoomObject({
        name: 'controllerContainer',
        value: findControllerContainer(),
        valueType: 'id',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    // Source links

    function findSourceLink(closestHarvestPos: RoomPosition): string | false {

        // Stop and inform false if no closestHarvestPos

        if (!closestHarvestPos) return false

        // Find links

        const links: StructureLink[] = roomObjects.link.getValue()

        // Iterate through links

        for (const link of links) {

            // If the link is near the harvestPos inform its id

            if (link.pos.getRangeTo(closestHarvestPos) == 1) return link.id
        }

        return false
    }

    manageRoomObject({
        name: 'source1Link',
        value: findSourceLink(roomObjects.source1ClosestHarvestPosition.getValue()),
        valueType: 'id',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    manageRoomObject({
        name: 'source2Link',
        value: findSourceLink(roomObjects.source2ClosestHarvestPosition.getValue()),
        valueType: 'id',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    //

    function findStructuresForSpawning() {

        // Get array of spawns and extensions

        const spawnsAndExtensions: Structure<STRUCTURE_SPAWN | STRUCTURE_EXTENSION>[] = roomObjects.spawn.getValue().concat(roomObjects.extension.getValue())

        // Filter out structures that aren't active

        const unfilteredSpawnStructures = spawnsAndExtensions.filter((structure) => structure.isActive())

        // Add each spawnStructures with their range to the object

        const anchorPoint = roomObjects.anchorPoint.getValue()

        // Filter energy structures by distance from anchorPoint

        const filteredSpawnStructures = unfilteredSpawnStructures.sort((a, b) => a.pos.getRangeTo(anchorPoint.x, anchorPoint.y + 5) - b.pos.getRangeTo(anchorPoint.x, anchorPoint.y + 5))
        return filteredSpawnStructures
    }

    manageRoomObject({
        name: 'structuresForSpawning',
        value: findStructuresForSpawning(),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: 1,
    })

    // Creeps

    manageRoomObject({
        name: 'notMyCreeps',
        value: room.find(FIND_HOSTILE_CREEPS),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: 1,
    })

    manageRoomObject({
        name: 'enemyCreeps',
        value: room.find(FIND_HOSTILE_CREEPS, {
            filter: creep => !constants.allyList.includes(creep.owner.username)
        }),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: 1,
    })

    manageRoomObject({
        name: 'allyCreeps',
        value: room.find(FIND_HOSTILE_CREEPS, {
            filter: creep => !constants.allyList.includes(creep.owner.username)
        }),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: 1,
    })

    // Terrain

    manageRoomObject({
        name: 'terrain',
        value: room.getTerrain(),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    // Cost matrixes

    function generateTerrainCM() {

        const terrain = roomObjects.terrain.getValue()

        // Create a CostMatrix for terrain types

        const terrainCM = new PathFinder.CostMatrix()

        // Iterate through

        for (let x = 0; x < constants.roomDimensions; x++) {
            for (let y = 0; y < constants.roomDimensions; y++) {

                // Try to find the terrainValue

                const terrainValue = terrain.get(x, y)

                // If terrain is a wall

                if (terrainValue == TERRAIN_MASK_WALL) {

                    // Set this positions as 1 in the terrainCM

                    terrainCM.set(x, y, 1)
                    continue
                }

                // Otherwise set this positions as 0 in the terrainCM

                terrainCM.set(x, y, 0)
                continue
            }
        }

        return terrainCM
    }

    manageRoomObject({
        name: 'terrainCM',
        value: generateTerrainCM(),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: 1,
    })

    //

    const roomObject = roomObjects[roomObjectName]

    // If the queries roomObject isn't in roomObjects

    if (!roomObject) {

        // Log an invalid query and inform undefined

        global.customLog('Tried to get non-existent property', roomObjectName, constants.colors.white, constants.colors.red)
        return undefined
    }

    // Return the roomObject's queried value

    const value = roomObject.getValue()
    return value
}

Room.prototype.newPos = function(pos: Pos) {

    const room = this

    // Create an return roomPosition

    return new RoomPosition(pos.x, pos.y, room.name)
}

/**
    @param pos1 pos of the object performing the action
    @param pos2 pos of the object getting acted on
    @param [type] The status of action performed
*/
Room.prototype.actionVisual = function(pos1, pos2, type?) {

    const room = this

    // Stop if roomVisuals are disabled

    if (!Memory.roomVisuals) return

    // Construct colors for each type

    const colorsForTypes: {[key: string]: string} = {
        success: constants.colors.lightBlue,
        fail: constants.colors.red,
    }

    // If no type, type is success. Construct type from color

    if (!type) type = 'success'
    const color: string = colorsForTypes[type]

    // Create visuals

    room.visual.circle(pos2.x, pos2.y, { stroke: color })
    room.visual.line(pos1, pos2, { color: color })
}

interface RoutePart {
    exit: ExitConstant
    room: string
}

type Route = RoutePart[]

/**
 * @param opts options
 * @returns An array of RoomPositions
 */
Room.prototype.advancedFindPath = function(opts: PathOpts): RoomPosition[] {

    const room: Room = this

    // Construct route

    function generateRoute(): Route | undefined  {

        // If the goal is in the same room as the origin, inform that no route is needed

        if (opts.origin.roomName == opts.goal.pos.roomName) return undefined

        // Construct route by searching through rooms

        const route: Route | -2 = Game.map.findRoute(opts.origin.roomName, opts.goal.pos.roomName, {

            // Essentially a costMatrix for the rooms, priority is for the lower values. Infinity is impassible

            routeCallback(roomName: string) {

                const roomMemory = Memory.rooms[roomName]

                // If the goal is in the room, inform 1

                if (roomName == opts.goal.pos.roomName) return 1

                // If there is no memory for the room inform impassible

                if (!roomMemory) return Infinity

                // If the type is in typeWeights, inform the weight for the type

                if (opts.typeWeights[roomMemory.type]) return opts.typeWeights[roomMemory.type]

                // Inform to consider this room

                return 2
            }
        })

        // If route doesn't work inform undefined

        if (route == ERR_NO_PATH) return undefined

        // If the route is less than 2 inform undefined

        if (route.length < 2) return undefined

        // Otherwise inform the route

        return route
    }

    // Construct path

    function generatePath(): RoomPosition[] {

        const route = generateRoute()
        if (route) opts.goal = {
            pos: room.newPos({ x: 25, y: 25 }),
            range: 25
        }

        const pathFinderResult: PathFinderPath = PathFinder.search(opts.origin, opts.goal, {
            plainCost: opts.plainCost,
            swampCost: opts.swampCost,
            maxRooms: opts.maxRooms,
            maxOps: 100000,
            flee: opts.flee,

            // Create costMatrixes for room tiles, where lower values are priority, and 255 or more is considered impassible

            roomCallback(roomName) {

                // If there isn't vision in this room inform to avoid this room

                const room = Game.rooms[roomName]
                if (!room) return false

                // Create a costMatrix

                const cm = new PathFinder.CostMatrix()

                // Loop trough each construction site belonging to an ally

                for (const cSite of room.get('allyCSites')) {

                    // Set the site as impassible

                    cm.set(cSite.x, cSite.y, 255)
                }

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

                if (!route) {

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

                avoidEnemyRanges()

                function avoidEnemyRanges() {

                    // Stop if avoidEnemyRanges isn't specified

                    if (!opts.avoidEnemyRanges) return

                    // Stop if the controller is mine and it's in safemode

                    if (room.controller.my && room.controller.safeMode) return

                    // Get enemies and loop through them

                    const enemyCreeps: Creep[] = room.get('enemyCreeps')
                    for (const enemyCreep of enemyCreeps) {

                        // Construct rect and get positions inside

                        const rect = {
                            x1: opts.creep.pos.x - 2,
                            y1: opts.creep.pos.y - 2,
                            x2: opts.creep.pos.x + 2,
                            y2: opts.creep.pos.y + 2
                        }
                        const positions: Pos[] = global.findPositionsInsideRect(rect)

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

                        // If the rampart is mine or public

                        if (rampart.my || rampart.isPublic) {

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

                    for (const structureType of constants.impassibleStructures) {

                        // Get structures of type and loop through them

                        const structuresOfType = room.get(structureType)
                        for (const structure of structuresOfType) {

                            // Set pos as impassible

                            cm.set(structure.pos.x, structure.pos.y, 255)
                        }
                    }
                }

                // Inform the CostMatrix

                return cm
            }
        })

        // Inform the path from pathFinderResult

        return pathFinderResult.path
    }

    // Call path generation and inform the result

    return generatePath()
}

Room.prototype.findType = function(scoutingRoom: Room) {

    const room: Room = this
    const controller: StructureController = room.get('controller')

    // Record that the room was scouted this tick

    room.memory.lastScout = Game.time

    // If there is a controller

    if (controller) {

        // If the contoller is owned

        if (controller.owner) {

            // Stop if the controller is owned by me

            if (controller.my) return

            // If the controller is owned by an ally

            if (constants.allyList.includes(controller.owner.username)) {

                // Set the type to ally and stop

                room.memory.type = 'ally'
                room.memory.owner = controller.owner.username
                return
            }

            // If the controller is not owned by an ally

            // Set the type to enemy and stop

            room.memory.type = 'enemy'
            room.memory.owner = controller.owner
            room.memory.level = controller.level
            room.memory.powerEnabled = controller.isPowerEnabled
            room.memory.terminal = room.terminal != undefined
            room.memory.storedEnergy = room.findStoredResourceAmount(RESOURCE_ENERGY)
            return
        }

        // Get sources

        const sources: Source[] = room.get('sources')

        // Filter sources that have been harvested

        const harvestedSources = sources.filter(source => source.ticksToRegeneration > 0)

        if (isReservedRemote()) return

        function isReservedRemote(): boolean {

            // If there is no reservation inform false

            if (!controller.reservation) return false

            // Get roads

            const roads = room.get('road')

            // Get containers

            const containers = room.get('container')

            // If there are roads or containers or sources harvested inform false

            if (roads.length == 0 && containers.length == 0 && !harvestedSources) return false

            // If the controller is reserved by an ally

            if (constants.allyList.includes(controller.reservation.username)) {

                // Set type to allyRemote and stop

                room.memory.type = 'allyRemote'
                room.memory.owner = controller.reservation.username
                return true
            }

            // If the controller is not reserved by an ally

            // Set type to enemyRemote and stop

            room.memory.type = 'enemyRemote'
            room.memory.owner = controller.reservation.username
            return true
        }

        if (isUnReservedRemote()) return

        function isUnReservedRemote() {

            // If there are no sources harvested

            if (harvestedSources.length == 0) return false

            // Find creeps that I don't own

            const creepsNotMine: Creep[] = room.get('enemyCreeps').concat(room.get('allyCreeps'))

            // Iterate through them

            for (const creep of creepsNotMine) {

                // inform creep if it has work parts

                if (creep.hasPartsOfTypes(['work'])) {

                    // If the creep is owned by an ally

                    if (constants.allyList.includes(creep.reservation.username)) {

                        // Set type to allyRemote and stop

                        room.memory.type = 'allyRemote'
                        room.memory.owner = creep.owner.username
                        return true
                    }

                    // If the creep is not owned by an ally

                    // Set type to enemyRemote and stop

                    room.memory.type = 'enemyRemote'
                    room.memory.owner = creep.owner.username
                    return true
                }
            }

            return false
        }

        // Find distance from scoutingRoom

        const distanceFromScoutingRoom = global.advancedFindDistance(scoutingRoom.name, room.name,
            {
                keeper: Infinity,
                enemy: Infinity,
                enemyRemote: Infinity,
                ally: Infinity,
                allyRemote: Infinity,
                highway: Infinity,
            })

        // If distance from scoutingRoom is less than 3

        if (distanceFromScoutingRoom < 3) {

            // Set roomType as remote and assign commune as scoutingRoom's name

            room.memory.type = 'remote'
            room.memory.commune = scoutingRoom.name
            return
        }

        // Set type to neutral and stop

        room.memory.type = 'neutral'
        return
    }

    // If there is no controller

    // Get keeperLair

    const keeperLairs = room.get('keeperLair')

    // If there are keeperLairs

    if (keeperLairs.length > 0) {

        // Set type to keeper and stop

        room.memory.type = 'keeper'
        return
    }

    // Get sources

    const sources = room.get('sources')

    // If there are sources

    if (sources.length > 0) {

        // Set type to keeperCenter and stop

        room.memory.type = 'keeperCenter'
        return
    }

    // Set type to highway and stop

    room.memory.type == 'highway'
    return
}

Room.prototype.cleanRoomMemory = function() {

    const room = this

    // Stop if the room doesn't have a type

    if (!room.memory.type) return

    // Loop through keys in the room's memory

    for (const key in room.memory) {

        // Iterate if key is not part of roomTypeProperties

        if (!constants.roomTypeProperties[key]) continue

        // Iterate if key part of this roomType's properties

        if (constants.roomTypes[room.memory.type][key]) continue

        // Delete the property

        delete room.memory[key]
    }
}

Room.prototype.findStoredResourceAmount = function(resourceType) {

    const room = this

    // If the rooms stored resources of this resourceType exist, inform it

    if (room.storedResources[resourceType]) return room.storedResources[resourceType]

    // Otherwise construct the variable

    room.storedResources[resourceType] = 0

    // Create array of room and terminal

    const storageStructures = [room.storage, room.terminal]

    // Iterate through storageStructures

    for (const storageStructure of storageStructures) {

        // Iterate if storageStructure isn't defined

        if (!storageStructure) continue

        // Add the amount of resources in the storageStructure to the rooms storedResources of resourceType

        room.storedResources[resourceType] += storageStructure.store.getUsedCapacity(resourceType)
    }

    // Inform room's storedResources of resourceType

    return room.storedResources[resourceType]
}

Room.prototype.deleteTask = function(taskID, hasResponder) {

    const room = this

    type TaskLocation = {[key: number]: RoomTask}

    function getTaskLocation(): TaskLocation {

        // If the task has a responder inform tasksWithResponders

        if (hasResponder) return global[room.name].tasksWithResponders

        // Otherwise inform tasksWithoutResponders

        return global[room.name].tasksWithoutResponders[taskID]
    }

    // Construct task info based on found location

    const taskLocation = getTaskLocation()
    const task = taskLocation[taskID]

    // If the task has a creator and it still exists

    if (task.creatorID && global[task.creatorID]) {

        // Remove the taskID from the creator

        delete global[task.creatorID].createdTasks[task.ID]
    }

    // If the task has a responder

    if (task.responderID) {

        // Remove the taskID from the responder

        delete global[task.responderID].taskID
    }

    // Delete the task

    delete taskLocation[taskID]
}

Room.prototype.hasTaskOfTypes = function(createdTasks, types) {

    const room = this

    // Iterate through IDs of createdTasks

    for (const taskID in createdTasks) {

        // Get info on if the task has a responder

        const hasResponder = createdTasks[taskID]

        function getTask() {

            // If the task has a responder inform from tasksWithResponders

            if (hasResponder) return global[room.name].tasksWithResponders[taskID]

            // Otherwise inform from tasksWithoutResponders

            return global[room.name].tasksWithoutResponders[taskID]
        }

        const task: RoomTask = getTask()

        // If the task has a type of specified types inform true

        if (types.includes(task.type)) return true
    }

    // Inform false if no tasks had the specified types

    return false
}

Room.prototype.findScore = function() {

    const room = this


}

Room.prototype.distanceTransform = function() {

    const room = this

    // Get the terrain for this room

    const terrain = room.get('terrain')

    // Create a costMatrix to record distances

    const distanceCM = new PathFinder.CostMatrix()

    function setIfWall(x: number, y: number): boolean {

        // Try to find the terrainValue

        const terrainValue = terrain.get(x, y)

        // inform false if terrain is not a wall

        if (terrainValue != TERRAIN_MASK_WALL) return false

        // Otherwise set this position as 255 and inform true

        distanceCM.set(x, y, 255)
        return true
    }

    for (let x = 0; x < constants.roomDimensions; x++) {
        for (let y = 0; y < constants.roomDimensions; y++) {

            // Iterate if pos is a wall

            if(setIfWall(x, y)) continue

            // Otherwise construct a rect and get the positions in a range of 1

            const rect = { x1: x - 1, y1: y - 1, x2: x + 1, y2: y + 1 }
            const positions = global.findPositionsInsideRect(rect)

            // Construct the smallest pos value as the wall value

            let smallestNearbyPosValue = 255

            // Iterate through positions

            for (const pos of positions) {

                // Get the value of the pos in distanceCM

                let value = distanceCM.get(pos.x, pos.y)

                // If the pos is a wall set the value to the value of a wall

                if(setIfWall(pos.x, pos.y)) value = 255

                // If the value is that of a wall

                if (value == 255) {

                    // set the nearby pos value to 0 and stop the loop

                    smallestNearbyPosValue = 0
                    break
                }

                // Otherwise check if the value is smaller than the smallestNearbyPosValue, and set it to 0 if so

                if (value < smallestNearbyPosValue) smallestNearbyPosValue = value
            }

            // Construct the distance value as the wall value

            let distanceValue = 255

            // If the smallest pos value isn't 255, set distanceValue as the smallest pos value + 1

            if (smallestNearbyPosValue != 255) distanceValue = smallestNearbyPosValue + 1

            // Record the distanceValue in the distance cost matrix

            distanceCM.set(x, y, distanceValue)
        }
    }

    for (let x = constants.roomDimensions -1; x > -1; x--) {
        for (let y = constants.roomDimensions -1; y > -1; y--) {

            // Try to find the terrainValue

            const terrainValue = terrain.get(x, y)

            // Iterate if terrain is a wall

            if (terrainValue == TERRAIN_MASK_WALL) continue

            // Construct a rect and get the positions in a range of 1

            const rect = { x1: x - 1, y1: y - 1, x2: x + 1, y2: y + 1 }
            const positions = global.findPositionsInsideRect(rect)

            // Construct the smallest pos value as the wall value

            let smallestNearbyPosValue = 255

            // Iterate through positions

            for (const pos of positions) {

                // Get the value of the pos in distanceCM

                const value = distanceCM.get(pos.x, pos.y)

                // If the value is that of a wall

                if (value == 255) {

                    // set the nearby pos value to 0 and stop the loop

                    smallestNearbyPosValue = 0
                    break
                }

                // Otherwise check if the value is smaller than the smallestNearbyPosValue, and set it to 0 if so

                if (value < smallestNearbyPosValue) smallestNearbyPosValue = value
            }

            // Construct the distance value as the wall value

            let distanceValue = 255

            // If the smallest pos value isn't 255, set distanceValue as the smallest pos value + 1

            if (smallestNearbyPosValue != 255) distanceValue = smallestNearbyPosValue + 1

            // Record the distanceValue in the distance cost matrix

            distanceCM.set(x, y, distanceValue)

            // If roomVisuals are enabled, show the terrain's distanceValue

            if (Memory.roomVisuals) room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                fill: 'hsl(' + 200 + distanceValue * 10 + ', 100%, 60%)',
                opacity: 0.4,
            })
        }
    }

    return distanceCM
}

Room.prototype.floodFill = function(seeds) {

    const room = this

    // Get the terrain of this room

    const terrain = room.get('terrain')

    // Construct a cost matrix for the flood

    const floodCM = new PathFinder.CostMatrix()

    // Construct a cost matrix for visited tiles and add seeds to it

    const visitedCM = new PathFinder.CostMatrix()
    for (const seedPos of seeds) visitedCM.set(seedPos.x, seedPos.y, 1)

    // Construct values for the flood

    let depth = 0

    let thisGeneration: Pos[] = seeds
    let nextGeneration: Pos[] = []

    // So long as there are positions in this gen

    while (thisGeneration.length) {

        // Reset next gen

        nextGeneration = []

        // Iterate through positions of this gen

        for (const pos of thisGeneration) {

            // If the depth isn't 0

            if (depth != 0) {

                // Iterate if the terrain is a wall

                if (terrain.get(pos.x, pos.y) == TERRAIN_MASK_WALL) continue

                // Otherwise so long as the pos isn't a wall record its depth in the flood cost matrix

                floodCM.set(pos.x, pos.y, depth)

                // If visuals are enabled, show the depth on the pos

                if (Memory.roomVisuals) room.visual.rect(pos.x - 0.5, pos.y - 0.5, 1, 1, {
                    fill: 'hsl(' + 200 + depth * 10 + ', 100%, 60%)',
                    opacity: 0.4,
                })
            }

            // Construct a rect and get the positions in a range of 1

            const rect = { x1: pos.x - 1, y1: pos.y - 1, x2: pos.x + 1, y2: pos.y + 1 }
            const adjacentPositions = global.findPositionsInsideRect(rect)

            // Loop through adjacent positions

            for (const adjacentPos of adjacentPositions) {

                // Iterate if the adjacent pos has been visited or isn't a tile

                if(visitedCM.get(adjacentPos.x, adjacentPos.y) == 1) continue

                // Otherwise record that it has been visited

                visitedCM.set(adjacentPos.x, adjacentPos.y, 1)

                // Add it to the next gen

                nextGeneration.push(adjacentPos)
            }
        }

        // Set this gen to next gen

        thisGeneration = nextGeneration

        // Increment depth

        depth++
    }

    return floodCM
}

Room.prototype.pathVisual = function(path, color) {

    const room = this

    // Stop if roomVisuals are disabled

    if (!Memory.roomVisuals) return

    // Otherwise generate the path visual

    room.visual.poly(path, { stroke: constants.colors[color], strokeWidth: .15, opacity: .3, lineStyle: 'solid' })
}
