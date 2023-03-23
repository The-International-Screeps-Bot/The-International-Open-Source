import { unpackCoord } from "other/codec"
import { CommuneManager } from "room/commune/commune"
import { BasePlans } from "./basePlans"
import { RampartPlans } from "./rampartPlans"

export class ConstructionManager {
    communeManager: CommuneManager
    room: Room

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    preTickRun() {
        this.room = this.communeManager.room

        const RCL = this.room.controller.level
        const basePlans = BasePlans.unpack(this.room.memory.BPs)

        for (const packedCoord in basePlans.map) {

            const coord = unpackCoord(packedCoord)
            const coordData = basePlans.map[packedCoord]
            const lastIndex = coordData.length - 1

            for (let i = 0; i < coordData.length; i++) {
                const data = coordData[i]
                if (data.minRCL > RCL) continue

                this.room.visual.structure(coord.x, coord.y, data.structureType)
                break
            }
        }

        const rampartPlans = RampartPlans.unpack(this.room.memory.RPs)

        for (const packedCoord in rampartPlans.map) {
            const coord = unpackCoord(packedCoord)
            const data = rampartPlans.map[packedCoord]
            if (data.minRCL > RCL) continue

            if (rampartPlans.get(packedCoord).buildForNuke) {
                this.room.visual.structure(coord.x, coord.y, STRUCTURE_RAMPART, { opacity: 0.2 })
                continue
            }

            if (rampartPlans.get(packedCoord).buildForThreat) {
                this.room.visual.structure(coord.x, coord.y, STRUCTURE_RAMPART, { opacity: 0.2 })
                continue
            }
            this.room.visual.structure(coord.x, coord.y, STRUCTURE_RAMPART, { opacity: 0.5 })
        }

        this.room.visual.connectRoads()

        this.room.visual.text(RCL.toString(), this.room.controller.pos)
    }
}
