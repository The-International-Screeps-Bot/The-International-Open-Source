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

    placeBase()

    function placeBase() {

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

        const distanceCM = room.distanceTransform(baseCM)

        /* generalFuncs.customLog('DCM', JSON.stringify(distanceCM)) */
    }
}
