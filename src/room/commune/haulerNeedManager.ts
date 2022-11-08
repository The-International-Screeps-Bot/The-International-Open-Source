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

            room.haulerNeed += findCarryPartsRequired(room.sourcePaths[index].length, room.estimatedSourceIncome[index])
        }

        room.haulerNeed += findCarryPartsRequired(room.upgradePathLength, room.upgradeStrength)

        room.haulerNeed += room.structures.lab.length / 2

        room.haulerNeed += Memory.stats.rooms[room.name].eosp / 10
    }
}
