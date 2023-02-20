import { impassibleStructureTypes, stamps } from 'international/constants'
import { customLog, randomTick, unpackNumAsCoord } from 'international/utils'

Room.prototype.remotePlanner = function (commune) {
    return true
}

Room.prototype.clearOtherStructures = function () {
    if (!randomTick(100)) return

    for (const wall of this.structures.constructedWall) wall.destroy()

    for (const structure of this.find(FIND_HOSTILE_STRUCTURES)) structure.destroy()
}

Room.prototype.remoteConstructionPlacement = function () {}

Room.prototype.communeConstructionPlacement = function () {
    if (!this.memory.PC) return

    // Only run every x ticks or if there are builders (temporary fix)

    if (!this.myCreeps.builder.length) {
        if (!randomTick(200)) return
        if (this.resourcesInStoringStructures.energy < this.communeManager.storedEnergyBuildThreshold) return
    }

    // If the construction site count is at its limit, stop

    if (global.constructionSitesCount === MAX_CONSTRUCTION_SITES) return

    // If there are some construction sites

    if (this.find(FIND_MY_CONSTRUCTION_SITES).length >= 2) return

    let placed = 0

    for (const stampType in stamps) {
        const stamp = stamps[stampType as StampTypes]

        for (const packedStampAnchor of this.memory.stampAnchors[stampType as StampTypes]) {
            const stampAnchor = unpackNumAsCoord(packedStampAnchor)

            for (const structureType in stamp.structures) {
                if (structureType === 'empty') continue

                // If there are already sufficient structures + cSites

                if (
                    this.structures[structureType as StructureConstant].length +
                        this.cSites[structureType as BuildableStructureConstant].length >=
                    CONTROLLER_STRUCTURES[structureType as BuildableStructureConstant][this.controller.level]
                )
                    continue

                // If the structureType is a rampart and the storage isn't full enough, stop

                if (
                    structureType === STRUCTURE_RAMPART &&
                    (!this.storage || this.controller.level < 4 || this.storage.store.energy < 30000)
                ) {
                    continue
                }

                // If the structureType is a road and RCL 3 extensions aren't built, stop

                if (structureType === STRUCTURE_ROAD && this.energyCapacityAvailable < 800) continue

                for (const pos of stamp.structures[structureType]) {
                    // Re-assign the pos's x and y to align with the offset

                    const x = pos.x + stampAnchor.x - stamp.offset
                    const y = pos.y + stampAnchor.y - stamp.offset

                    if (placed > 10) return

                    //Don't build roads if there's already an impassable structure there.  This is mostly to deal
                    //  with existing rooms that are being built.
                    if (structureType == STRUCTURE_ROAD) {
                        const impassableStructure = this.lookForAt(LOOK_STRUCTURES, x, y).find(str =>
                            impassibleStructureTypes.includes(str.structureType),
                        )
                        if (impassableStructure) continue
                    }

                    if (this.createConstructionSite(x, y, structureType as BuildableStructureConstant) === OK)
                        placed += 1
                }
            }
        }
    }

    if (this.storage && this.storage.store.energy > 30000) {
        //Build ramparts on important structures:
        for (const structureType of [
            STRUCTURE_TOWER,
            STRUCTURE_SPAWN,
            STRUCTURE_STORAGE,
            STRUCTURE_TERMINAL,
            STRUCTURE_FACTORY,
            STRUCTURE_LAB,
        ]) {
            const structures = this.find(FIND_MY_STRUCTURES, { filter: { structureType: structureType } })
            for (const structure of structures) {
                if (placed > 10) continue

                let rampart = structure.pos.lookFor(LOOK_STRUCTURES).filter(st => st.structureType == STRUCTURE_RAMPART)
                let rampartc = structure.pos
                    .lookFor(LOOK_CONSTRUCTION_SITES)
                    .filter(st => st.structureType == STRUCTURE_RAMPART)
                if (rampart.length == 0 && rampartc.length == 0) {
                    if (this.createConstructionSite(structure.pos.x, structure.pos.y, STRUCTURE_RAMPART) === OK)
                        placed += 1
                }
            }
        }
    }

    // If visuals are enabled, visually connect roads

    if (Memory.roomVisuals) this.visual.connectRoads()
}
