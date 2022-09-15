import { unpackPosList } from 'other/packrat'
import { minHarvestWorkRatio, myColors, remoteHarvesterRoles, RemoteNeeds } from './constants'
import { customLog, unpackAsRoomPos } from './generalFunctions'
import { InternationalManager } from './internationalManager'

InternationalManager.prototype.mapVisualsManager = function () {
    // Stop if mapVisuals are disabled

    if (!Memory.mapVisuals) return

    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    // Loop through each roomName in Memory

    for (const roomName in Memory.rooms) {
        // Get the roomMemory using the roomName

        const roomMemory = Memory.rooms[roomName]

        Game.map.visual.text(roomMemory.T, new RoomPosition(2, 45, roomName), {
            align: 'left',
            fontSize: 5,
        })

        if (roomMemory.T === 'commune') {
            const room = Game.rooms[roomName]
            if (!room) continue

            Game.map.visual.text(
                `⚡${room.findStoredResourceAmount(RESOURCE_ENERGY)}`,
                new RoomPosition(2, 8, roomName),
                {
                    align: 'left',
                    fontSize: 8,
                },
            )

            if (roomMemory.claimRequest) {
                Game.map.visual.line(
                    room.anchor || new RoomPosition(25, 25, roomName),
                    new RoomPosition(25, 25, roomMemory.claimRequest),
                    {
                        color: myColors.lightBlue,
                        width: 1.2,
                        opacity: 0.3,
                    },
                )
            }

            if (roomMemory.allyCreepRequest) {
                Game.map.visual.line(
                    room.anchor || new RoomPosition(25, 25, roomName),
                    new RoomPosition(25, 25, roomMemory.allyCreepRequest),
                    {
                        color: myColors.green,
                        width: 1.2,
                        opacity: 0.3,
                    },
                )
            }

            if (roomMemory.attackRequests.length) {
                for (const requestName of roomMemory.attackRequests) {
                    Game.map.visual.line(
                        room.anchor || new RoomPosition(25, 25, roomName),
                        new RoomPosition(25, 25, requestName),
                        {
                            color: myColors.red,
                            width: 1.2,
                            opacity: 0.3,
                        },
                    )
                }
            }

            continue
        }

        if (roomMemory.T === 'remote') {
            const commune = Game.rooms[roomMemory.commune]

            if (commune) {

                const possibleReservation = commune.energyCapacityAvailable >= 650

                for (const sourceIndex in roomMemory.SP) {
                    const positions = unpackPosList(roomMemory.SP[sourceIndex])

                    // Draw a line from the center of the remote to the best harvest pos

                    Game.map.visual.line(positions[0], commune.anchor || new RoomPosition(25, 25, commune.name), {
                        color: myColors.yellow,
                        width: 1.2,
                        opacity: 0.3,
                    })

                    // Get the income based on the reservation of the room and remoteHarvester need
                    
                    const income =
                        (possibleReservation ? 10 : 5) -
                        Math.floor(roomMemory.needs[RemoteNeeds[remoteHarvesterRoles[sourceIndex]]] * minHarvestWorkRatio)

                    Game.map.visual.text(
                        `⛏️${income},🚶‍♀️${roomMemory.SE[sourceIndex]}`,
                        new RoomPosition(positions[0].x, positions[0].y, roomName),
                        {
                            align: 'center',
                            fontSize: 5,
                        },
                    )
                }
            }

            if (roomMemory.abandoned) {
                Game.map.visual.text(`❌${roomMemory.abandoned.toString()}`, new RoomPosition(2, 16, roomName), {
                    align: 'left',
                    fontSize: 8,
                })
            }

            continue
        }

        if (roomMemory.notClaimable) {
            Game.map.visual.circle(new RoomPosition(25, 25, roomName), {
                stroke: myColors.red,
                strokeWidth: 2,
                fill: 'transparent',
            })
            continue
        }
    }

    for (const roomName in Memory.claimRequests) {
        Game.map.visual.text(
            `💵${Memory.claimRequests[roomName].score.toFixed(2)}`,
            new RoomPosition(2, 24, roomName),
            {
                align: 'left',
                fontSize: 8,
            },
        )
    }

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.CPULogging)
        customLog(
            'Map Visuals Manager',
            (Game.cpu.getUsed() - managerCPUStart).toFixed(2),
            undefined,
            myColors.lightGrey,
        )
}
