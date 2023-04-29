import { customLog, makeRoomCoord, randomTick, roomNameFromRoomXY } from 'international/utils'
import { CommuneManager } from './commune'
import { RoomMemoryKeys } from 'international/constants'

export class ObserverManager {
    communeManager: CommuneManager
    scoutTarget: string
    observer: StructureObserver

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    preTickRun() {
        // Run only every so often

        if (!randomTick()) return

        this.observer = this.communeManager.room.roomManager.structures.observer[0]
        if (!this.observer) return

        this.findScoutTarget()
        if (!this.scoutTarget) return

        this.observer.observeRoom(this.scoutTarget)
    }

    findScoutTarget() {
        const roomCoord = makeRoomCoord(this.communeManager.room.name)

        let highestScore = 0

        let x1 = roomCoord.x - 10
        let y1 = roomCoord.y - 10
        let x2 = roomCoord.x + 10
        let y2 = roomCoord.y + 10

        for (let x = x1; x <= x2; x += 1) {
            for (let y = y1; y <= y2; y += 1) {
                const roomName = roomNameFromRoomXY(x, y)

                // Ensure the statuses are the same

                if (
                    Game.map.getRoomStatus(roomName).status !==
                    Game.map.getRoomStatus(this.communeManager.room.name).status
                )
                    continue

                let score

                if (!Memory.rooms[roomName]) {
                    score =
                        (OBSERVER_RANGE - Game.map.getRoomLinearDistance(roomName, this.communeManager.room.name)) *
                        1000
                } else {
                    score =
                        Game.time -
                        (Memory.rooms[roomName][RoomMemoryKeys.lastScout] || 0) +
                        (OBSERVER_RANGE - Game.map.getRoomLinearDistance(roomName, this.communeManager.room.name)) * 10
                }

                if (score <= highestScore) continue

                highestScore = score
                this.scoutTarget = roomName
            }
        }
    }
}
