import { buildableStructuresSet } from 'international/constants'
import { findObjectWithID, packAsNum } from 'international/utils'
import { packCoord, unpackCoord } from 'other/codec'
import { CommuneManager } from 'room/commune/commune'
import { BasePlans } from './basePlans'
import { RampartPlans } from './rampartPlans'

export class ConstructionManager {
    communeManager: CommuneManager
    room: Room

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    preTickRun() {
        this.room = this.communeManager.room

        const RCL = /* this.room.controller.level */8
        const basePlans = BasePlans.unpack(this.room.memory.BPs)

        for (const packedCoord in basePlans.map) {
            const coord = unpackCoord(packedCoord)
            const coordData = basePlans.map[packedCoord]

            for (let i = 0; i < coordData.length; i++) {
                const data = coordData[i]
                if (data.minRCL > RCL) continue

                const structureIDs = this.room.structureCoords.get(packCoord(coord))
                if (structureIDs) {
                    let skip = false

                    for (const ID of structureIDs) {
                        const structure = findObjectWithID(ID)

                        if (structure.structureType === data.structureType) {
                            skip = true
                            break
                        }

                        structure.destroy()
                        skip = true
                        break
                    }

                    if (skip) break
                }

                this.room.createConstructionSite(coord.x, coord.y, data.structureType)
                break
            }
        }

        const rampartPlans = RampartPlans.unpack(this.room.memory.RPs)

        for (const packedCoord in rampartPlans.map) {
            const coord = unpackCoord(packedCoord)
            const data = rampartPlans.map[packedCoord]
            if (data.minRCL > RCL) continue

            if (this.room.findStructureAtCoord(coord, STRUCTURE_RAMPART)) continue
            if (data.coversStructure && !this.room.coordHasStructureTypes(coord, buildableStructuresSet)) continue

            if (
                rampartPlans.get(packedCoord).buildForNuke &&
                this.room.roomManager.nukeTargetCoords[packAsNum(coord)] > 0
            ) {
                this.room.createConstructionSite(coord.x, coord.y, STRUCTURE_RAMPART)
                continue
            }

            if (rampartPlans.get(packedCoord).buildForThreat) {
                continue
            }

            this.room.createConstructionSite(coord.x, coord.y, STRUCTURE_RAMPART)
        }

        this.visualize()
    }
    private visualize() {

        const RCL = /* this.room.controller.level */8
        const basePlans = BasePlans.unpack(this.room.memory.BPs)

        for (const packedCoord in basePlans.map) {
            const coord = unpackCoord(packedCoord)
            const coordData = basePlans.map[packedCoord]

            for (let i = 0; i < coordData.length; i++) {
                const data = coordData[i]
                if (data.minRCL > RCL) continue

                this.room.visual.structure(coord.x, coord.y, data.structureType)
                this.room.visual.text(data.minRCL.toString(), coord.x, coord.y)
                break
            }
        }

        const rampartPlans = RampartPlans.unpack(this.room.memory.RPs)

        for (const packedCoord in rampartPlans.map) {
            const coord = unpackCoord(packedCoord)
            const data = rampartPlans.map[packedCoord]
            if (data.minRCL > RCL) continue

            /* this.room.visual.text(data.minRCL.toString(), coord.x, coord.y) */

            if (
                rampartPlans.get(packedCoord).buildForNuke
            ) {
                this.room.visual.structure(coord.x, coord.y, STRUCTURE_RAMPART, { opacity: 0.2, fill: 'yellow' })
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
