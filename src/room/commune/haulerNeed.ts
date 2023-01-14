import { customLog, findCarryPartsRequired } from 'international/utils'
import { CommuneManager } from './commune'

export class HaulerNeedManager {
    communeManager: CommuneManager
    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {
        const { room } = this.communeManager

        for (let index in room.sources) {
            const sourceLink = room.sourceLinks[index]
            if (sourceLink && sourceLink.RCLActionable) continue

            room.haulerNeed += findCarryPartsRequired(
                room.sourcePaths[index].length + 3,
                room.estimatedSourceIncome[index],
            )
        }

        // There is a viable controllerContainer

        if (room.controllerContainer && room.controllerContainer.RCLActionable)
            room.haulerNeed += findCarryPartsRequired(room.upgradePathLength, room.upgradeStrength)

        room.haulerNeed += findCarryPartsRequired(room.mineralPath.length, room.mineralHarvestStrength)

        room.haulerNeed += room.structures.lab.length / 1.5

        /* room.haulerNeed += room.structures.extension.length / 10 */

        if ((room.controller.level >= 4 && room.storage) || (room.terminal && room.controller.level >= 6))
            room.haulerNeed += Memory.stats.rooms[room.name].eosp / 50

        room.haulerNeed = Math.floor(room.haulerNeed)
    }
}
