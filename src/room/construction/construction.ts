import { buildableStructuresSet } from 'international/constants'
import { findObjectWithID, packAsNum, randomTick } from 'international/utils'
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

        if (!this.room.memory.PC) return

        /* this.visualize() */

        // Only run every x ticks or if there are builders (temporary fix)

        if (!this.room.myCreeps.builder.length) {
            if (!randomTick(50)) return
        }

        // If the construction site count is at its limit, stop

        if (global.constructionSitesCount === MAX_CONSTRUCTION_SITES) return

        // If there are some construction sites

        if (this.room.find(FIND_MY_CONSTRUCTION_SITES).length >= Math.max(2, MAX_CONSTRUCTION_SITES / 1 + global.communes.size)) return

        const RCL = this.room.controller.level
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

        if (RCL >= 4 && this.room.resourcesInStoringStructures.energy < 30000) return

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
    }
    public visualize() {
        const RCL = /* this.room.controller.level */ 8
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

            if (rampartPlans.get(packedCoord).buildForNuke) {
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
