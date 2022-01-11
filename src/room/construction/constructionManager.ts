import { constants } from "international/constants"
import { generalFuncs } from "international/generalFunctions"

/**
 * Creates construction sites and deletes structures in a room
 */
export function constructionManager(room: Room) {

    // If the construction site count is at its limit, stop

    if (global.constructionSitesCount == 100) return

    // Stop if placing containers was a success

    placeContainers()

    function placeContainers(): boolean {

        // Construct sourceNames

        const sourceNames: ('source1' | 'source2')[] = [
            'source1',
            'source2'
        ]

        // Iterate through sourceNames

        for (const sourceName of sourceNames) {

            // Try to find the source with the sourceName

            const source: Source = room.get(sourceName)

            // Iterate if there is no resource

            if (!source) continue

            // Try to find an existing sourceContainer for the source

            const sourceContainer = room.get(`${sourceName}Container`)

            // Iterate if there is a sourceContainer

            if (sourceContainer) continue

            // Try to find the closestHarvestPos for the source

            const closestHarvestPos = room.get(`${sourceName}ClosestHarvestPosition`)

            // Iterate if it doesn't exist

            if (!closestHarvestPos) continue

            // Try to place a container on the closestHarvestPos

            room.createConstructionSite(closestHarvestPos, STRUCTURE_CONTAINER)
        }

        return true
    }

    const placeBaseResult = placeBase()

    function placeBase(): BuildObj[] | false {

        // Construct an array of build objects

        const buildObjects: BuildObj[] = []

        // Construct a cost matrix based off terrain cost matrix

        const baseCM = room.get('terrainCM')

        // Record exits and adjacent positions to exits as something to avoid

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

        // Record postions around the controller as unusable

        recordAdjacentPositions(room.controller.pos.x, room.controller.pos.y, 3)

        // Record positions around the mineral as unusable

        const mineral: Mineral = room.get('mineral')
        recordAdjacentPositions(mineral.pos.x, mineral.pos.y, 1)

        // Record the positions around sources as unusable

        const sources: Source[] = room.get('sources')

        for (const source of sources) {

            // Record adjacent positions to avoid

            recordAdjacentPositions(source.pos.x, source.pos.y, 2)
        }

        // Run distance transform with the baseCM

        let distanceCM = room.specialDT(baseCM)

        // Get the sources in the room

        const source1: Source = room.get('source1')
        const source2: Source = room.get('source2')

        // Find the average pos between the sources

        const avgSourcePos = generalFuncs.findAvgBetweenPosotions(source1.pos, source2.pos)

        // Find the average pos between the two sources and the controller

        const avgControllerSourcePos = generalFuncs.findAvgBetweenPosotions(room.controller.pos, avgSourcePos)

        //

        class Stamp {
            constructor() {


            }
        }

        // Define stamp

        let stamp = constants.stamps.fastFiller

        // Get the radius of the stamp

        let stampRadius = stamp.dimensions / 2

        // Try to find an anchor using the distance cost matrix, average pos between controller and sources, with an area able to fit the fastFiller

        const anchor = room.findClosestPosOfValue(distanceCM, avgControllerSourcePos, stampRadius)

        // Top if there is no anchor

        if (!anchor) {

            // Record that the room is not claimable and stop

            room.memory.notClaimable = true
            return false
        }

        // Otherwise add the anchor to the room memory

        room.memory.anchor = anchor

        // Define the offset from the top left of the room

        let offsetX = anchor.x - Math.floor(stamp.dimensions / 2)
        let offsetY = anchor.y - Math.floor(stamp.dimensions / 2)

        // Loop through structure types in fastFiller structures

        for(const structureType in stamp.structures) {

            // Get the positions for this structre type

            const positions = stamp.structures[structureType]

            // Loop through positions

            for (const pos of positions) {

                // Get the proper x and y using the offset and stamp radius

                const x = pos.x + offsetX
                const y = pos.y + offsetY

                // If the structure isn't a road

                if (structureType != STRUCTURE_ROAD) {

                    // Add the pos to the base cost matrix as avoid

                    baseCM.set(x, y, 255)
                }

                // Add the structureType and position info to buildObjects

                buildObjects.push({
                    structureType: structureType,
                    x: x,
                    y: y
                })

                // Display visuals if enabled

                if (Memory.roomVisuals) room.visual.circle(x, y, constants.styleForStructureTypes[structureType])
            }
        }

        // Run distance transform with the baseCM

        distanceCM = room.specialDT(baseCM)

        // Define stamp

        stamp = constants.stamps.hub

        // Get the radius of the stamp

        stampRadius = stamp.dimensions / 2

        // Try to find a stamp anchor

        let stampAnchor = room.findClosestPosOfValue(distanceCM, anchor, stampRadius)


        // Stop if a stamp anchor wasn't found

        if (!stampAnchor) return false

        // Set the hubAnchor as the stamp anchor for the hub

        const hubAnchor = stampAnchor

        // Otherwise fefine the offset from the top left of the room

        offsetX = stampAnchor.x - Math.floor(stamp.dimensions / 2)
        offsetY = stampAnchor.y - Math.floor(stamp.dimensions / 2)

        // Loop through structure types in fastFiller structures

        for(const structureType in stamp.structures) {

            // Get the positions for this structre type

            const positions = stamp.structures[structureType]

            // Loop through positions

            for (const pos of positions) {

                // Get the proper x and y using the offset and stamp radius

                const x = pos.x + offsetX
                const y = pos.y + offsetY

                // If the structure isn't a road

                if (structureType != STRUCTURE_ROAD) {

                    // Add the pos to the base cost matrix as avoid

                    baseCM.set(x, y, 255)
                }

                // Add the structureType and position info to buildObjects

                buildObjects.push({
                    structureType: structureType,
                    x: x,
                    y: y
                })

                // Display visuals if enabled

                if (Memory.roomVisuals) room.visual.circle(x, y, constants.styleForStructureTypes[structureType])
            }
        }

        //

        let i = 0

        while (i < 8) {

            // Run distance transform with the baseCM

            distanceCM = room.specialDT(baseCM)

            // Define stamp

            stamp = constants.stamps.extensions

            // Get the radius of the stamp

            stampRadius = stamp.dimensions / 2

            // Try to find a stamp anchor

            stampAnchor = room.findClosestPosOfValue(distanceCM, hubAnchor, stampRadius)

            // Stop if a stamp anchor wasn't found

            if (!stampAnchor) return false

            // Otherwise fefine the offset from the top left of the room

            offsetX = stampAnchor.x - Math.floor(stamp.dimensions / 2)
            offsetY = stampAnchor.y - Math.floor(stamp.dimensions / 2)

            // Loop through structure types in fastFiller structures

            for(const structureType in stamp.structures) {

                // Get the positions for this structre type

                const positions = stamp.structures[structureType]

                // Loop through positions

                for (const pos of positions) {

                    // Get the proper x and y using the offset and stamp radius

                    const x = pos.x + offsetX
                    const y = pos.y + offsetY

                    // If the structure isn't a road

                    if (structureType != STRUCTURE_ROAD) {

                        // Add the pos to the base cost matrix as avoid

                        baseCM.set(x, y, 255)
                    }

                    // Add the structureType and position info to buildObjects

                    buildObjects.push({
                        structureType: structureType,
                        x: x,
                        y: y
                    })

                    // Display visuals if enabled

                    if (Memory.roomVisuals) room.visual.circle(x, y, constants.styleForStructureTypes[structureType])
                }
            }

            i++
        }

        // Run distance transform with the baseCM

        distanceCM = room.specialDT(baseCM)

        // Define stamp

        stamp = constants.stamps.labs

        // Get the radius of the stamp

        stampRadius = stamp.dimensions / 2

        // Try to find a stamp anchor

        stampAnchor = room.findClosestPosOfValue(distanceCM, hubAnchor, stampRadius)

        // Stop if a stamp anchor wasn't found

        if (!stampAnchor) return false

        // Otherwise fefine the offset from the top left of the room

        offsetX = stampAnchor.x - Math.floor(stamp.dimensions / 2)
        offsetY = stampAnchor.y - Math.floor(stamp.dimensions / 2)

        // Loop through structure types in fastFiller structures

        for(const structureType in stamp.structures) {

            // Get the positions for this structre type

            const positions = stamp.structures[structureType]

            // Loop through positions

            for (const pos of positions) {

                // Get the proper x and y using the offset and stamp radius

                const x = pos.x + offsetX
                const y = pos.y + offsetY

                // If the structure isn't a road

                if (structureType != STRUCTURE_ROAD) {

                    // Add the pos to the base cost matrix as avoid

                    baseCM.set(x, y, 255)
                }

                // Add the structureType and position info to buildObjects

                buildObjects.push({
                    structureType: structureType,
                    x: x,
                    y: y
                })


                // Display visuals if enabled

                if (Memory.roomVisuals) room.visual.circle(x, y, constants.styleForStructureTypes[structureType])
            }
        }

        return buildObjects
    }
}
