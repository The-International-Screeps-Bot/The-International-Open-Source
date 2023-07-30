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

        this.communeManager.haulerNeed += findCarryPartsRequired(
            room.memory[RoomMemoryKeys.mineralPath].length / packedPosLength + 3,
            (this.communeManager.mineralHarvestStrength / EXTRACTOR_COOLDOWN) * 1.1,
        )
        this.communeManager.haulerNeed += room.roomManager.structures.lab.length

        const extensions =
            room.roomManager.structures.extension.length -
            stamps.fastFiller.structures.extension.length
        if (extensions > 0) {
            room.roomManager.structures.extension.length / (room.towerInferiority ? 1.5 : 4)
        }

        /* haulerNeed += room.roomManager.structures.extension.length / 10 */

        if (
            (room.controller.level >= 4 && room.storage) ||
            (room.terminal && room.controller.level >= 6)
        ) {
            this.communeManager.haulerNeed += Memory.stats.rooms[room.name].eosp / 10
            this.communeManager.haulerNeed += Memory.stats.rooms[room.name].su * 8
        }

        this.communeManager.haulerNeed = Math.round(this.communeManager.haulerNeed)
    }

    private sourceNeed() {
        const { room } = this.communeManager

        if (room.hubLink && room.hubLink.RCLActionable) {
            for (let index in room.find(FIND_SOURCES)) {
                const sourceLink = room.communeManager.sourceLinks[index]
                if (sourceLink && sourceLink.RCLActionable) continue

                this.communeManager.haulerNeed += findCarryPartsRequired(
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

            this.communeManager.haulerNeed += findCarryPartsRequired(
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
            this.communeManager.haulerNeed += findCarryPartsRequired(
                room.memory[RoomMemoryKeys.upgradePath].length / packedPosLength + 3,
                this.communeManager.upgradeStrength * 1.1,
            )
            return
        }

        // There is a viable controllerLink but we need to haul to it

        if (
            this.communeManager.controllerLink &&
            this.communeManager.controllerLink.RCLActionable &&
            (!room.hubLink || !room.hubLink.RCLActionable)
        ) {
            this.communeManager.haulerNeed += findCarryPartsRequired(
                room.memory[RoomMemoryKeys.upgradePath].length / packedPosLength + 3,
                this.communeManager.upgradeStrength * 1.1,
            )
            return
        }
    }
}
