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

    /* for (const pos in terrainCM) {

        const rect = { x1: pos.x - 1, y1: pos.1 - 1, x2: pos.x + 1, y2: pos.y + 2}
        const positions = global.findPositionsInsideRect(rect)

        const positionsByValue = positions.sort((a: Pos, b: Pos) => terrainCM.get(a.x, a.y) - terrainCM.get(b.x, b.y))

        positionsByValue.reverse()
    } */
}
