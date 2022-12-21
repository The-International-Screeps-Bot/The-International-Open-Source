import { customLog, findCarryPartsRequired } from 'international/utils'
import { CommuneManager } from './commune'

export class HaulerNeedManager {
    communeManager: CommuneManager
    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {
        const { room } = this.communeManager

        room.haulerNeed += 2

        for (let index in room.sources) {
            const sourceLink = room.sourceLinks[index]
            if (sourceLink && sourceLink.RCLActionable) continue

            room.haulerNeed +=
                findCarryPartsRequired(room.sourcePaths[index].length, room.estimatedSourceIncome[index]) * 1.2
        }

        if (!room.controllerLink || !room.controller.RCLActionable)
            room.haulerNeed += findCarryPartsRequired(room.upgradePathLength, room.upgradeStrength)

        room.haulerNeed += room.structures.lab.length / 1.2

        room.haulerNeed += room.structures.extension.length / 10

        room.haulerNeed += Memory.stats.rooms[room.name].eosp / 50

        room.haulerNeed = Math.floor(room.haulerNeed)
    }
}
