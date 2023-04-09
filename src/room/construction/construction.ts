import { buildableStructuresSet, buildableStructureTypes, structureTypesToProtectSet } from 'international/constants'
import { customLog, findObjectWithID, packAsNum, randomTick } from 'international/utils'
import { packCoord, unpackCoord } from 'other/codec'
import { CommuneManager } from 'room/commune/commune'
import { BasePlans } from './basePlans'
import { RampartPlans } from './rampartPlans'
import { internationalManager } from 'international/international'

const generalMigrationStructures: BuildableStructureConstant[] = [
    STRUCTURE_EXTENSION,
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
const noOverlapDestroyStructures: Set<StructureConstant> = new Set([STRUCTURE_SPAWN, STRUCTURE_RAMPART])

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
        // If there are builders and enough cSites, stop

        if (this.room.myCreeps.builder.length) {
            if (this.room.find(FIND_MY_CONSTRUCTION_SITES).length <= 2) return
        }
/*
        // If there are no builders, just run every 50 ticks
        else if (!randomTick(50)) return
 */
        // If the construction site count is at its limit, stop

        if (global.constructionSitesCount === MAX_CONSTRUCTION_SITES) return

        // If there are enough construction sites

        if (this.room.find(FIND_MY_CONSTRUCTION_SITES).length >= internationalManager.maxCSitesPerRoom) return

        const RCL = this.room.controller.level
        let placedSites = 0
        const maxSites = internationalManager.maxCSitesPerRoom
        const basePlans = BasePlans.unpack(this.room.memory.BPs)

        for (const packedCoord in basePlans.map) {
            if (placedSites >= maxSites) return

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
                        if (noOverlapDestroyStructures.has(structure.structureType)) continue

                        structure.destroy()

                        skip = true
                        break
                    }

                    if (skip) break
                }

                this.room.createConstructionSite(coord.x, coord.y, data.structureType)
                placedSites += 1
                break
            }
        }

        if ((this.room.storage || this.room.terminal) && this.room.resourcesInStoringStructures.energy < 30000) return

        const rampartPlans = RampartPlans.unpack(this.room.memory.RPs)

        for (const packedCoord in rampartPlans.map) {
            if (placedSites >= maxSites) return

            const coord = unpackCoord(packedCoord)
            const data = rampartPlans.map[packedCoord]
            if (data.minRCL > RCL) continue

            if (this.room.findStructureAtCoord(coord, structure => structure.structureType === STRUCTURE_RAMPART))
                continue
            if (data.coversStructure && !this.room.coordHasStructureTypes(coord, structureTypesToProtectSet)) continue

            if (data.buildForNuke) {
                if (this.room.roomManager.nukeTargetCoords[packAsNum(coord)] === 0) continue

                this.room.createConstructionSite(coord.x, coord.y, STRUCTURE_RAMPART)
                placedSites += 1
                continue
            }

            if (data.buildForThreat) {
                if (Memory.rooms[this.room.name].AT < this.communeManager.minThreatRampartsThreshold) continue

                this.room.createConstructionSite(coord.x, coord.y, STRUCTURE_RAMPART)
                placedSites += 1
                continue
            }

            this.room.createConstructionSite(coord.x, coord.y, STRUCTURE_RAMPART)
            placedSites += 1
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
                if (!coordData) {
                    structure.destroy()
                    continue
                }

                const match = coordData.find(data => {
                    return data.structureType === structure.structureType
                })
                if (match) continue

                structure.destroy()
            }
        }

        // Keep one spawn even if all are misplaced

        const misplacedSpawns: StructureSpawn[] = []

        for (const structure of structures.spawn) {
            const packedCoord = packCoord(structure.pos)

            const coordData = basePlans.map[packedCoord]
            if (!coordData) {
                misplacedSpawns.push(structure)
                continue
            }

            const match = coordData.find(data => {
                return data.structureType === structure.structureType
            })
            if (match) continue

            misplacedSpawns.push(structure)
        }

        let i = misplacedSpawns.length === structures.spawn.length ? 1 : 0
        for (; i < misplacedSpawns.length; i++) {
            misplacedSpawns[i].destroy()
        }
        /*
        const rampartPlans = RampartPlans.unpack(this.room.memory.RPs)

        for (const structure of structures.rampart) {
            const packedCoord = packCoord(structure.pos)

            const data = rampartPlans.map[packedCoord]
            if (data) continue

            structure.destroy()
        } */
    }
}
