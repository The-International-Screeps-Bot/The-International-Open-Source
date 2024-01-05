import { RoomMemoryKeys, packedPosLength, stamps } from 'international/constants'
import { customLog } from 'utils/logging'
import { findCarryPartsRequired } from 'utils/utils'
import { CommuneManager } from './commune'
import { communeUtils } from './communeUtils'

export class HaulerNeedManager {
    communeManager: CommuneManager
    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {
        const { room } = this.communeManager

        this.sourceNeed()
        this.controllerNeed()

        this.communeManager.communeHaulerNeed += findCarryPartsRequired(
            room.memory[RoomMemoryKeys.mineralPath].length / packedPosLength + 3,
            (this.communeManager.mineralHarvestStrength / EXTRACTOR_COOLDOWN) * 1.1,
        )
        this.communeManager.communeHaulerNeed += room.roomManager.structures.lab.length

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
            this.communeManager.communeHaulerNeed += Memory.stats.rooms[room.name].eosp / 10
            this.communeManager.communeHaulerNeed += Memory.stats.rooms[room.name].su * 8
        }

        this.communeManager.communeHaulerNeed = Math.round(this.communeManager.communeHaulerNeed)
    }

    private sourceNeed() {
        const room = this.communeManager.room
        const packedSourcePaths = Memory.rooms[room.name][RoomMemoryKeys.communeSourcePaths]
        const estimatedSourceIncome = communeUtils.getEstimatedSourceIncome(room)

        const hubLink = room.roomManager.hubLink
        if (hubLink && hubLink.isRCLActionable) {
            // There is a valid hubLink

            for (let index in room.find(FIND_SOURCES)) {
                const sourceLink = room.communeManager.sourceLinks[index]
                if (sourceLink && sourceLink.isRCLActionable) continue

                this.communeManager.communeHaulerNeed += findCarryPartsRequired(
                    packedSourcePaths[index].length / packedPosLength + 3,
                    estimatedSourceIncome[index] * 1.1,
                )
            }

            return
        }

        // There is no valid hubLink

        for (let index in room.find(FIND_SOURCES)) {
            this.communeManager.communeHaulerNeed += findCarryPartsRequired(
                packedSourcePaths[index].length / packedPosLength + 3,
                estimatedSourceIncome[index] * 1.1,
            )
        }
    }

    private controllerNeed() {
        const { room } = this.communeManager

        if (room.controller.level < 2) return

        // There is a viable controllerContainer

        if (room.roomManager.controllerContainer) {
            this.communeManager.communeHaulerNeed += findCarryPartsRequired(
                Memory.rooms[this.communeManager.room.name][RoomMemoryKeys.upgradePath].length /
                    packedPosLength +
                    3,
                this.communeManager.upgradeStrength * 1.1,
            )
            return
        }

        this.controllerNeedLink()
    }

    private controllerNeedLink() {
        const controllerLink = this.communeManager.controllerLink
        if (!controllerLink || !controllerLink.isRCLActionable) return

        const hubLink = this.communeManager.room.roomManager.hubLink
        // No need to haul if there is a valid hubLink
        if (hubLink && hubLink.isRCLActionable) return

        // There is a viable controllerLink but we need to haul to it

        this.communeManager.communeHaulerNeed += findCarryPartsRequired(
            Memory.rooms[this.communeManager.room.name][RoomMemoryKeys.upgradePath].length /
                packedPosLength +
                3,
            this.communeManager.upgradeStrength * 1.1,
        )
        return
    }
}
