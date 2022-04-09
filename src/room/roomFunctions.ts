import { constants } from 'international/constants'
import { advancedFindDistance, arePositionsEqual, customLog, findPositionsInsideRect } from 'international/generalFunctions'
import { ControllerUpgrader, SourceHarvester } from './creeps/creepClasses'
import { RoomObject } from './roomObject'
import { RoomTask } from './roomTasks'

Room.prototype.get = function(roomObjectName) {

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

    // Cost matrixes

    function generateTerrainCM() {

        const terrain = room.getTerrain()

        // Create a CostMatrix for terrain types

        const terrainCM = new PathFinder.CostMatrix()

        // Loop through each x and y in the room

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

            const adjacentPositions = findPositionsInsideRect(x - range, y - range, x + range, x - range)

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

    // roadCM

    new RoomObject({
        name: 'roadCM',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: () => { return new PathFinder.CostMatrix() }
    })

    // structurePlans

    new RoomObject({
        name: 'structurePlans',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: () => { return new PathFinder.CostMatrix() }
    })

    // rampartPlans

    new RoomObject({
        name: 'rampartPlans',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: () => { return new PathFinder.CostMatrix() }
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
            return room.find(FIND_MINERALS)[0]?.id
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

    // Structures and cSites

    function findStructuresByType() {

        // Construct storage of structures based on structureType

        const structuresByType: Partial<Record<StructureConstant, Structure[]>> = {}

        // Loop through all structres in room

        for (const structure of room.find(FIND_STRUCTURES)) {

            // If there is no key for the structureType, create it and assign it an empty array

            if (!structuresByType[structure.structureType]) structuresByType[structure.structureType] = []

            // Group structure by structureType

            structuresByType[structure.structureType].push(structure)
        }

        // Inform structuresByType

        return structuresByType
    }

    new RoomObject({
        name: 'structuresByType',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: findStructuresByType
    })

    function findCSitesByType() {

        // Construct storage of cSites based on structureType

        const cSitesByType: Partial<Record<StructureConstant, ConstructionSite[]>> = {}

        // Loop through all structres in room

        for (const cSite of room.find(FIND_MY_CONSTRUCTION_SITES)) {

            // If there is no key for the structureType, create it and assign it an empty array

            if (!cSitesByType[cSite.structureType]) cSitesByType[cSite.structureType] = []

            // Group cSite by structureType

            cSitesByType[cSite.structureType].push(cSite)
        }

        // Inform structuresByType

        return cSitesByType
    }

    new RoomObject({
        name: 'cSitesByType',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: findCSitesByType
    })

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
                return room.roomObjects.structuresByType.getValue()[structureType] || []
            }
        })

        // Create a roomObject for sites with the structureType

        new RoomObject({
            name: `${structureType}CSite`,
            valueType: 'object',
            cacheType: 'global',
            cacheAmount: 1,
            room,
            valueConstructor: function() {
                return room.roomObjects.cSitesByType.getValue()[structureType] || []
            }
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
     function findSourceHarvestPositions(source: Source): Pos[] {

        // Stop and inform empty array if there is no source

        if (!source) return []

        // Construct harvestPositions

        const harvestPositions: Pos[] = [],

        // Find terrain in room

        terrain = Game.map.getRoomTerrain(room.name),

        // Find positions adjacent to source

        adjacentPositions = findPositionsInsideRect(source.pos.x - 1, source.pos.y - 1, source.pos.x + 1, source.pos.y + 1)

        // Loop through each pos

        for (const pos of adjacentPositions) {

            // Iterate if terrain for pos is a wall

            if (terrain.get(pos.x, pos.y) == TERRAIN_MASK_WALL) continue

            // Add pos to harvestPositions

            harvestPositions.push(room.newPos(pos))
        }

        // Inform harvestPositions

        return harvestPositions
    }

    /**
    * @param harvestPositions array of RoomPositions to filter
    * @returns the closest harvestPosition to the room's anchor
    */
    function findClosestSourceHarvestPos(harvestPositions: RoomPosition[]): false | RoomPosition {

        // Get the room anchor, stopping if it's undefined

        const anchor: RoomPosition | false = room.roomObjects.anchor.getValue()
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

            return findSourceHarvestPositions(room.roomObjects.source1.getValue())
        }
    })

    new RoomObject({
        name: 'source1ClosestHarvestPos',
        valueType: 'pos',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {

            return findClosestSourceHarvestPos(room.roomObjects.source1HarvestPositions.getValue())
        }
    })

    new RoomObject({
        name: 'source2HarvestPositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {

            return findSourceHarvestPositions(room.roomObjects.source2.getValue())
        }
    })

    new RoomObject({
        name: 'source2ClosestHarvestPos',
        valueType: 'pos',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {

            return findClosestSourceHarvestPos(room.roomObjects.source2HarvestPositions.getValue())
        }
    })

    function findMineralHarvestPos(): Pos | false {

        // Get the room's mineral

        const mineral: Mineral = room.roomObjects.mineral.getValue(),

        // Construct harvestPositions

        harvestPositions: RoomPosition[] = [],

        // Get terrain in room

        terrain = Game.map.getRoomTerrain(room.name),

        // Find positions adjacent to mineral

        adjacentPositions = findPositionsInsideRect(mineral.pos.x - 1, mineral.pos.y - 1, mineral.pos.x + 1, mineral.pos.y + 1)

        // Loop through postions of adjacentPositions

        for (const pos of adjacentPositions) {

            // Iterate if terrain for pos is a wall

            if (terrain.get(pos.x, pos.y) == TERRAIN_MASK_WALL) continue

            // Add pos to harvestPositions

            harvestPositions.push(room.newPos(pos))
        }

        // Get the anchor, informing false if it's undefined

        const anchor: RoomPosition = room.roomObjects.anchor.getValue()
        if (!anchor) return false

        // Inform the closest pos of harvestPositions to the anchor

        return anchor.findClosestByRange(harvestPositions)
    }

    // Mineral harvest pos

    new RoomObject({
        name: 'mineralHarvestPos',
        valueType: 'pos',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {

            return findMineralHarvestPos()
        }
    })

    // Upgrade positions

    function findCenterUpgradePos() {

        // Stop if there is no controller

        if (!room.controller) return false

        // Get the anchor, informing false if it's undefined

        const anchor = room.roomObjects.anchor.getValue()
        if (!anchor) return false

        // Get the open areas in a range of 3 to the controller

        const distanceCM = room.distanceTransform(false, room.controller.pos.x - 2, room.controller.pos.y - 2, room.controller.pos.x + 2, room.controller.pos.y + 2)

        // Find the closest value greater than two to the centerUpgradePos and inform it

        return room.findClosestPosOfValue({
            CM: distanceCM,
            startPos: anchor,
            requiredValue: 2
        })
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

        // Get the center upgrade pos, stopping if it's undefined

        const centerUpgradePos = room.roomObjects.centerUpgradePos.getValue()
        if (!centerUpgradePos) return false

        // Draw a rect around the center upgrade pos, informing positions inside

        return room.findRoomPositionsInsideRect(centerUpgradePos.x - 1, centerUpgradePos.y - 1, centerUpgradePos.x + 1, centerUpgradePos.y + 1)
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

    function findSourceContainer(closestHarvestPos: RoomPosition) {

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

            return findSourceContainer(room.roomObjects.source1ClosestHarvestPos.getValue())
        }
    })

    new RoomObject({
        name: 'source2Container',
        valueType: 'id',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {

            return findSourceContainer(room.roomObjects.source2ClosestHarvestPos.getValue())
        }
    })

    // usedHarvestPositions

    function findUsedHarvestPositions() {

        // Construct usedHarvestPositions

        const usedHarvestPositions: Set<number> = new Set()

        // Loop through each sourceHarvester's name in the room

        for (const creepName of room.myCreeps.sourceHarvester) {

            // Get the creep using its name

            const creep: SourceHarvester = Game.creeps[creepName]

            // Get the creep's sourceName, if there is none iterate

            const sourceName = creep.memory.sourceName
            if (!sourceName) continue

            // Record that the creep has this sourceName in creepsOfSouceAmount

            room.creepsOfSourceAmount[sourceName]++

            // If the creep has a packedHarvestPos, record it in usedHarvestPositions

            if (creep.memory.packedHarvestPos) usedHarvestPositions.add(creep.memory.packedHarvestPos)
        }

        // Inform usedHarvestPositions

        return usedHarvestPositions
    }

    new RoomObject({
        name: 'usedHarvestPositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: findUsedHarvestPositions
    })

    // usedUpgradePositions

    function findUsedUpgradePositions() {

        // Construct usedUpgradePositions

        const usedUpgradePositions: Set<number> = new Set(),

        // Get the controllerContainer

        controllerContainer: StructureContainer = room.roomObjects.controllerContainer.getValue()

        // If there is no controllerContainer

        if (!controllerContainer) {

            // Get the centerUpgradePos and set it as avoid in usedUpgradePositions

            const centerUpgadePos = room.roomObjects.centerUpgradePos.getValue()
            usedUpgradePositions.add(centerUpgadePos.x * constants.roomDimensions + centerUpgadePos.y)
        }

        // Get the hubAnchor, informing false if it's not defined

        const hubAnchor: RoomPosition = global[room.name].stampAnchors?.hub[0]
        if (!hubAnchor) return false

        // Get the upgradePositions, informing false if they're undefined

        const upgradePositions: RoomPosition[] = room.roomObjects.upgradePositions.getValue()
        if (!upgradePositions.length) return false

        // Get the closest pos of the upgradePositions by range to the anchor

        const closestUpgradePos = hubAnchor.findClosestByRange(upgradePositions)

        // Assign closestUpgradePos in usedUpgradePositions

        usedUpgradePositions.add(closestUpgradePos.x * constants.roomDimensions + closestUpgradePos.y)

        // Loop through each controllerUpgrader's name in the room

        for (const creepName of room.myCreeps.controllerUpgrader) {

            // Get the creep using its name

            const creep: ControllerUpgrader = Game.creeps[creepName]

            // If the creep has a packedUpgradePos, record it in usedUpgradePositions

            if (creep.memory.packedUpgradePos) usedUpgradePositions.add(creep.memory.packedUpgradePos)
        }

        // Inform usedUpgradePositions

        return usedUpgradePositions
    }

    new RoomObject({
        name: 'usedUpgradePositions',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: findUsedUpgradePositions
    })

    // Path lengths

    // source1PathLength

    new RoomObject({
        name: 'source1PathLength',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() { return global[room.name].source1PathLength }
    })

    // source2PathLength

    new RoomObject({
        name: 'source2PathLength',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() { return global[room.name].source2PathLength }
    })

    // upgradePathLength


    new RoomObject({
        name: 'upgradePathLength',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() { return global[room.name].upgradePathLength }
    })


    // controllerContainer

    function findControllerContainer() {

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

    // mineralContainer

    function findMineralContainer() {

        // Get the mineralHarvestPos, informing false if it's undefined

        const mineralHarvestPos: RoomPosition = room.roomObjects.mineralHarvestPos.getValue()
        if (!mineralHarvestPos) return false

        // Look at the mineralHarvestPos for structures

        const structuresAsPos = mineralHarvestPos.lookFor(LOOK_STRUCTURES)

        // Loop through structuresAtPos

        for (const structure of structuresAsPos) {

            // If the structureType is container, inform the container's ID

            if (structure.structureType == STRUCTURE_CONTAINER) return structure.id
        }

        // Otherwise inform false

        return false
    }

    new RoomObject({
        name: 'mineralContainer',
        valueType: 'id',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: findMineralContainer
    })

    // base containers

    function findFastFillerContainer(offset: number) {

        // Get the anchor, stopping if it isn't defined

        const anchor = room.roomObjects.anchor.getValue()
        if (!anchor) return false

        // Otherwise search based on an offset from the anchor's x

        const structuresAsPos = room.getPositionAt(anchor.x + offset, anchor.y).lookFor(LOOK_STRUCTURES)

        // Loop through structuresAtPos

        for (const structure of structuresAsPos) {

            // If the structureType is container, inform the container's ID

            if (structure.structureType == STRUCTURE_CONTAINER) return structure.id
        }

        // Otherwise inform false

        return false
    }

    new RoomObject({
        name: 'fastFillerContainerLeft',
        valueType: 'id',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: () => { return findFastFillerContainer(-2) }
    })

    new RoomObject({
        name: 'fastFillerContainerRight',
        valueType: 'id',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: () => { return findFastFillerContainer(2) }
    })

    new RoomObject({
        name: 'labContainer',
        valueType: 'id',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {}
    })

    // Links

    function findLinkAtPos(pos: RoomPosition): Id<Structure> | false {

        // Otherwise search based on an offset from the anchor's x

        const structuresAsPos = room.getPositionAt(pos.x, pos.y).lookFor(LOOK_STRUCTURES)

        // Loop through structuresAtPos

        for (const structure of structuresAsPos) {

            // If the structureType is link, inform the structures's ID

            if (structure.structureType == STRUCTURE_LINK) return structure.id
        }

        // Otherwise inform false

        return false
    }

    new RoomObject({
        name: 'source1Link',
        valueType: 'id',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {

            return findLinkAtPos(room.roomObjects.source1ClosestHarvestPos.getValue())
        }
    })

    new RoomObject({
        name: 'source2Link',
        valueType: 'id',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {

            return findLinkAtPos(room.roomObjects.source2ClosestHarvestPos.getValue())
        }
    })

    new RoomObject({
        name: 'controllerLink',
        valueType: 'id',
        cacheType: 'global',
        cacheAmount: Infinity,
        room,
        valueConstructor: function() {

            return findLinkAtPos(room.roomObjects.centerUpgradePos.getValue())
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

            return room.find(FIND_HOSTILE_CREEPS)
        }
    })

    new RoomObject({
        name: 'enemyCreeps',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: function() {

            return room.find(FIND_HOSTILE_CREEPS, {
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

            return room.find(FIND_HOSTILE_CREEPS, {
                filter: creep => constants.allyList.has(creep.owner.username)
            })
        }
    })

    new RoomObject({
        name: 'remoteNamesByEfficacy',
        valueType: 'object',
        cacheType: 'global',
        cacheAmount: 1,
        room,
        valueConstructor: function() {

            // Sort the room's remotes based on the lowest source efficacy

            return room.memory.remotes.sort(function(a, b) {

                return Math.min(...Memory.rooms[a].sourceEfficacies) - Math.min(...Memory.rooms[b].sourceEfficacies)
            })
        }
    })

    // Get the roomObject using it's name

    const roomObject = room.roomObjects[roomObjectName]

    // Inform the roomObject's value

    return roomObject.getValue()
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

                if (opts.typeWeights && opts.typeWeights[roomMemory.type]) return opts.typeWeights[roomMemory.type]

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
            plainCost: opts.plainCost || 2,
            swampCost: opts.swampCost || 8,
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

                weightStructures()

                function weightStructures() {

                    // Loop through weights in weightGameObjects

                    for (const weight in opts.weightStructures) {

                        // Use the weight to get the gameObjects

                        const gameObjects = opts.weightGamebjects[weight]

                        // Get the numeric value of the weight

                        const weightNumber = parseInt(weight)

                        // Loop through each gameObject and set their pos to the weight in the cm

                        for (const gameObj of gameObjects) cm.set(gameObj.pos.x, gameObj.pos.y, weightNumber)
                    }
                }

                weightGamebjects()

                function weightGamebjects() {

                    // Loop through weights in weightGameObjects

                    for (const weight in opts.weightGamebjects) {

                        // Use the weight to get the gameObjects

                        const gameObjects = opts.weightGamebjects[weight]

                        // Get the numeric value of the weight

                        const weightNumber = parseInt(weight)

                        // Loop through each gameObject and set their pos to the weight in the cm

                        for (const gameObj of gameObjects) cm.set(gameObj.pos.x, gameObj.pos.y, weightNumber)
                    }
                }

                weightPositions()

                function weightPositions() {

                    // Loop through weights in weightGameObjects

                    for (const weight in opts.weightPositions) {

                        // Use the weight to get the positions

                        const positions = opts.weightPositions[weight]

                        // Get the numeric value of the weight

                        const weightNumber = parseInt(weight)

                        // Loop through each gameObject and set their pos to the weight in the cm

                        for (const pos of positions) cm.set(pos.x, pos.y, weightNumber)
                    }
                }

                weightCostMatrixes()

                function weightCostMatrixes() {

                    // Stop if there are no cost matrixes to weight

                    if (!opts.weightCostMatrixes) return

                    // Otherwise iterate through each x and y in the room

                    for (let x = 0; x < constants.roomDimensions; x++) {
                        for (let y = 0; y < constants.roomDimensions; y++) {

                            // Loop through each costMatrix

                            for (const weightCM of opts.weightCostMatrixes) {

                                // If weightCM is defined, assign the weightCM's value of this pos to the cm's value

                                if (weightCM) cm.set(x, y, weightCM.get(x, y))
                            }
                        }
                    }
                }

                // If there is no vision in the room, inform the costMatrix

                if (!room) return cm

                // Loop trough each construction site belonging to an ally

                for (const cSite of room.get('allyCSites')) {

                    // Set the site as impassible

                    cm.set(cSite.x, cSite.y, 255)
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

                        const positions = findPositionsInsideRect(enemyCreep.pos.x - 2, enemyCreep.pos.y - 2, enemyCreep.pos.x + 2, enemyCreep.pos.y + 2)

                        // Loop through positions and set them as impassible

                        for (const pos of positions) cm.set(pos.x, pos.y, 255)
                    }
                }

                // If avoiding structures that can't be walked on is enabled

                if (opts.avoidImpassibleStructures) {

                    // Get and loop through ramparts

                    const ramparts: StructureRampart[] = room.get('rampart')
                    for (const rampart of ramparts) {

                        // If the rampart is mine or public

                        if (rampart.my) {

                            // If there is no weight for my ramparts, iterate

                            if (!opts.myRampartWeight) continue

                            // Otherwise, record rampart by the weight and iterate

                            cm.set(rampart.pos.x, rampart.pos.y, opts.myRampartWeight)
                            continue
                        }

                        // Otherwise if the rampart is public, iterate

                        if (rampart.isPublic) continue

                        // Otherwise set the rampart's pos as impassible

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

                // If avoidStationaryPositions is requested

                if (opts.avoidStationaryPositions) {

                    // Construct the sourceNames

                    const sources: ('source1' | 'source2')[] = ['source1', 'source2']

                    // Loop through them

                    for (const sourceName of sources) {

                        // Find harvestPositions for sourceNames, iterating if there are none

                        const harvestPositions = room.get(`${sourceName}HarvestPositions`)
                        if (!harvestPositions?.length) continue

                        // Loop through each position of harvestPositions, have creeps prefer to avoid

                        for (const pos of harvestPositions) cm.set(pos.x, pos.y, 5)
                    }

                    // Get the anchor

                    const anchor: RoomPosition = room.get('anchor')

                    // If the anchor is defined

                    if (anchor) {

                        // Get the upgradePositions, and use the anchor to find the closest upgradePosition to the anchor

                        const upgradePositions: RoomPosition[] = room.get('upgradePositions'),
                        deliverUpgradePos = anchor.findClosestByRange(upgradePositions)

                        // Loop through each pos of upgradePositions, assigning them as prefer to avoid in the cost matrix

                        for (const pos of upgradePositions) {

                            // If the pos and deliverUpgradePos are the same, iterate

                            if (arePositionsEqual(pos, deliverUpgradePos)) continue

                            // Otherwise have the creep prefer to avoid the pos

                            cm.set(pos.x, pos.y, 5)
                        }
                    }
                }

                // Inform the CostMatrix

                return cm
            }
        })

        // If the pathFindResult is incomplete, inform an empty array

        if (pathFinderResult.incomplete) {

            customLog('Incomplete Path', JSON.stringify(opts.origin), constants.colors.white, constants.colors.red)
            room.pathVisual(pathFinderResult.path, constants.colors.red as keyof Colors)
            room.visual.line(opts.origin, opts.goal.pos, { color: constants.colors.red, width: .15, opacity: .3, lineStyle: 'solid' })
            return []
        }

        // Otherwise inform the path from pathFinderResult

        return pathFinderResult.path
    }

    // Call path generation and inform the result

    return generatePath()
}

Room.prototype.findType = function(scoutingRoom: Room) {

    const room = this,
    controller = room.controller

    // Record that the room was scouted this tick

    room.memory.lastScout = Game.time

    // Find the numbers in the room's name

	const [EWstring, NSstring] = room.name.match(/\d+/g),

    // Convert he numbers from strings into actual numbers

    EW = parseInt(EWstring),
    NS = parseInt(NSstring)

    // Use the numbers to deduce some room types - quickly!

	if (EW % 10 == 0 && NS % 10 == 0) {

        room.memory.type = 'intersection'
        return
    }

  	if (EW % 10 == 0 || NS % 10 == 0) {

        room.memory.type = 'highway'
        return
    }

	if (EW % 5 == 0 && NS % 5 == 0) {

        room.memory.type = 'keeperCenter'
        return
    }

	if (Math.abs(5 - EW % 10) <= 1 && Math.abs(5 - NS % 10) <= 1) {

        room.memory.type = 'keeper'
        return
    }

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
            room.memory.owner = controller.owner.username
            room.memory.level = controller.level
            room.memory.powerEnabled = controller.isPowerEnabled
            room.memory.terminal = room.terminal != undefined
            room.memory.storedEnergy = room.findStoredResourceAmount(RESOURCE_ENERGY)
            return
        }

        // Filter sources that have been harvested

        const harvestedSources = room.find(FIND_SOURCES).filter(source => source.ticksToRegeneration > 0)

        if (isReservedRemote()) return

        function isReservedRemote(): boolean {

            // If there is no reservation inform false

            if (!controller.reservation) return false

            // Get roads

            const roads: StructureRoad[] = room.get('road'),

            // Get containers

            containers: StructureContainer[] = room.get('container')

            // If there are roads or containers or sources harvested, inform false

            if (roads.length == 0 && containers.length == 0 && !harvestedSources) return false

            // If the controller is not reserved by an ally

            if (!constants.allyList.has(controller.reservation.username)) {

                // If the reserver is an Invader, inform false

                if (controller.reservation.username == 'Invader') return false

                // Set type to enemyRemote and inform true

                room.memory.type = 'enemyRemote'
                room.memory.owner = controller.reservation.username
                return true
            }

            // Otherwise if the room is reserved by an ally

            // Set type to allyRemote and inform true

            room.memory.type = 'allyRemote'
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

                    if (constants.allyList.has(creep.owner.username)) {

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

        const distanceFromScoutingRoom = advancedFindDistance(scoutingRoom.name, room.name,
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

            // Assign the room's commune as the scoutingRoom

            room.memory.commune = scoutingRoom.name

            // Add the room's name to the scoutingRoom's remotes list

            if (!scoutingRoom.memory.remotes.includes(room.name)) scoutingRoom.memory.remotes.push(room.name)

            // Construct sourceEfficacies

            room.memory.sourceEfficacies = []

            // Get base planning data

            const /* roadCM: CostMatrix = room.get('roadCM'),
            structurePlans: CostMatrix = room.get('structurePlans'),
 */

            // Get the hubAnchor, stopping if it's undefined

            hubAnchor: RoomPosition = global[scoutingRoom.name].stampAnchors?.hub[0]
            if (!hubAnchor) return

            // Get the room's sourceNames

            const sourceNames: ('source1' | 'source2')[] = ['source1', 'source2']

            // Construct the sourceIndex

            let sourceIndex = 0

            // loop through sourceNames

            for (const sourceName of sourceNames) {

                // Get the source using sourceName, iterating if undefined

                const source: Source = room.get(sourceName)
                if (!source) continue

                // Path from the centerUpgradePos to the closestHarvestPos

                const path = room.advancedFindPath({
                    origin: source.pos,
                    goal: { pos: hubAnchor, range: 2 },
                    /* weightCostMatrixes: [roadCM] */
                })

                // Record the length of the path in the room's memory

                room.memory.sourceEfficacies[sourceIndex] = path.length

                /*
                // Loop through positions of the path

                for (const pos of path) {

                    // Record the pos in roadCM

                    roadCM.set(pos.x, pos.y, 1)

                    // Plan for a road at this position

                    structurePlans.set(pos.x, pos.y, constants.structureTypesByNumber[STRUCTURE_ROAD])
                } */

                // Increment the sourceIndex

                sourceIndex++
            }

            // Stop

            return
        }

        // Set type to neutral and stop

        room.memory.type = 'neutral'
        return
    }
/*
    // If there is no controller

    // Get keeperLair

    const keeperLairs = room.get('keeperLair')

    // If there are keeperLairs

    if (keeperLairs.length > 0) {

        // Set type to keeper and stop

        room.memory.type = 'keeper'
        return
    }

    // If there are sources

    if (room.find(FIND_SOURCES).length > 0) {

        // Set type to keeperCenter and stop

        room.memory.type = 'keeperCenter'
        return
    }

    // If there are portals

    if (room.get('portal').length > 0) {

        // Set type to intersection and stop

        room.memory.type = 'intersection'
        return
    }

    // Set type to highway and stop

    room.memory.type == 'highway'
    return */
}

Room.prototype.cleanMemory = function() {

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

    // If room.storedResources doesn't exist, construct it

    if (!room.storedResources) room.storedResources = {}

    // Otherwise if there is already data about the storedResources, inform it

    else if (room.storedResources[resourceType]) return room.storedResources[resourceType]

    // Otherwise construct the number for this stored resource

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

        // Set the task from tasks without responders, or if undefined, from tasksWithResponders

        const task: RoomTask = global[room.name].tasksWithoutResponders[taskID] || global[room.name].tasksWithResponders[taskID]

        // If the task isn't defined, iterate

        if (!task) continue

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

Room.prototype.distanceTransform = function(enableVisuals, x1 = constants.roomDimensions, y1 = constants.roomDimensions, x2 = -1, y2 = -1) {

    const room = this

    // Use a costMatrix to record distances. Use the initialCM if provided, otherwise create one

    const distanceCM = new PathFinder.CostMatrix(),

    // Get the room terrain

    terrain = room.getTerrain()

    // Loop through the xs and ys inside the bounds

    for (let x = x1; x <= x2; x++) {
        for (let y = y1; y <= y2; y++) {

            // If the pos is a wall, iterate

            if (terrain.get(x, y) == TERRAIN_MASK_WALL) continue

            // Otherwise construct a rect and get the positions in a range of 1

            const adjacentPositions = findPositionsInsideRect(x - 1, y - 1, x + 1, y + 1)

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

    // Loop through the xs and ys inside the bounds

    for (let x = x2; x >= x1; x--) {
        for (let y = y2; y >= y1; y--) {

            // If the pos is a wall, iterate

            if (terrain.get(x, y) == TERRAIN_MASK_WALL) continue

            // Otherwise construct a rect and get the positions in a range of 1

            const adjacentPositions = findPositionsInsideRect(x - 1, y - 1, x + 1, y + 1)

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

    // Loop through each x and y in the room

    for (let x = 0; x < constants.roomDimensions; x++) {
        for (let y = 0; y < constants.roomDimensions; y++) {

            // Iterate if pos is to be avoided

            if (distanceCM.get(x, y) == 255) continue

            // Otherwise construct a rect and get the positions in a range of 1 (not diagonals)

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

    const floodCM = new PathFinder.CostMatrix(),

    // Get the terrain cost matrix

    terrain = room.getTerrain(),

    // Construct a cost matrix for visited tiles and add seeds to it

    visitedCM = new PathFinder.CostMatrix()

    // Construct values for the flood

    let depth = 0,

    thisGeneration: Pos[] = seeds,

    nextGeneration: Pos[] = []

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

            const adjacentPositions = findPositionsInsideRect(pos.x - 1, pos.y - 1, pos.x + 1, pos.y + 1)

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

Room.prototype.findClosestPosOfValue = function(opts) {

    const room = this

    //

    function isViableAnchor(pos: Pos): boolean {

        // Get the value of the pos

        const posValue = opts.CM.get(pos.x, pos.y)

        // If the value is to avoid, inform false

        if (posValue == 255) return false

        // If the posValue is less than the requiredValue, inform false

        if (posValue < opts.requiredValue) return false

        // If adjacentToRoads is a requirement

        if (opts.adjacentToRoads) {

            // Construct a rect and get the positions in a range of 1

            const adjacentPositions = findPositionsInsideRect(pos.x - 1, pos.y - 1, pos.x + 1, pos.y + 1)

            // Construct a default no for nearby roads

            let nearbyRoad = false

            // Loop through adjacent positions

            for (const adjacentPos of adjacentPositions) {

                // If the adjacentPos isn't a roadPosition, iterate

                if (opts.roadCM.get(adjacentPos.x, adjacentPos.y) != 1) continue

                // Otherwise set nearbyRoad to true and stop the loop

                nearbyRoad = true
                break
            }

            // If nearbyRoad is false, inform false

            if (!nearbyRoad) return false
        }

        // Inform true

        return true
    }

    // Construct a cost matrix for visited tiles and add seeds to it

    const visitedCM = new PathFinder.CostMatrix()

    // Record startPos as visited

    visitedCM.set(opts.startPos.x, opts.startPos.y, 1)

    // Construct values for the check

    let thisGeneration: Pos[] = [opts.startPos],
    nextGeneration: Pos[] = [],
    canUseWalls = true

    // Get the room's terrain

    const terrain = room.getTerrain()

    // So long as there are positions in this gen

    while (thisGeneration.length) {

        // Reset nextGeneration

        nextGeneration = []

        // Iterate through positions of this gen

        for (const pos of thisGeneration) {

            // If the pos can be an anchor, inform it

            if (isViableAnchor(pos)) return room.newPos(pos)

            // Otherwise construct a rect and get the positions in a range of 1 (not diagonals)

            const adjacentPositions = [
                {
                    x: pos.x - 1,
                    y: pos.y
                },
                {
                    x: pos.x + 1,
                    y: pos.y
                },
                {
                    x: pos.x,
                    y: pos.y - 1
                },
                {
                    x: pos.x,
                    y: pos.y + 1
                },
            ]

            // Loop through adjacent positions

            for (const adjacentPos of adjacentPositions) {

                // Iterate if the pos doesn't map onto a room

                if (adjacentPos.x < 0 || adjacentPos.x >= constants.roomDimensions ||
                    adjacentPos.y < 0 || adjacentPos.y >= constants.roomDimensions) continue

                // Iterate if the adjacent pos has been visited or isn't a tile

                if (visitedCM.get(adjacentPos.x, adjacentPos.y) == 1) continue

                // Otherwise record that it has been visited

                visitedCM.set(adjacentPos.x, adjacentPos.y, 1)

                // If canUseWalls is enabled and the terrain isnt' a wall, disable canUseWalls

                if (canUseWalls && terrain.get(adjacentPos.x, adjacentPos.y) != TERRAIN_MASK_WALL) canUseWalls = false

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

    // Loop through structuretypes of the build priority

    for (const structureType of constants.structureTypesByBuildPriority) {

        // Get the structures with the relevant type

        const cSitesOfType: ConstructionSite[] = room.get(`${structureType}CSite`)

        // If there are no cSites of this type, iterate

        if (!cSitesOfType.length) continue

        // Ptherwise get the anchor, using the creep's pos if undefined, or using the center of the room if there is no creep

        const anchor: RoomPosition = room.get('anchor') || creep?.pos || new RoomPosition(25, 25, room.name)

        // Record the closest site to the anchor in the room's global and inform true

        global[room.name].cSiteTargetID = anchor.findClosestByRange(cSitesOfType).id
        return true
    }

    // If no cSiteTarget was found, inform false

    return false
}

Room.prototype.findRepairTargets = function(workPartCount, excludedIDs = new Set()) {

    const room = this,

    // Get roads and containers in the room

    possibleRepairTargets: (StructureRoad | StructureContainer)[] = room.get('road').concat(room.get('container'))

    // Inform filtered possibleRepairTargets

    return possibleRepairTargets.filter(function(structure) {

        // If the structure's ID is to be excluded, inform false

        if (excludedIDs.has(structure.id)) return false

        // Otherwise if the structure is somewhat low on hits, inform true

        return structure.hitsMax - structure.hits >= workPartCount * REPAIR_POWER
    })
}

Room.prototype.groupRampartPositions = function(rampartPositions) {

    const room = this

    // Get base planning data

    const rampartPlans: CostMatrix = room.get('rampartPlans'),

    // Construct a costMatrix to store visited positions

    visitedCM = new PathFinder.CostMatrix(),

    // Construct storage of position groups

    groupedPositions: RoomPosition[][] = []

    // Construct the groupIndex

    let groupIndex = 0

    // Loop through each pos of positions

    for (const pos of rampartPositions) {

        // If the pos has already been visited, iterate

        if (visitedCM.get(pos.x, pos.y) == 1) continue

        // Record that this pos has been visited

        visitedCM.set(pos.x, pos.y, 1)

        // Construct the group for this index with the pos in it the group

        groupedPositions[groupIndex] = [room.newPos(pos)]

        // Construct values for floodFilling

        let thisGeneration: Pos[] = [pos],

        nextGeneration: Pos[] = []

        // So long as there are positions in this gen

        while (thisGeneration.length) {

            // Reset next gen

            nextGeneration = []

            // Iterate through positions of this gen

            for (const pos of thisGeneration) {

                // Construct a rect and get the positions in a range of 1 (not diagonals)

                const adjacentPositions = [
                    {
                        x: pos.x - 1,
                        y: pos.y
                    },
                    {
                        x: pos.x + 1,
                        y: pos.y
                    },
                    {
                        x: pos.x,
                        y: pos.y - 1
                    },
                    {
                        x: pos.x,
                        y: pos.y + 1
                    },
                ]

                // Loop through adjacent positions

                for (const adjacentPos of adjacentPositions) {

                    // Iterate if adjacentPos is out of room bounds

                    if (adjacentPos.x <= 0 ||
                        adjacentPos.x >= constants.roomDimensions ||
                        adjacentPos.y <= 0 ||
                        adjacentPos.y >= constants.roomDimensions) continue

                    // Iterate if the adjacent pos has been visited or isn't a tile

                    if (visitedCM.get(adjacentPos.x, adjacentPos.y) == 1) continue

                    // Otherwise record that it has been visited

                    visitedCM.set(adjacentPos.x, adjacentPos.y, 1)

                    // If a rampart is not planned for this position, iterate

                    if (rampartPlans.get(adjacentPos.x, adjacentPos.y) != 1) continue

                    // Add it to the next gen and this group

                    nextGeneration.push(adjacentPos)
                    groupedPositions[groupIndex].push(new RoomPosition(adjacentPos.x, adjacentPos.y, room.name))
                }
            }

            // Set this gen to next gen

            thisGeneration = nextGeneration
        }

        // Increase the groupIndex

        groupIndex++
    }

    // Inform groupedPositions

    return groupedPositions
}

Room.prototype.advancedConstructStructurePlans = function() {

    const room = this,

    // Get structurePlans

    structurePlans: CostMatrix = room.get('structurePlans'),

    // Get the terrain cost matrix

    terrain = room.getTerrain(),

    // Construct a cost matrix for visited tiles and add seeds to it

    visitedCM = new PathFinder.CostMatrix(),

    // Get the room's anchor, stopping if it's undefined

    anchor: RoomPosition = room.get('anchor')
    if (!anchor) return

    // Move the anchor to the top left of the fastFill

    const adjustedAnchor = {
        x: anchor.x - 1,
        y: anchor.y - 1
    }

    // Record the anchor as visited

    visitedCM.set(adjustedAnchor.x, adjustedAnchor.y, 1)

    // Construct values for the flood

    let thisGeneration: Pos[] = [adjustedAnchor],

    nextGeneration: Pos[] = []

    // So long as there are positions in this gen

    while (thisGeneration.length) {

        // Reset next gen

        nextGeneration = []

        // Iterate through positions of this gen

        for (const pos of thisGeneration) {

            // Iterate if the terrain is a wall

            if (terrain.get(pos.x, pos.y) == TERRAIN_MASK_WALL) continue

            // Plan structures for this pos

            planPos()

            function planPos() {

                // Get the planned value for this pos

                const plannedValue = structurePlans.get(pos.x, pos.y)

                // If there are structures planned for this pos

                if (plannedValue == 0) return

                // Otherwise so long as the pos isn't a wall, try to build a structure

                const structureType = constants.numbersByStructureTypes[plannedValue]

                // If the structureType is empty, iterate

                if (structureType == 'empty') return

                // Display visuals if enabled

                /* if (Memory.roomVisuals) room.visual.structure(pos.x, pos.y, structureType, {
                    opacity: 0.5
                }) */

                // If the structureType is a road and RCL 3 extensions aren't built, iterate

                if (structureType == STRUCTURE_ROAD && room.energyCapacityAvailable < 800) return

                // Create a road site at this pos

                room.createConstructionSite(pos.x, pos.y, structureType)
            }

            // Otherwise construct a rect and get the positions in a range of 1 (not diagonals)

            const adjacentPositions = [
                {
                    x: pos.x - 1,
                    y: pos.y
                },
                {
                    x: pos.x + 1,
                    y: pos.y
                },
                {
                    x: pos.x,
                    y: pos.y - 1
                },
                {
                    x: pos.x,
                    y: pos.y + 1
                },
            ]

            // Loop through adjacent positions

            for (const adjacentPos of adjacentPositions) {

                // Iterate if the pos doesn't map onto a room

                if (adjacentPos.x < 0 || adjacentPos.x >= constants.roomDimensions ||
                    adjacentPos.y < 0 || adjacentPos.y >= constants.roomDimensions) continue

                // Iterate if the adjacent pos has been visited or isn't a tile

                if (visitedCM.get(adjacentPos.x, adjacentPos.y) == 1) continue

                // Otherwise record that it has been visited

                visitedCM.set(adjacentPos.x, adjacentPos.y, 1)

                // Add it to the next gen

                nextGeneration.push(adjacentPos)
            }
        }

        // Set this gen to next gen

        thisGeneration = nextGeneration
    }

    // If visuals are enabled, visually connect roads

    if (Memory.roomVisuals) room.visual.connectRoads()
}

Room.prototype.createPullTask = function(creator) {

    const room = this


}

Room.prototype.createPickupTasks = function(creator) {

    const room = this


}

Room.prototype.createOfferTasks = function(creator) {

    const room = this


}

Room.prototype.createTransferTasks = function(creator) {

    const room = this


}

Room.prototype.createWithdrawTasks = function(creator) {

    const room = this


}

Room.prototype.estimateIncome = function() {

    const room = this

    // Construct income starting at 0

    let income = 0

    // Loop through each creepName with a role of sourceHarvester from this room

    for (const creepName of room.creepsFromRoom.sourceHarvester) {

        // Get the creep using creepName

        const creep = Game.creeps[creepName]

        // Add the number of work parts owned by the creep at a max of 5, times harvest power

        income += Math.min(5, creep.partsOfType(WORK)) * HARVEST_POWER
    }

    // Loop through each creepName with a role of remoteHarvester from this room

    for (const creepName of room.creepsFromRoom.remoteHarvester) {

        // Get the creep using creepName

        const creep = Game.creeps[creepName]

        // Add the number of work parts owned by the creep at a max of 5, times harvest power

        income += Math.min(5, creep.partsOfType(WORK)) * HARVEST_POWER * 0.8
    }

    // Inform income

    return income
}

Room.prototype.findRoomPositionsInsideRect = function(x1, y1, x2, y2) {

    const room = this,

    // Construct positions

    positions: RoomPosition[] = []

    // Loop through coordinates inside the rect

    for (let x = x1; x <= x2; x++) {
        for (let y = y1; y <= y2; y++) {

            // Iterate if the pos doesn't map onto a room

            if (x < 0 || x >= constants.roomDimensions ||
                y < 0 || y >= constants.roomDimensions) continue

            // Otherwise ass the x and y to positions

            positions.push(new RoomPosition(x, y, room.name))
        }
    }

    // Inform positions

    return positions
}
