import { unpackPosList } from 'other/codec'
import { minHarvestWorkRatio, customColors, remoteHarvesterRoles, RemoteData, ClaimRequestData } from './constants'
import {
    customLog,
    findRoomNamesInRangeXY,
    findRoomNamesInsideRect,
    makeRoomCoord,
    roomNameFromRoomCoord,
} from './utils'
import { InternationalManager } from './international'
import { globalStatsUpdater } from './statsManager'

/**
 * Adds colours and annotations to the map if mapVisuals are enabled
 */
class MapVisualsManager {
    run() {
        if (!Memory.mapVisuals) return

        for (const roomName in Memory.rooms) {
            const roomMemory = Memory.rooms[roomName]

            // Room type

            Game.map.visual.text(roomMemory.T, new RoomPosition(2, 45, roomName), {
                align: 'left',
                fontSize: 5,
            })

            this.test(roomName, roomMemory)

            if (roomMemory.T === 'commune') {
                const room = Game.rooms[roomName]
                if (!room) continue

                Game.map.visual.text(
                    `⚡${room.resourcesInStoringStructures.energy} / ${room.communeManager.minStoredEnergy}`,
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
                            color: customColors.lightBlue,
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
                            color: customColors.green,
                            width: 1.2,
                            opacity: 0.3,
                        },
                    )
                }

                if (roomMemory.combatRequests.length) {
                    for (const requestName of roomMemory.combatRequests) {
                        Game.map.visual.line(
                            room.anchor || new RoomPosition(25, 25, roomName),
                            new RoomPosition(25, 25, requestName),
                            {
                                color: customColors.red,
                                width: 1.2,
                                opacity: 0.3,
                            },
                        )
                    }
                }

                continue
            }

            if (roomMemory.T === 'remote') {
                const commune = Game.rooms[roomMemory.CN]

                if (commune) {
                    const possibleReservation = commune.energyCapacityAvailable >= 650

                    for (const sourceIndex in roomMemory.SP) {
                        const positions = unpackPosList(roomMemory.SP[sourceIndex])

                        // Draw a line from the center of the remote to the best harvest pos

                        Game.map.visual.line(positions[0], commune.anchor || new RoomPosition(25, 25, commune.name), {
                            color: customColors.yellow,
                            width: 1.2,
                            opacity: 0.3,
                        })

                        // Get the income based on the reservation of the room and remoteHarvester need

                        const income =
                            (possibleReservation ? 10 : 5) -
                            Math.floor(
                                roomMemory.data[RemoteData[remoteHarvesterRoles[sourceIndex]]] * minHarvestWorkRatio,
                            )

                        Game.map.visual.text(
                            `⛏️${income},🚶‍♀️${roomMemory.SPs[sourceIndex].length}`,
                            new RoomPosition(positions[0].x, positions[0].y, roomName),
                            {
                                align: 'center',
                                fontSize: 5,
                            },
                        )
                    }
                }

                if (roomMemory.data[RemoteData.abandon]) {
                    Game.map.visual.text(
                        `❌${roomMemory.data[RemoteData.abandon].toString()}`,
                        new RoomPosition(2, 16, roomName),
                        {
                            align: 'left',
                            fontSize: 8,
                        },
                    )
                }

                continue
            }

            if (roomMemory.NC) {
                Game.map.visual.circle(new RoomPosition(25, 25, roomName), {
                    stroke: customColors.red,
                    strokeWidth: 2,
                    fill: 'transparent',
                })
                continue
            }
        }

        this.claimRequests()
    }
    private claimRequests() {
        for (const roomName in Memory.claimRequests) {
            Game.map.visual.text(
                `💵${(Memory.claimRequests[roomName].data[ClaimRequestData.score] || 0).toFixed(2)}`,
                new RoomPosition(2, 24, roomName),
                {
                    align: 'left',
                    fontSize: 8,
                },
            )

            if (Memory.claimRequests[roomName].data[ClaimRequestData.abandon]) {
                Game.map.visual.text(
                    `❌${Memory.claimRequests[roomName].data[ClaimRequestData.abandon].toString()}`,
                    new RoomPosition(2, 16, roomName),
                    {
                        align: 'left',
                        fontSize: 8,
                    },
                )
            }
        }
    }
    private test(roomName: string, roomMemory: RoomMemory) {
        /*
        Game.map.visual.text((Game.time - roomMemory.LST).toString(), new RoomPosition(2, 40, roomName), {
            align: 'left',
            fontSize: 5,
        })
        */
        /*
        const roomCoord = makeRoomCoord(roomName)
        Game.map.visual.text(('x: ' + roomCoord.x + ', y: ' + roomCoord.y).toString(), new RoomPosition(2, 40, roomName), {
            align: 'left',
            fontSize: 5,
        })
        */
    }
}

export const mapVisualsManager = new MapVisualsManager()
