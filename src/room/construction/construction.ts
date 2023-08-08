import {
    buildableStructuresSet,
    buildableStructureTypes,
    customColors,
    Result,
    RoomMemoryKeys,
    structureTypesToProtectSet,
} from 'international/constants'
import {
    customLog,
    findObjectWithID,
    packAsNum,
    randomIntRange,
    randomTick,
} from 'international/utils'
import { packCoord, unpackCoord } from 'other/codec'
import { CommuneManager } from 'room/commune/commune'
import { BasePlans } from './basePlans'
import { RampartPlans } from './rampartPlans'
import { collectiveManager } from 'international/collective'

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
const noOverlapDestroyStructures: Set<StructureConstant> = new Set([
    STRUCTURE_SPAWN,
    STRUCTURE_RAMPART,
])

export class ConstructionManager {
    communeManager: CommuneManager
    room: Room
    placedSites: number
    /**
     * The tick when the program was put to sleep
     */
    sleep = 0
    sleepFor = randomIntRange(20, 100)

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    preTickRun() {
        this.room = this.communeManager.room

        if (!this.room.memory[RoomMemoryKeys.communePlanned]) return
        // If it's not our first room, wait until RCL 2 before begining construction efforts
        if (!this.room.roomManager.isStartRoom() && this.room.controller.level < 2) return

        if (this.clearEnemyStructures() === Result.action) return

        this.place()
        this.migrate()
    }
    private place() {
        // If there are builders and enough cSites, stop

        if (this.room.myCreeps.builder.length) {
            if (this.room.find(FIND_MY_CONSTRUCTION_SITES).length > 2) return
        }
        // If there are no builders, just run every few ticks
        else if (
            this.room.controller.level !== 1 &&
            Game.time - this.sleep > this.sleepFor
        )
            return

        this.sleep = Game.time

        // If the construction site count is at its limit, stop

        if (global.constructionSitesCount === MAX_CONSTRUCTION_SITES) return

        // If there are enough construction sites

        if (this.room.find(FIND_MY_CONSTRUCTION_SITES).length >= collectiveManager.maxCSitesPerRoom)
            return

        this.placedSites = 0

        const RCL = this.room.controller.level
        const maxCSites = Math.min(collectiveManager.maxCSitesPerRoom, MAX_CONSTRUCTION_SITES - global.constructionSitesCount)

        this.placeRamparts(RCL, maxCSites)
        this.placeBase(RCL, maxCSites)
    }
    private placeRamparts(RCL: number, maxCSites: number) {
        const rampartPlans = RampartPlans.unpack(this.room.memory[RoomMemoryKeys.rampartPlans])
        const hasStoringStructure = !!this.room.communeManager.storingStructures.length

        for (const packedCoord in rampartPlans.map) {

            const coord = unpackCoord(packedCoord)
            const data = rampartPlans.map[packedCoord]
            if (data.minRCL > RCL) continue
            // Ensure we have a storing structure if it is a requirement
            if (data.needsStoringStructure && !hasStoringStructure) continue

            if (
                this.room.findStructureAtCoord(
                    coord,
                    structure => structure.structureType === STRUCTURE_RAMPART,
                )
            )
                continue
            if (data.coversStructure) {
                if (!this.room.coordHasStructureTypes(coord, structureTypesToProtectSet)) continue
            }

            if (data.buildForNuke) {
                if (this.room.roomManager.nukeTargetCoords[packAsNum(coord)] === 0) continue

                this.room.createConstructionSite(coord.x, coord.y, STRUCTURE_RAMPART)
                this.placedSites += 1
                continue
            }

            if (data.buildForThreat) {
                if (!this.communeManager.needsSecondMincutLayer) continue

                this.room.createConstructionSite(coord.x, coord.y, STRUCTURE_RAMPART)
                this.placedSites += 1
                continue
            }

            this.room.createConstructionSite(coord.x, coord.y, STRUCTURE_RAMPART)
            this.placedSites += 1
            if (this.placedSites >= maxCSites) return
        }

        if (this.placedSites >= maxCSites) return
    }
    private placeBase(RCL: number, maxCSites: number) {
        if (this.placedSites >= maxCSites) return

        const basePlans = BasePlans.unpack(this.room.memory[RoomMemoryKeys.basePlans])

        for (let placeRCL = 1; placeRCL <= RCL; placeRCL++) {
            for (const packedCoord in basePlans.map) {

                const coord = unpackCoord(packedCoord)
                const coordData = basePlans.map[packedCoord]

                for (let i = 0; i < coordData.length; i++) {
                    const data = coordData[i]
                    if (data.minRCL > RCL) continue
                    if (data.minRCL > placeRCL) break

                    const structureIDs = this.room.roomManager.structureCoords.get(packCoord(coord))
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
                    this.placedSites += 1
                    if (this.placedSites >= maxCSites) return
                    break
                }
            }
        }
    }
    public visualize() {
        const RCL = /* this.room.controller.level */ /* Game.time % 8 */ 8
        const basePlans = BasePlans.unpack(this.room.memory[RoomMemoryKeys.basePlans])

        for (let placeRCL = 1; placeRCL <= RCL; placeRCL++) {
            for (const packedCoord in basePlans.map) {

                const coord = unpackCoord(packedCoord)
                const coordData = basePlans.map[packedCoord]

                for (let i = 0; i < coordData.length; i++) {
                    const data = coordData[i]
                    if (data.minRCL > RCL) continue
                    if (data.minRCL > placeRCL) break

                    this.room.visual.structure(coord.x, coord.y, data.structureType)
                    this.room.visual.text(data.minRCL.toString(), coord.x, coord.y - 0.25, {
                        font: 0.4,
                    })
                    break
                }
            }
        }

        const rampartPlans = RampartPlans.unpack(this.room.memory[RoomMemoryKeys.rampartPlans])

        for (const packedCoord in rampartPlans.map) {
            const coord = unpackCoord(packedCoord)
            const data = rampartPlans.map[packedCoord]
            if (data.minRCL > RCL) continue

            this.room.visual.text(data.minRCL.toString(), coord.x, coord.y + 0.25, { font: 0.4 })

            if (data.buildForNuke) {
                this.room.visual.structure(coord.x, coord.y, STRUCTURE_RAMPART, {
                    opacity: 0.2,
                    fill: 'yellow',
                })
                continue
            }

            if (data.buildForThreat) {
                this.room.visual.structure(coord.x, coord.y, STRUCTURE_RAMPART, { opacity: 0.2 })
                continue
            }

            if (data.coversStructure) {
                this.room.visual.structure(coord.x, coord.y, STRUCTURE_RAMPART, {
                    opacity: 0.2,
                    fill: customColors.lightBlue,
                })
                continue
            }

            this.room.visual.structure(coord.x, coord.y, STRUCTURE_RAMPART, { opacity: 0.5 })
        }

        this.room.visual.connectRoads()
        this.room.visual.text(RCL.toString(), this.room.controller.pos)
    }
    private migrate() {
        if (!global.settings.structureMigration) return
        if (!randomTick(100)) return

        const structures = this.room.roomManager.structures
        const basePlans = BasePlans.unpack(this.room.memory[RoomMemoryKeys.basePlans])

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
        const rampartPlans = RampartPlans.unpack(this.room.memory[RoomMemoryKeys.rampartPlans])

        for (const structure of structures.rampart) {
            const packedCoord = packCoord(structure.pos)

            const data = rampartPlans.map[packedCoord]
            if (data) continue

            structure.destroy()
        } */
    }

    /**
     * If it hasn't yet been done for this room, check for and destroy any structures owned by another player
     */
    private clearEnemyStructures() {
        const roomMemory = Memory.rooms[this.room.name]
        if (roomMemory[RoomMemoryKeys.clearedEnemyStructures]) return Result.noAction

        const structures = this.room.roomManager.structures
        for (const structureType in structures) {
            for (const structure of structures[structureType as StructureConstant]) {
                if (!(structure as OwnedStructure).owner) continue
                if ((structure as OwnedStructure).owner.username === Memory.me) continue

                structure.destroy()
            }
        }

        roomMemory[RoomMemoryKeys.clearedEnemyStructures] = true
        return Result.action
    }
}
