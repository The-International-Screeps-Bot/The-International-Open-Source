import { buildableStructuresSet, buildableStructureTypes } from 'international/constants'
import { customLog, findObjectWithID, packAsNum, randomTick } from 'international/utils'
import { packCoord, unpackCoord } from 'other/codec'
import { CommuneManager } from 'room/commune/commune'
import { BasePlans } from './basePlans'
import { RampartPlans } from './rampartPlans'

const generalMigrationStructures: BuildableStructureConstant[] = [
    STRUCTURE_SPAWN,
    STRUCTURE_EXTENSION,
    STRUCTURE_ROAD,
    STRUCTURE_WALL,
    STRUCTURE_LINK,
    STRUCTURE_STORAGE,
    STRUCTURE_TOWER,
    STRUCTURE_OBSERVER,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_EXTRACTOR,
    STRUCTURE_LAB,
    STRUCTURE_TERMINAL,
    STRUCTURE_CONTAINER,
    STRUCTURE_NUKER,
    STRUCTURE_FACTORY,
]

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

        this.place()
        this.migrate()
    }
    private place() {
        // Only run every x ticks or if there are builders (temporary fix)

        if (!this.room.myCreeps.builder.length) {
            if (!randomTick(50)) return
        }

        // If the construction site count is at its limit, stop

        if (global.constructionSitesCount === MAX_CONSTRUCTION_SITES) return

        // If there are some construction sites

        if (
            this.room.find(FIND_MY_CONSTRUCTION_SITES).length >=
            Math.max(2, MAX_CONSTRUCTION_SITES / 1 + global.communes.size)
        )
            return

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

        if (RCL < 4) return
        if (this.room.resourcesInStoringStructures.energy < 30000) return

        const rampartPlans = RampartPlans.unpack(this.room.memory.RPs)

        for (const packedCoord in rampartPlans.map) {
            const coord = unpackCoord(packedCoord)
            const data = rampartPlans.map[packedCoord]
            if (data.minRCL > RCL) continue

            if (this.room.findStructureAtCoord(coord, STRUCTURE_RAMPART)) continue
            if (data.coversStructure && !this.room.coordHasStructureTypes(coord, buildableStructuresSet)) continue

            if (data.buildForNuke) {
                if (this.room.roomManager.nukeTargetCoords[packAsNum(coord)] === 0) continue

                this.room.createConstructionSite(coord.x, coord.y, STRUCTURE_RAMPART)
                continue
            }

            if (data.buildForThreat) {
                if (this.room.memory.AT < 20000) continue

                this.room.createConstructionSite(coord.x, coord.y, STRUCTURE_RAMPART)
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

            if (data.buildForNuke) {
                this.room.visual.structure(coord.x, coord.y, STRUCTURE_RAMPART, { opacity: 0.2, fill: 'yellow' })
                continue
            }

            if (data.buildForThreat) {
                this.room.visual.structure(coord.x, coord.y, STRUCTURE_RAMPART, { opacity: 0.2 })
                continue
            }

            this.room.visual.structure(coord.x, coord.y, STRUCTURE_RAMPART, { opacity: 0.5 })
        }

        this.room.visual.connectRoads()
        this.room.visual.text(RCL.toString(), this.room.controller.pos)
    }
    private migrate() {
        if (!Memory.structureMigration) return
        if (!randomTick(100)) return

        const structures = this.room.structures
        const basePlans = BasePlans.unpack(this.room.memory.BPs)

        for (const structureType of generalMigrationStructures) {
            for (const structure of structures[structureType]) {
                const packedCoord = packCoord(structure.pos)

                const coordData = basePlans.map[packedCoord]
                if (coordData) continue

                structure.destroy()
            }
        }

        // Keep one spawn even if all are misplaced

        let i = structures.spawn.length
        while (i > 1) {
            for (const structure of structures.spawn) {
                const packedCoord = packCoord(structure.pos)

                const coordData = basePlans.map[packedCoord]
                if (coordData) continue

                structure.destroy()
                i -= 1
            }
        }

        const rampartPlans = RampartPlans.unpack(this.room.memory.RPs)

        for (const structure of structures.rampart) {
            const packedCoord = packCoord(structure.pos)

            const data = rampartPlans.map[packedCoord]
            if (data) continue

            structure.destroy()
        }
    }
}
