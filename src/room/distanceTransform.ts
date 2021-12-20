import { constants } from '../international/constants'

/**
 * Finds open spaces in a room
 */
export function distanceTransform(room: Room) {

    const terrain = room.getTerrain()

    // Create a CostMatrix for terrain types

    const terrainCM = new PathFinder.CostMatrix()

    // Construct positions

    let x = 0
    let y = 0
    
    // Iterate through

    for (x = 0; x < constants.roomDimensions; x++) {
        for (y = 0; y < constants.roomDimensions; y++) {

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

    //

    const distanceCM = new PathFinder.CostMatrix()

    console.log(JSON.stringify(terrainCM))
}
