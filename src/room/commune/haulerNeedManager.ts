import { findCarryPartsRequired } from "international/utils"
import { CommuneManager } from "./communeManager"

export class HaulerNeedManager {

    communeManager: CommuneManager
    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {

        const  { room } = this.communeManager

        for (let index in room.sources) {

            if (room.sourceLinks[index]) continue

            room.haulerNeed += findCarryPartsRequired(room.sourcePaths[index].length, room.estimatedSourceIncome[index])
        }

        if (room.controllerLink) room.haulerNeed += findCarryPartsRequired(room.upgradePathLength, room.upgradeStrength)

        room.haulerNeed += room.structures.lab.length / 2

        room.haulerNeed += Memory.stats.rooms[room.name].eosp / 10

        room.haulerNeed = Math.floor(room.haulerNeed)
    }
}
