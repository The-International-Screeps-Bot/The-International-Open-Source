import { RoomMemoryKeys, packedPosLength, stamps } from 'international/constants'
import { customLog, findCarryPartsRequired } from 'international/utils'
import { CommuneManager } from './commune'

export class HaulerNeedManager {
    communeManager: CommuneManager
    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {
        const { room } = this.communeManager

        this.sourceNeed()
        this.controllerNeed()

        room.haulerNeed += findCarryPartsRequired(
            room.memory[RoomMemoryKeys.mineralPath].length / packedPosLength + 3,
            room.mineralHarvestStrength * 1.1,
        )
        room.haulerNeed += room.roomManager.structures.lab.length

        const extensions =
            room.roomManager.structures.extension.length - stamps.fastFiller.structures.extension.length
        if (extensions > 0) {
            room.roomManager.structures.extension.length / (room.towerInferiority ? 1.5 : 4)
        }

        /* room.haulerNeed += room.roomManager.structures.extension.length / 10 */

        if ((room.controller.level >= 4 && room.storage) || (room.terminal && room.controller.level >= 6)) {
            room.haulerNeed += Memory.stats.rooms[room.name].eosp / 10
            room.haulerNeed += Memory.stats.rooms[room.name].su * 8
        }

        room.haulerNeed = Math.round(room.haulerNeed)
    }

    private sourceNeed() {
        const { room } = this.communeManager

        if (room.hubLink && room.hubLink.RCLActionable) {
            for (let index in room.find(FIND_SOURCES)) {
                const sourceLink = room.communeManager.sourceLinks[index]
                if (sourceLink && sourceLink.RCLActionable) continue

                room.haulerNeed += findCarryPartsRequired(
                    room.roomManager.communeSourceHarvestPositions[index].length + 3,
                    room.estimatedSourceIncome[index] * 1.1,
                )
            }

            return
        }

        // No valid hubLink

        for (let index in room.find(FIND_SOURCES)) {
            const sourceLink = room.communeManager.sourceLinks[index]
            if (sourceLink && sourceLink.RCLActionable) continue

            room.haulerNeed += findCarryPartsRequired(
                room.roomManager.communeSourcePaths[index].length + 3,
                room.estimatedSourceIncome[index] * 1.1,
            )
        }
    }

    private controllerNeed() {
        const { room } = this.communeManager

        if (room.controller.level < 2) return

        // There is a viable controllerContainer

        if (room.controllerContainer) {
            room.haulerNeed += findCarryPartsRequired(
                room.memory[RoomMemoryKeys.upgradePath].length / packedPosLength + 3,
                room.upgradeStrength * 1.1,
            )
            return
        }

        // There is a viable controllerLink but we need to haul to it

        if (
            this.communeManager.controllerLink &&
            this.communeManager.controllerLink.RCLActionable &&
            (!room.hubLink || !room.hubLink.RCLActionable)
        ) {
            room.haulerNeed += findCarryPartsRequired(
                room.memory[RoomMemoryKeys.upgradePath].length / packedPosLength + 3,
                room.upgradeStrength * 1.1,
            )
            return
        }
    }
}
