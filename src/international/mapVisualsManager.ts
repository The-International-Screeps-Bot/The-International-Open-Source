import { constants } from "./constants"
import { unpackAsRoomPos } from "./generalFunctions"
import { InternationalManager } from "./internationalManager"

InternationalManager.prototype.mapVisualsManager = function() {

    // Stop if mapVisuals are disabled

    if (!Memory.mapVisuals) return

    // Loop through each roomName in Memory

    for (const roomName in Memory.rooms) {

        // Get the roomMemory using the roomName

        const roomMemory = Memory.rooms[roomName]

        Game.map.visual.text(roomMemory.type, new RoomPosition(constants.roomDimensions - 2, 10, roomName), {
            align: 'right',
            fontSize: 5,
        })

        if (roomMemory.type === 'commune') {

            const room = Game.rooms[roomName]
            if (!room) continue

            Game.map.visual.text('⚡' + room.findStoredResourceAmount(RESOURCE_ENERGY), new RoomPosition(2, 10, roomName), {
                align: 'left',
                fontSize: 8,
            })

            if (roomMemory.claimRequest) {

                Game.map.visual.line(room.anchor || new RoomPosition(25, 25, roomName), new RoomPosition(25, 25, roomMemory.claimRequest), {
                    color: constants.colors.lightBlue, width: 1.2, opacity: .5, lineStyle: 'dashed'
                })
            }
            continue
        }

        if (roomMemory.type === 'remote') {

            const commune = Game.rooms[roomMemory.commune]

            if (commune) {

                // Draw a line from the center of the remote to the center of its commune

                Game.map.visual.line(new RoomPosition(25, 25, roomName), commune.anchor || new RoomPosition(25, 25, roomMemory.commune), {
                    color: constants.colors.yellow, width: 1.2, opacity: .5, lineStyle: 'dashed'
                })
            }

            Game.map.visual.text('⛏️' + roomMemory.sourceEfficacies.reduce((sum, el) => sum + el, 0).toString(), new RoomPosition(2, 10, roomName), {
                align: 'left',
                fontSize: 8,
            })

            if (roomMemory.abandoned) {

                Game.map.visual.text('❌' + roomMemory.abandoned.toString(), new RoomPosition(2, 18, roomName), {
                    align: 'left',
                    fontSize: 8,
                })
            }

            continue
        }

        if (roomMemory.notClaimable) {

            Game.map.visual.circle(new RoomPosition(25, 25, roomName), {
                stroke: constants.colors.red, strokeWidth: 2, fill: 'transparent'
            })
            continue
        }
    }

    for (const roomName in Memory.claimRequests) {

        Game.map.visual.text('💵' + Memory.claimRequests[roomName].score.toFixed(2), new RoomPosition(2, 26, roomName), {
            align: 'left',
            fontSize: 8,
        })
    }
}
