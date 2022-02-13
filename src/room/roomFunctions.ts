import { constants } from 'international/constants'
import { generalFuncs } from 'international/generalFunctions'
import { RoomObject } from './roomObject'
import { RoomTask } from './roomTasks'

Room.prototype.newGet = function(roomObjectName) {

    const room = this

    // Anchor

    new RoomObject({
        name: 'anchor',
        valueType: 'pos',
        cacheType: 'memory',
        room,
        valueConstructor: function() {
            return room.memory.anchor
        }
    })

    // Terrain

    new RoomObject({
        name: 'terrain',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: room.getTerrain
    })

    // Cost matrixes

    function generateTerrainCM() {

        const terrain = room.roomObjects.terrain.getValue()

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

                    terrainCM.set(x, y, 255)
                }
            }
        }

        return terrainCM
    }

    new RoomObject({
        name: 'terrainCM',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: generateTerrainCM
    })

    function generateBaseCM() {

        // Construct a cost matrix based off terrain cost matrix

        const baseCM = room.roomObjects.terrainCM.getValue()

        function recordAdjacentPositions(x: number, y: number, range: number) {

            // Construct a rect and get the positions in a range of 1

            const rect = { x1: x - range, y1: y - range, x2: x + range, y2: y + range }
            const adjacentPositions = generalFuncs.findPositionsInsideRect(rect)

            // Loop through adjacent positions

            for (const adjacentPos of adjacentPositions) {

                // Iterate if the adjacent pos is a wall

                if (baseCM.get(adjacentPos.x, adjacentPos.y) == 255) continue

                // Otherwise record the position as a wall

                baseCM.set(adjacentPos.x, adjacentPos.y, 255)
            }
        }

        // Record exits and adjacent positions to exits as something to avoid

        let y = 0
        let x = 0

        // Configure y and loop through top exits

        y = 0
        for (x = 0; x < 50; x++) {

            // Record the exit as a pos to avoid

            baseCM.set(x, y, 255)

            // Record adjacent positions to avoid

            recordAdjacentPositions(x, y, 1)
        }

        // Configure x and loop through left exits

        x = 0
        for (y = 0; y < 50; y++) {

            // Record the exit as a pos to avoid

            baseCM.set(x, y, 255)

            // Record adjacent positions to avoid

            recordAdjacentPositions(x, y, 1)
        }

        // Configure y and loop through bottom exits

        y = 49
        for (x = 0; x < 50; x++) {

            // Record the exit as a pos to avoid

            baseCM.set(x, y, 255)

            // Record adjacent positions to avoid

            recordAdjacentPositions(x, y, 1)
        }

        // Configure x and loop through right exits

        x = 49
        for (y = 0; y < 50; y++) {

            // Record the exit as a pos to avoid

            baseCM.set(x, y, 255)

            // Record adjacent positions to avoid

            recordAdjacentPositions(x, y, 1)
        }

        return baseCM
    }

    new RoomObject({
        name: 'baseCM',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: generateBaseCM
    })

    // Resources

    // Mineral

    new RoomObject({
        name: 'mineral',
        valueType: 'id',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {
            room.find(FIND_MINERALS)[0]?.id
        }
    })

    // Source 1

    new RoomObject({
        name: 'source1',
        valueType: 'id',
        cacheType: 'memory',
        room,
        valueConstructor: function() {

            // Get the first source

            const source = room.find(FIND_SOURCES)[0]

            // If the source exists, inform its id. Otherwise inform false

            if (source) return source.id
            return false
        }
    })

    // Source 2

    new RoomObject({
        name: 'source2',
        valueType: 'id',
        cacheType: 'memory',
        room,
        valueConstructor: function() {

            // Get the second source

            const source = room.find(FIND_SOURCES)[1]

            // If the source exists, inform its id. Otherwise inform false

            if (source) return source.id
            return false
        }
    })

    // Sources

    new RoomObject({
        name: 'sources',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {

            return [room.roomObjects.source1.getValue(), room.roomObjects.source2.getValue()]
        }
    })

    // Dynamically create RoomObjects for each structureType

    // Construct storage of structures and cSites based on their structureType

    const structuresByType: Partial<Record<StructureConstant, Structure[]>> = {},
    cSitesByType: Partial<Record<string, ConstructionSite[]>> = {}

    // Dynamically add each structure to their RoomObject structureType

    // Loop through all structres in room

    for (const structure of room.find(FIND_STRUCTURES)) {

        // If there is no key for the structureType, create it and assign it an empty array

        if (!structuresByType[structure.structureType]) structuresByType[structure.structureType] = []

        // Group structure by structureType

        structuresByType[structure.structureType].push(structure)
    }

    // Dynamically add each cSite to their RoomObject structureType

    // Loop through all cSites in room

    for (const cSite of room.find(FIND_MY_CONSTRUCTION_SITES)) {

        // If there is no key for the structureType, create it and assign it an empty array

        if (!cSitesByType[`${cSite.structureType}CSite`]) cSitesByType[`${cSite.structureType}CSite`] = []

        // Group cSites by structureType

        cSitesByType[`${cSite.structureType}CSite`].push(cSite)
    }

    // Loop through each structureType in the game

    for (const structureType of constants.allStructureTypes) {

        // Create roomObject for structures with the structureType

        new RoomObject({
            name: structureType,
            valueType: 'object',
            cacheType: 'global',
            cacheAmount: 1,
            room,
            valueConstructor: function() {
                return structuresByType[structureType]
            }
        })

        // Create a roomObject for sites with the structureType

        new RoomObject({
            name: structureType,
            valueType: 'object',
            cacheType: 'global',
            cacheAmount: 1,
            room,
            valueConstructor: function() {
                return cSitesByType[structureType]
            }
        })
    }

    // Construction sites based on owner

    function findEnemySites() {

        // Inform constuction sites that aren't owned by a member of the allyList

        return room.find(FIND_HOSTILE_CONSTRUCTION_SITES, {
            filter: cSite => !constants.allyList.has(cSite.owner.username)
        })
    }

    new RoomObject({
        name: 'enemyCSites',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: function() {

            // Inform constuction sites that aren't owned by a member of the allyList

            return room.find(FIND_HOSTILE_CONSTRUCTION_SITES, {
                filter: cSite => !constants.allyList.has(cSite.owner.username)
            })
        }
    })

    new RoomObject({
        name: 'allyCSites',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: function() {

            // Inform constuction sites that aren't owned by a member of the allyList

            return room.find(FIND_HOSTILE_CONSTRUCTION_SITES, {
                filter: cSite => constants.allyList.has(cSite.owner.username)
            })
        }
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
        const adjacentPositions: Pos[] = generalFuncs.findPositionsInsideRect(rect)

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
    * @returns the closest harvestPosition to the room's anchor
    */
    function findClosestHarvestPos(harvestPositions: RoomPosition[]): false | RoomPosition {

        // Get the room anchor

        const anchor = room.roomObjects.anchor.getValue()

        // Stop if there is no anchor

        if (!anchor) return false

        // Filter harvestPositions by closest one to anchor

        return anchor.findClosestByRange(harvestPositions)
    }

    new RoomObject({
        name: 'source1HarvestPositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {
            findHarvestPositions(room.roomObjects.source1.getValue())
        }
    })

    new RoomObject({
        name: 'source1ClosestHarvestPosition',
        valueType: 'pos',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {
            findClosestHarvestPos(room.roomObjects.source1HarvestPositions.getValue())
        }
    })

    new RoomObject({
        name: 'source2HarvestPositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {
            findHarvestPositions(room.roomObjects.source2.getValue())
        }
    })

    new RoomObject({
        name: 'source2ClosestHarvestPosition',
        valueType: 'pos',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {
            findClosestHarvestPos(room.roomObjects.source2HarvestPositions.getValue())
        }
    })

    // Upgrade positions

    function findCenterUpgradePos() {

        // Stop if there is no controller

        if (!room.controller) return false

        // Get the open areas in a range of 3 to the controller

        const distanceCM = room.distanceTransform(room.roomObjects.terrainCM.getValue(), false, room.controller.pos.x - 2, room.controller.pos.y - 2, room.controller.pos.x + 2, room.controller.pos.y + 2)

        // Stop if there is no recorded sources

        if (!room.roomObjects.source1.getValue() || !room.roomObjects.source2.getValue()) return false

        // Get the average pos between the two sources

        const sourcesAvgPos = generalFuncs.findAvgBetweenPosotions(room.roomObjects.source1.getValue().pos, room.roomObjects.source2.getValue().pos)

        // Find the closest value greater than two to the centerUpgradePos and inform it

        const centerUpgradePos = room.findClosestPosOfValue(distanceCM, sourcesAvgPos, 2)
        return centerUpgradePos
    }

    new RoomObject({
        name: 'centerUpgradePos',
        valueType: 'pos',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: findCenterUpgradePos
    })

    function findUpgradePositions() {

        // Get the center upgrade pos

        const centerUpgradePos = room.roomObjects.centerUpgradePos.getValue()

        // If the center upgrade pos isn't defined, inform false

        if (!centerUpgradePos) return false

        // Draw a rect around the center upgrade pos

        const rect = { x1: centerUpgradePos.x - 1, y1: centerUpgradePos.y - 1, x2: centerUpgradePos.x + 1, y2: centerUpgradePos.y + 1 }
        const upgradePositions = generalFuncs.findPositionsInsideRect(rect)

        // Inform the centerUpgadePos and its adjacent positions

        return upgradePositions
    }

    new RoomObject({
        name: 'upgradePositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: findUpgradePositions
    })

    // Source containers

    function findSourceContainer(closestHarvestPos: RoomPosition): string | false {

        // Stop and inform false if no closestHarvestPos

        if (!closestHarvestPos) return false

        // Look at the closestHarvestPos for structures

        const structuresAsPos = closestHarvestPos.lookFor(LOOK_STRUCTURES)

        // Loop through structuresAtPos

        for (const structure of structuresAsPos) {

            // If the structureType is container, inform the container's ID

            if (structure.structureType == STRUCTURE_CONTAINER) return structure.id
        }

        // Otherwise inform false

        return false
    }

    new RoomObject({
        name: 'source1Container',
        valueType: 'id',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {

            findSourceContainer(room.roomObjects.source1ClosestHarvestPosition.getValue())
        }
    })

    new RoomObject({
        name: 'source2Container',
        valueType: 'id',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {

            findSourceContainer(room.roomObjects.source2ClosestHarvestPosition.getValue())
        }
    })

    // controllerContainer

    function findControllerContainer(): string | false {

        // Get the centerUpgradePos

        const centerUpgradePos: RoomPosition = room.roomObjects.centerUpgradePos.getValue()

        // Stop and inform false if no centerUpgradePos

        if (!centerUpgradePos) return false

        // Look at the centerUpgradePos for structures

        const structuresAsPos = centerUpgradePos.lookFor(LOOK_STRUCTURES)

        // Loop through structuresAtPos

        for (const structure of structuresAsPos) {

            // If the structureType is container, inform the container's ID

            if (structure.structureType == STRUCTURE_CONTAINER) return structure.id
        }

        // Otherwise inform false

        return false
    }

    new RoomObject({
        name: 'controllerContainer',
        valueType: 'id',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: findControllerContainer
    })

    // Source links

    function findSourceLink(closestHarvestPos: RoomPosition): string | false {

        // Stop and inform false if no closestHarvestPos

        if (!closestHarvestPos) return false

        // Find links

        const links: StructureLink[] = room.roomObjects.link.getValue()

        // Iterate through links

        for (const link of links) {

            // If the link is near the harvestPos inform its id

            if (link.pos.getRangeTo(closestHarvestPos) == 1) return link.id
        }

        return false
    }

    new RoomObject({
        name: 'source1Link',
        valueType: 'id',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {

            findSourceLink(room.roomObjects.source1ClosestHarvestPosition.getValue())
        }
    })

    new RoomObject({
        name: 'source2Link',
        valueType: 'id',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {

            findSourceLink(room.roomObjects.source2ClosestHarvestPosition.getValue())
        }
    })

    // StructuresForSpawning

    function findStructuresForSpawning() {

        // Get the room anchor. If not defined, inform an empty array

        const anchor = room.roomObjects.anchor.getValue()
        if (!anchor) return []

        // Get array of spawns and extensions

        const spawnsAndExtensions: (StructureExtension | StructureSpawn)[] = room.roomObjects.spawn.getValue().concat(room.roomObjects.extension.getValue())

        // Filter energy structures by distance from anchor

        const filteredSpawnStructures = spawnsAndExtensions.sort((a, b) => a.pos.getRangeTo(anchor.x, anchor.y) - b.pos.getRangeTo(anchor.x, anchor.y))
        return filteredSpawnStructures
    }

    new RoomObject({
        name: 'structuresForSpawning',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: findStructuresForSpawning
    })

    // Creeps

    new RoomObject({
        name: 'notMyCreeps',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: function() {

            room.find(FIND_HOSTILE_CREEPS)
        }
    })

    new RoomObject({
        name: 'enemyCreeps',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: function() {

            room.find(FIND_HOSTILE_CREEPS, {
                filter: creep => !constants.allyList.has(creep.owner.username)
            })
        }
    })

    new RoomObject({
        name: 'allyCreeps',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: function() {

            room.find(FIND_HOSTILE_CREEPS, {
                filter: creep => !constants.allyList.has(creep.owner.username)
            })
        }
    })

    // Get the roomObject using it's name

    const roomObject = room.roomObjects[roomObjectName]

    // Inform the roomObject's value

    return roomObject.getValue()
}

Room.prototype.get = function(roomObjectName) {

    const room = this

    const roomObjects: Partial<Record<RoomObjectName, RoomObject>> = {}

    type RoomObjectValueTypes = 'pos' |
    'id' |
    'object'

    type RoomObjectCacheMethods = 'global' |
    'memory' | 'property'

    interface RoomObjectOpts {
        [key: string | number]: any
        name: RoomObjectName,
        value: any,
        valueType: RoomObjectValueTypes,
        cacheMethod: RoomObjectCacheMethods,
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

            const roomObject = this

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

            const roomObject = this

            // Stop if the value is not defined

            if (!roomObject.value) return false

            // If roomObject's valueType is id, return it as an object with the ID

            if (roomObject.valueType == 'id') return generalFuncs.findObjectWithID(roomObject.value)

            // If roomObject's type is pos, return it as a RoomPosition

            if (roomObject.valueType == 'pos') return room.newPos(roomObject.value)

            // return the value of the roomObject

            return roomObject.value
        }
        getValueIfViable() {

            const roomObject = this

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

                    terrainCM.set(x, y, 255)
                }
            }
        }

        return terrainCM
    }

    manageRoomObject({
        name: 'terrainCM',
        value: generateTerrainCM(),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    function generateBaseCM() {

        // Construct a cost matrix based off terrain cost matrix

        const baseCM = roomObjects.terrainCM.getValue()

        function recordAdjacentPositions(x: number, y: number, range: number) {

            // Construct a rect and get the positions in a range of 1

            const rect = { x1: x - range, y1: y - range, x2: x + range, y2: y + range }
            const adjacentPositions = generalFuncs.findPositionsInsideRect(rect)

            // Loop through adjacent positions

            for (const adjacentPos of adjacentPositions) {

                // Iterate if the adjacent pos is a wall

                if (baseCM.get(adjacentPos.x, adjacentPos.y) == 255) continue

                // Otherwise record the position as a wall

                baseCM.set(adjacentPos.x, adjacentPos.y, 255)
            }
        }

        // Record exits and adjacent positions to exits as something to avoid

        let y = 0
        let x = 0

        // Configure y and loop through top exits

        y = 0
        for (x = 0; x < 50; x++) {

            // Record the exit as a pos to avoid

            baseCM.set(x, y, 255)

            // Record adjacent positions to avoid

            recordAdjacentPositions(x, y, 1)
        }

        // Configure x and loop through left exits

        x = 0
        for (y = 0; y < 50; y++) {

            // Record the exit as a pos to avoid

            baseCM.set(x, y, 255)

            // Record adjacent positions to avoid

            recordAdjacentPositions(x, y, 1)
        }

        // Configure y and loop through bottom exits

        y = 49
        for (x = 0; x < 50; x++) {

            // Record the exit as a pos to avoid

            baseCM.set(x, y, 255)

            // Record adjacent positions to avoid

            recordAdjacentPositions(x, y, 1)
        }

        // Configure x and loop through right exits

        x = 49
        for (y = 0; y < 50; y++) {

            // Record the exit as a pos to avoid

            baseCM.set(x, y, 255)

            // Record adjacent positions to avoid

            recordAdjacentPositions(x, y, 1)
        }

        return baseCM
    }

    manageRoomObject({
        name: 'baseCM',
        value: generateBaseCM(),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    // Important Positions

    manageRoomObject({
        name: 'anchor',
        value: room.memory.anchor,
        valueType: 'pos',
        cacheMethod: 'memory',
    })

    // Resources

    manageRoomObject({
        name: 'mineral',
        value: room.find(FIND_MINERALS)[0]?.id,
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

        roomObjects[`${cSite.structureType}CSite`].value.push(cSite)
    }

    // Construction sites based on owner

    function findEnemySites() {

        // Inform constuction sites that aren't owned by a member of the allyList

        return room.find(FIND_HOSTILE_CONSTRUCTION_SITES, {
            filter: cSite => !constants.allyList.has(cSite.owner.username)
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
            filter: cSite => constants.allyList.has(cSite.owner.username)
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
        const adjacentPositions: Pos[] = generalFuncs.findPositionsInsideRect(rect)

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
    * @returns the closest harvestPosition to the room's anchor
    */
    function findClosestHarvestPos(harvestPositions: RoomPosition[]): false | RoomPosition {

        // Get the room anchor

        const anchor = roomObjects.anchor.getValue()

        // Stop if there is no anchor

        if (!anchor) return false

        // Filter harvestPositions by closest one to anchor

        return anchor.findClosestByRange(harvestPositions)
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
        value: findClosestHarvestPos(roomObjects.source1HarvestPositions.getValue()),
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
        value: findClosestHarvestPos(roomObjects.source2HarvestPositions.getValue()),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    // Upgrade positions

    function findCenterUpgradePos() {

        // Stop if there is no controller

        if (!room.controller) return false

        // Get the open areas in a range of 3 to the controller

        const distanceCM = room.distanceTransform(roomObjects.terrainCM.getValue(), false, room.controller.pos.x - 2, room.controller.pos.y - 2, room.controller.pos.x + 2, room.controller.pos.y + 2)

        // Stop if there is no recorded sources

        if (!roomObjects.source1.getValue() || !roomObjects.source2.getValue()) return false

        // Get the average pos between the two sources

        const sourcesAvgPos = generalFuncs.findAvgBetweenPosotions(roomObjects.source1.getValue().pos, roomObjects.source2.getValue().pos)

        // Find the closest value greater than two to the centerUpgradePos and inform it

        const centerUpgradePos = room.findClosestPosOfValue(distanceCM, sourcesAvgPos, 2)
        return centerUpgradePos
    }

    manageRoomObject({
        name: 'centerUpgradePos',
        value: findCenterUpgradePos(),
        valueType: 'pos',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    function findUpgradePositions() {

        // Get the center upgrade pos

        const centerUpgradePos = roomObjects.centerUpgradePos.getValue()

        // If the center upgrade pos isn't defined, inform false

        if (!centerUpgradePos) return false

        // Draw a rect around the center upgrade pos

        const rect = { x1: centerUpgradePos.x - 1, y1: centerUpgradePos.y - 1, x2: centerUpgradePos.x + 1, y2: centerUpgradePos.y + 1 }
        const upgradePositions = generalFuncs.findPositionsInsideRect(rect)

        // Inform the centerUpgadePos and its adjacent positions

        return upgradePositions
    }

    manageRoomObject({
        name: 'upgradePositions',
        value: findUpgradePositions(),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: Infinity,
    })

    // Source containers

    function findSourceContainer(closestHarvestPos: RoomPosition): string | false {

        // Stop and inform false if no closestHarvestPos

        if (!closestHarvestPos) return false

        // Look at the closestHarvestPos for structures

        const structuresAsPos = closestHarvestPos.lookFor(LOOK_STRUCTURES)

        // Loop through structuresAtPos

        for (const structure of structuresAsPos) {

            // If the structureType is container, inform the container's ID

            if (structure.structureType == STRUCTURE_CONTAINER) return structure.id
        }

        // Otherwise inform false

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

        // Get the centerUpgradePos

        const centerUpgradePos: RoomPosition = roomObjects.centerUpgradePos.getValue()

        // Stop and inform false if no centerUpgradePos

        if (!centerUpgradePos) return false

        // Look at the centerUpgradePos for structures

        const structuresAsPos = centerUpgradePos.lookFor(LOOK_STRUCTURES)

        // Loop through structuresAtPos

        for (const structure of structuresAsPos) {

            // If the structureType is container, inform the container's ID

            if (structure.structureType == STRUCTURE_CONTAINER) return structure.id
        }

        // Otherwise inform false

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

    // StructuresForSpawning

    function findStructuresForSpawning() {

        // Get the room anchor. If not defined, inform an empty array

        const anchor = roomObjects.anchor.getValue()
        if (!anchor) return []

        // Get array of spawns and extensions

        const spawnsAndExtensions: (StructureExtension | StructureSpawn)[] = roomObjects.spawn.getValue().concat(roomObjects.extension.getValue())

        // Filter energy structures by distance from anchor

        const filteredSpawnStructures = spawnsAndExtensions.sort((a, b) => a.pos.getRangeTo(anchor.x, anchor.y) - b.pos.getRangeTo(anchor.x, anchor.y))
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
            filter: creep => !constants.allyList.has(creep.owner.username)
        }),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: 1,
    })

    manageRoomObject({
        name: 'allyCreeps',
        value: room.find(FIND_HOSTILE_CREEPS, {
            filter: creep => !constants.allyList.has(creep.owner.username)
        }),
        valueType: 'object',
        cacheMethod: 'global',
        cacheAmount: 1,
    })

    //

    const roomObject = roomObjects[roomObjectName]

    // If the queries roomObject isn't in roomObjects

    if (!roomObject) {

        // Log an invalid query and inform undefined

        generalFuncs.customLog('Tried to get non-existent property', roomObjectName, constants.colors.white, constants.colors.red)
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

        const route = Game.map.findRoute(opts.origin.roomName, opts.goal.pos.roomName, {

            // Essentially a costMatrix for the rooms, priority is for the lower values. Infinity is impassible

            routeCallback(roomName: string) {

                // If the goal is in the room, inform 1

                if (roomName == opts.goal.pos.roomName) return 1

                // Get the room's memory

                const roomMemory = Memory.rooms[roomName]

                // If there is no memory for the room, inform impassible

                if (!roomMemory) return Infinity

                // If the type is in typeWeights, inform the weight for the type

                if (opts.typeWeights[roomMemory.type]) return opts.typeWeights[roomMemory.type]

                // Inform to consider this room

                return 2
            }
        })

        // If route doesn't work inform undefined

        if (route == ERR_NO_PATH) return undefined

        // Otherwise inform the route

        return route
    }

    // Construct path

    function generatePath() {

        const route = generateRoute()

        const pathFinderResult = PathFinder.search(opts.origin, opts.goal, {
            plainCost: opts.plainCost,
            swampCost: opts.swampCost,
            maxRooms: route ? 100 : 1,
            maxOps: 100000,
            flee: opts.flee,

            // Create costMatrixes for room tiles, where lower values are priority, and 255 or more is considered impassible

            roomCallback(roomName) {

                // Get the room using the roomName

                const room = Game.rooms[roomName]

                // Create a costMatrix for the room

                const cm = new PathFinder.CostMatrix()

                // If there is no route

                if (!route) {

                    let y = 0
                    let x = 0

                    // Configure y and loop through top exits

                    y = 0
                    for (x = 0; x < 50; x++) {

                        // Record the exit to be avoided

                        cm.set(x, y, 255)
                    }

                    // Configure x and loop through left exits

                    x = 0
                    for (y = 0; y < 50; y++) {

                        // Record the exit to be avoided

                        cm.set(x, y, 255)
                    }

                    // Configure y and loop through bottom exits

                    y = 49
                    for (x = 0; x < 50; x++) {

                        // Record the exit to be avoided

                        cm.set(x, y, 255)
                    }

                    // Configure x and loop through right exits

                    x = 49
                    for (y = 0; y < 50; y++) {

                        // Record the exit to be avoided

                        cm.set(x, y, 255)
                    }
                }

                weightGamebjects()

                function weightGamebjects() {

                    // Loop through weights in weightGameObjects

                    for (const weight in opts.weightGamebjects) {

                        // Use the weight to get the gameObjects

                        const gameObjects = opts.weightGamebjects[weight]

                        // Loop through each gameObject and set their pos to the weight in the cm

                        for (const gameObj of gameObjects) cm.set(gameObj.pos.x, gameObj.pos.y, parseInt(weight))
                    }
                }

                weightPositions()

                function weightPositions() {

                    // Loop through weights in weightGameObjects

                    for (const weight in opts.weightPositions) {

                        // Use the weight to get the positions

                        const positions = opts.weightPositions[weight]

                        // Loop through each gameObject and set their pos to the weight in the cm

                        for (const pos of positions) cm.set(pos.x, pos.y, parseInt(weight))
                    }
                }

                // If there is no vision in the room, inform the costMatrix

                if (!room) return cm

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

                // If there is a request to avoid enemy ranges

                avoidEnemyRanges()

                function avoidEnemyRanges() {

                    // Stop if avoidEnemyRanges isn't specified

                    if (opts.avoidEnemyRanges) return

                    // Stop if the is a controller, it's mine, and it's in safemode

                    if (room.controller && room.controller.my && room.controller.safeMode) return

                    // Get enemies and loop through them

                    const enemyCreeps: Creep[] = room.get('enemyCreeps')
                    for (const enemyCreep of enemyCreeps) {

                        // Construct rect and get positions inside

                        const rect = {
                            x1: enemyCreep.pos.x - 2,
                            y1: enemyCreep.pos.y - 2,
                            x2: enemyCreep.pos.x + 2,
                            y2: enemyCreep.pos.y + 2
                        }
                        const positions = generalFuncs.findPositionsInsideRect(rect)

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

                    // Loop through structureTypes of impassibleStructureTypes

                    for (const structureType of constants.impassibleStructureTypes) {

                        // Get structures of type and loop through them

                        const structuresOfType: Structure<StructureConstant>[] = room.get(structureType)

                        for (const structure of structuresOfType) {

                            // Set pos as impassible

                            cm.set(structure.pos.x, structure.pos.y, 255)
                        }

                        // Get cSites of type and loop through them

                        const cSitesOfType: ConstructionSite<BuildableStructureConstant>[] = room.get(`${structureType}CSite`)

                        for (const cSite of cSitesOfType) {

                            // Set pos as impassible

                            cm.set(cSite.pos.x, cSite.pos.y, 255)
                        }
                    }
                }

                // Inform the CostMatrix

                return cm
            }
        })

        // If the pathFindResult is incomplete, inform an empty array

        if (pathFinderResult.incomplete) {

            generalFuncs.customLog('Incomplete Path', JSON.stringify(opts.origin), constants.colors.white, constants.colors.red)
            room.pathVisual(pathFinderResult.path, constants.colors.red as keyof Colors)
            room.visual.circle(opts.goal.pos, { fill: constants.colors.red })
            return []
        }

        // Otherwise inform the path from pathFinderResult

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

            if (constants.allyList.has(controller.owner.username)) {

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

            if (constants.allyList.has(controller.reservation.username)) {

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

                    if (constants.allyList.has(creep.reservation.username)) {

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

        const distanceFromScoutingRoom = generalFuncs.advancedFindDistance(scoutingRoom.name, room.name,
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

Room.prototype.findTasksOfTypes = function(createdTaskIDs, types) {

    const room = this

    // Initialize tasks of types

    const tasksOfTypes = []

    // Iterate through IDs of createdTasks

    for (const taskID in createdTaskIDs) {

        // Set the task from tasks with no responders

        let task: RoomTask = global[room.name].tasksWithoutResponders[taskID]

        // If the task doesn't exist there, try to find it in tasks with responders

        if (!task) task = global[room.name].tasksWithResponders[taskID]

        // If the task is not of the specified types, iterate

        if (!types.has(task.type)) continue

        // Otherwise add the task to tasksOfTypes

        tasksOfTypes.push(task)
    }

    // Inform false if no tasks had the specified types

    return tasksOfTypes
}

Room.prototype.findScore = function() {

    const room = this


}

Room.prototype.distanceTransform = function(initialCM, enableVisuals, x1 = constants.roomDimensions, y1 = constants.roomDimensions, x2 = -1, y2 = -1) {

    const room = this

    // Use a costMatrix to record distances. Use the initialCM if provided, otherwise create one

    const distanceCM = initialCM || new PathFinder.CostMatrix()

    for (let x = x1; x <= x2; x++) {
        for (let y = y1; y <= y2; y++) {

            // Iterate if pos is to be avoided

            if (distanceCM.get(x, y) == 255) continue

            // Otherwise construct a rect and get the positions in a range of 1

            const rect = { x1: x - 1, y1: y - 1, x2: x + 1, y2: y + 1 }
            const adjacentPositions = generalFuncs.findPositionsInsideRect(rect)

            // Construct the distance value as the avoid value

            let distanceValue = 255

            // Iterate through positions

            for (const adjacentPos of adjacentPositions) {

                // Get the value of the pos in distanceCM

                const value = distanceCM.get(adjacentPos.x, adjacentPos.y)

                // Iterate if the value has yet to be configured

                if (value == 0) continue

                // If the value is to be avoided, stop the loop

                if (value == 255) {

                    distanceValue = 1
                    break
                }

                // Otherwise check if the depth is less than the distance value. If so make it the new distance value plus one

                if (value < distanceValue) distanceValue = 1 + value
            }

            // If the distance value is that of avoid, set it to 1

            if (distanceValue == 255) distanceValue = 1

            // Record the distanceValue in the distance cost matrix

            distanceCM.set(x, y, distanceValue)
        }
    }

    for (let x = x2; x >= x1; x--) {
        for (let y = y2; y >= y1; y--) {

            // Iterate if pos is to be avoided

            if (distanceCM.get(x, y) == 255) continue

            // Otherwise construct a rect and get the positions in a range of 1

            const rect = { x1: x - 1, y1: y - 1, x2: x + 1, y2: y + 1 }
            const adjacentPositions = generalFuncs.findPositionsInsideRect(rect)

            // Construct the distance value as the avoid value

            let distanceValue = 255

            // Iterate through positions

            for (const adjacentPos of adjacentPositions) {

                // Get the value of the pos in distanceCM

                const value = distanceCM.get(adjacentPos.x, adjacentPos.y)

                // Iterate if the value has yet to be configured

                if (value == 0) continue

                // If the value is to be avoided, stop the loop

                if (value == 255) {

                    distanceValue = 1
                    break
                }

                // Otherwise check if the depth is less than the distance value. If so make it the new distance value plus one

                if (value < distanceValue) distanceValue = 1 + value
            }

            // If the distance value is that of avoid, set it to 1

            if (distanceValue == 255) distanceValue = 1

            // Record the distanceValue in the distance cost matrix

            distanceCM.set(x, y, distanceValue)

            // If roomVisuals are enabled, show the terrain's distanceValue

            if (enableVisuals && Memory.roomVisuals) room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                fill: 'hsl(' + 200 + distanceValue * 10 + ', 100%, 60%)',
                opacity: 0.4,
            })
        }
    }

    return distanceCM
}

Room.prototype.specialDT = function(initialCM, enableVisuals) {

    const room = this

    // Use a costMatrix to record distances. Use the initialCM if provided, otherwise create one

    const distanceCM = initialCM || new PathFinder.CostMatrix()

    for (let x = 0; x < constants.roomDimensions; x++) {
        for (let y = 0; y < constants.roomDimensions; y++) {

            // Iterate if pos is to be avoided

            if (distanceCM.get(x, y) == 255) continue

            // Otherwise construct a rect and get the positions in a range of 1

            const adjacentPositions = [
                {
                    x: x - 1,
                    y: y
                },
                {
                    x: x + 1,
                    y: y
                },
                {
                    x: x,
                    y: y - 1
                },
                {
                    x: x,
                    y: y + 1
                },
            ]

            // Construct the distance value as the avoid value

            let distanceValue = 255

            // Iterate through positions

            for (const adjacentPos of adjacentPositions) {

                // Get the value of the pos in distanceCM

                const value = distanceCM.get(adjacentPos.x, adjacentPos.y)

                // Iterate if the value has yet to be configured

                if (value == 0) continue

                // If the value is to be avoided, stop the loop

                if (value == 255) {

                    distanceValue = 1
                    break
                }

                // Otherwise check if the depth is less than the distance value. If so make it the new distance value plus one

                if (value < distanceValue) distanceValue = 1 + value
            }

            // If the distance value is that of avoid, set it to 1

            if (distanceValue == 255) distanceValue = 1

            // Record the distanceValue in the distance cost matrix

            distanceCM.set(x, y, distanceValue)
        }
    }

    for (let x = constants.roomDimensions -1; x > -1; x--) {
        for (let y = constants.roomDimensions -1; y > -1; y--) {

            // Iterate if pos is to be avoided

            if (distanceCM.get(x, y) == 255) continue

            // Otherwise construct a rect and get the positions in a range of 1

            const adjacentPositions = [
                {
                    x: x - 1,
                    y: y
                },
                {
                    x: x + 1,
                    y: y
                },
                {
                    x: x,
                    y: y - 1
                },
                {
                    x: x,
                    y: y + 1
                },
            ]

            // Construct the distance value as the avoid value

            let distanceValue = 255

            // Iterate through positions

            for (const adjacentPos of adjacentPositions) {

                // Get the value of the pos in distanceCM

                const value = distanceCM.get(adjacentPos.x, adjacentPos.y)

                // Iterate if the value has yet to be configured

                if (value == 0) continue

                // If the value is to be avoided, stop the loop

                if (value == 255) {

                    distanceValue = 1
                    break
                }

                // Otherwise check if the depth is less than the distance value. If so make it the new distance value plus one

                if (value < distanceValue) distanceValue = 1 + value
            }

            // If the distance value is that of avoid, set it to 1

            if (distanceValue == 255) distanceValue = 1

            // Record the distanceValue in the distance cost matrix

            distanceCM.set(x, y, distanceValue)

            // If roomVisuals are enabled, show the terrain's distanceValue

            if (enableVisuals && Memory.roomVisuals) room.visual.rect(x - 0.5, y - 0.5, 1, 1, {
                fill: 'hsl(' + 200 + distanceValue * 10 + ', 100%, 60%)',
                opacity: 0.4,
            })
        }
    }

    return distanceCM
}

Room.prototype.floodFill = function(seeds) {

    const room = this

    // Construct a cost matrix for the flood

    const floodCM = new PathFinder.CostMatrix()

    // Get the terrain cost matrix

    const terrain = room.get('terrain')

    // Construct a cost matrix for visited tiles and add seeds to it

    const visitedCM = new PathFinder.CostMatrix()

    // Construct values for the flood

    let depth = 0

    let thisGeneration: Pos[] = seeds

    let nextGeneration: Pos[] = []

    // Loop through positions of seeds

    for (const pos of seeds) {

        // Record the seedsPos as visited

        visitedCM.set(pos.x, pos.y, 1)
    }

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
                    fill: 'hsl(' + 200 + depth * 2 + ', 100%, 60%)',
                    opacity: 0.4,
                })
            }

            // Construct a rect and get the positions in a range of 1

            const rect = { x1: pos.x - 1, y1: pos.y - 1, x2: pos.x + 1, y2: pos.y + 1 }
            const adjacentPositions = generalFuncs.findPositionsInsideRect(rect)

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

Room.prototype.findClosestPosOfValue = function(CM, startPos, requiredValue) {

    const room = this

    // Construct a cost matrix for visited tiles and add seeds to it

    const visitedCM = new PathFinder.CostMatrix()

    // Construct values for the check

    let thisGeneration: Pos[] = [startPos]

    let nextGeneration: Pos[] = []

    // Record startPos as visited

    visitedCM.set(startPos.x, startPos.y, 1)

    // So long as there are positions in this gen

    while (thisGeneration.length) {

        // Reset next gen

        nextGeneration = []

        // Iterate through positions of this gen

        for (const pos of thisGeneration) {

            // Get the value of the pos

            const posValue = CM.get(pos.x, pos.y)

            // If the value of the pos isn't to avoid and is greater than of equal to the required value

            if (posValue != 255 && posValue >= requiredValue) {

                // Inform this position

                return pos
            }

            // Construct a rect and get the positions in a range of 1

            const rect = { x1: pos.x - 1, y1: pos.y - 1, x2: pos.x + 1, y2: pos.y + 1 }
            const adjacentPositions = generalFuncs.findPositionsInsideRect(rect)

            // Loop through adjacent positions

            for (const adjacentPos of adjacentPositions) {

                // Iterate if the adjacent pos has been visited or isn't a tile

                if(visitedCM.get(adjacentPos.x, adjacentPos.y) == 1) continue

                // Otherwise record that it has been visited

                visitedCM.set(adjacentPos.x, adjacentPos.y, 1)

                // Add it tofastFillerSide the next gen

                nextGeneration.push(adjacentPos)
            }
        }

        // Set this gen to next gen

        thisGeneration = nextGeneration
    }

    // Inform false if no value was found

    return false
}

Room.prototype.pathVisual = function(path, color) {

    const room = this

    // Stop if roomVisuals are disabled

    if (!Memory.roomVisuals) return

    // Otherwise generate the path visual

    room.visual.poly(path, { stroke: constants.colors[color], strokeWidth: .15, opacity: .3, lineStyle: 'solid' })
}

Room.prototype.findCSiteTargetID = function(creep) {

    const room = this

    // Find my construction sites

    const myCSites = room.find(FIND_MY_CONSTRUCTION_SITES)

    // If there are no sites inform false

    if (!myCSites.length) return false

    // Get the anchor

    let anchor: RoomPosition = room.get('anchor')

    // If there is no anchor, set it as the creep's pos

    if (!anchor) anchor = creep.pos

    // Otherwise construct structure options

    let targetCSites: Structure[]

    // Loop through structuretypes of the build priority

    for (const structureType of constants.structureTypesByBuildPriority) {

        // Get the structures with the relevant type

        const cSitesOfType: Structure[] = room.get(`${structureType}CSite`)

        if(cSitesOfType.length > 0) {

            targetCSites = cSitesOfType
            break
        }
    }

    // Get the closest site to the anchor

    const cSiteTarget = anchor.findClosestByRange(targetCSites)

    // Record the cSiteTarget in the room's global and inform true

    global[room.name].cSiteTargetID = cSiteTarget.id
    return true
}

Room.prototype.findUsedHarvestPositions = function() {

    const room = this

    // Loop through each sourceHarvester's name in the room

    for (const creepName of room.myCreeps.sourceHarvester) {

        // Get the creep using its name

        const creep = Game.creeps[creepName]

        // Get the creep's harvestPos

        const harvestPos = creep.memory.harvestPos

        // If the creep has a harvestPos, record it in usedHarvestPositions

        if (harvestPos) room.usedHarvestPositions.set(harvestPos.x, harvestPos.y, 255)
    }
}

Room.prototype.findSourceHarvesterInfo = function() {

    const room = this

    // Loop through each sourceHarvester's name in the room

    for (const creepName of room.myCreeps.sourceHarvester) {

        // Get the creep using its name

        const creep = Game.creeps[creepName]

        // Get the creep's sourceName, if there is none iterate

        const sourceName = creep.memory.sourceName
        if (!sourceName) continue

        // Record that the creep has this sourceName in creepsOfSouceAmount

        room.creepsOfSourceAmount[sourceName]++

        // Get the creep's harvestPos, if not defined iterate

        const harvestPos = creep.memory.harvestPos
        if (!harvestPos) continue

        // Record the harvestPos in usedHarvestPositions

        room.usedHarvestPositions.set(harvestPos.x, harvestPos.y, 255)
    }
}
