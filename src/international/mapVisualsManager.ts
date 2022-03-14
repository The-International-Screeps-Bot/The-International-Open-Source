import { constants } from "./constants"
import { generalFuncs } from "./generalFunctions"

/**
 * Adds colours and annotations to the map if mapVisuals are enabled
 */
export function mapVisualsManager() {

    // Stop if mapVisuals are disabled

    if (!Memory.mapVisuals) return

    // Loop through each roomName in Memory

    for (const roomName in Memory.rooms) {

        // Get the roomMemory using the roomName

        const roomMemory = Memory.rooms[roomName]

        if (roomMemory.type === 'commune') {


            continue
        }

        if (roomMemory.type === 'remote') {

            // Draw a line from the center of the remote to the center of its commune

            Game.map.visual.line(new RoomPosition(25, 25, roomName), new RoomPosition(25, 25, roomMemory.commune), {
                color: constants.colors.lightBlue, width: 1.2, opacity: .5
            })

            continue
        }
    }
}
