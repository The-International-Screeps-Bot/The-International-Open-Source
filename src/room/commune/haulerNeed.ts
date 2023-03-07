import { stamps } from 'international/constants'
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

        room.haulerNeed += findCarryPartsRequired(room.mineralPath.length + 3, room.mineralHarvestStrength * 1.1)
        room.haulerNeed += room.structures.lab.length / 1.5

        const extensions = room.structures.extension.length - stamps.fastFiller.structures.extension.length
        if (extensions > 0) room.structures.extension.length / 4

        /* room.haulerNeed += room.structures.extension.length / 10 */

        if ((room.controller.level >= 4 && room.storage) || (room.terminal && room.controller.level >= 6))
            room.haulerNeed += Memory.stats.rooms[room.name].eosp / 50

        room.haulerNeed = Math.round(room.haulerNeed)
    }

    private sourceNeed() {
        const { room } = this.communeManager

        if (room.hubLink && room.hubLink.RCLActionable) {
            for (let index in room.sources) {
                const sourceLink = room.sourceLinks[index]
                if (sourceLink && sourceLink.RCLActionable) continue

                if (room.sourcePaths[index])
                    room.haulerNeed += findCarryPartsRequired(
                        room.sourcePaths[index].length + 3,
                        room.estimatedSourceIncome[index] * 1.1,
                    )
                else console.log(`No source path for ${room.name} source ${index}`)
            }

            return
        }

        // No valid hubLink

        for (let index in room.sources) {
            const sourceLink = room.sourceLinks[index]
            if (sourceLink && sourceLink.RCLActionable) continue

            if (room.sourcePaths[index])
                room.haulerNeed += findCarryPartsRequired(
                    room.sourcePaths[index].length + 3,
                    room.estimatedSourceIncome[index] * 1.1,
                )
            else console.log(`No source path for ${room.name} source ${index}`)
        }
    }

    private controllerNeed() {
        const { room } = this.communeManager

        if (room.controller.level < 2) return

        // There is a viable controllerContainer

        if (room.controllerContainer) {

            room.haulerNeed += findCarryPartsRequired(room.upgradePathLength + 3, room.upgradeStrength * 1.1)
            return
        }

        // There is a viable controllerLink but we need to haul to it

        if (
            room.controllerLink &&
            room.controllerLink.RCLActionable &&
            (!room.hubLink || !room.hubLink.RCLActionable)
        ) {
            room.haulerNeed += findCarryPartsRequired(room.upgradePathLength + 3, room.upgradeStrength * 1.1)
            return
        }
    }
}
