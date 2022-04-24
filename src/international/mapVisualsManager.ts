import { constants } from "./constants"
import { InternationalManager } from "./internationalManager"

InternationalManager.prototype.mapVisualsManager = function() {

    // Stop if mapVisuals are disabled

    if (!Memory.mapVisuals) return

    // Loop through each roomName in Memory

    for (const roomName in Memory.rooms) {

        // Get the roomMemory using the roomName

        const roomMemory = Memory.rooms[roomName]

        if (roomMemory.type === 'commune') {


            if (roomMemory.claimRequest) {

                Game.map.visual.line(new RoomPosition(25, 25, roomName), new RoomPosition(25, 25, roomMemory.claimRequest), {
                    color: constants.colors.lightBlue, width: 1.2, opacity: .5, lineStyle: 'dashed'
                })
            }
            continue
        }

        if (roomMemory.type === 'remote') {

            // Draw a line from the center of the remote to the center of its commune

            Game.map.visual.line(new RoomPosition(25, 25, roomName), new RoomPosition(25, 25, roomMemory.commune), {
                color: constants.colors.yellow, width: 1.2, opacity: .5, lineStyle: 'dashed'
            })

            continue
        }

        if (roomMemory.notClaimable) {

            Game.map.visual.circle(new RoomPosition(25, 25, roomName), {
                stroke: constants.colors.red, strokeWidth: 1
            })
            continue
        }
    }

    for (const roomName in Memory.claimRequests) {

        Game.map.visual.text(Memory.claimRequests[roomName].score.toString(), new RoomPosition(25, 25, roomName), {

        })
    }
}
