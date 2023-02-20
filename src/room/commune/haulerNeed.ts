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

        // There is a viable controllerContainer

        if (room.controllerContainer && room.controllerContainer.RCLActionable)
            room.haulerNeed += findCarryPartsRequired(room.upgradePathLength, room.upgradeStrength)
        // There is a viable controllerLink but we need to haul to it
        else if (
            room.controllerLink &&
            room.controllerLink.RCLActionable &&
            (!room.hubLink || !room.hubLink.RCLActionable)
        ) {
            room.haulerNeed += findCarryPartsRequired(room.upgradePathLength, room.upgradeStrength)
        }

        room.haulerNeed += findCarryPartsRequired(room.mineralPath.length, room.mineralHarvestStrength)

        room.haulerNeed += room.structures.lab.length / 1.5

        /* room.haulerNeed += room.structures.extension.length / 10 */

        if ((room.controller.level >= 4 && room.storage) || (room.terminal && room.controller.level >= 6))
            room.haulerNeed += Memory.stats.rooms[room.name].eosp / 50

        room.haulerNeed = Math.floor(room.haulerNeed)
    }

    sourceNeed() {
        const { room } = this.communeManager

        if (room.hubLink && room.hubLink.RCLActionable) {
            for (let index in room.sources) {
                const sourceLink = room.sourceLinks[index]
                if (sourceLink && sourceLink.RCLActionable) continue

                if (room.sourcePaths[index])
                    room.haulerNeed += findCarryPartsRequired(
                        room.sourcePaths[index].length + 3,
                        room.estimatedSourceIncome[index],
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
                    room.estimatedSourceIncome[index],
                )
            else console.log(`No source path for ${room.name} source ${index}`)
        }
    }
}
