import { stamps } from 'international/constants'
import { unpackAsPos } from 'international/generalFunctions'

Room.prototype.remotePlanner = function (commune) {
     return true
}

Room.prototype.clearOtherStructures = function () {
     if (Game.time % 100 !== 0) return

     for (const wall of this.structures.constructedWall) wall.destroy()

     for (const structure of this.find(FIND_HOSTILE_STRUCTURES)) structure.destroy()
}

Room.prototype.remoteConstructionPlacement = function () {}

Room.prototype.communeConstructionPlacement = function () {
     if (!this.memory.planned) return

     // Only run the planner every x ticks (temporary fix)

     if (Game.time % Math.floor(Math.random() * 100) !== 0) return

     // If the construction site count is at its limit, stop

     if (global.constructionSitesCount === MAX_CONSTRUCTION_SITES) return

     // If there are some construction sites

     if (this.find(FIND_MY_CONSTRUCTION_SITES).length > 2) return

     let placed = 0

     for (const stampType in stamps) {
          const stamp = stamps[stampType as StampTypes]

          for (const packedStampAnchor of this.memory.stampAnchors[stampType as StampTypes]) {
               const stampAnchor = unpackAsPos(packedStampAnchor)

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
                    )
                         continue

                    // If the structureType is a road and RCL 3 extensions aren't built, stop

                    if (structureType === STRUCTURE_ROAD && this.energyCapacityAvailable < 800) continue

                    for (const pos of stamp.structures[structureType]) {
                         // Re-assign the pos's x and y to align with the offset

                         const x = pos.x + stampAnchor.x - stamp.offset
                         const y = pos.y + stampAnchor.y - stamp.offset

                         if (placed > 10) return

                         if (this.createConstructionSite(x, y, structureType as BuildableStructureConstant) === OK) placed += 1
                    }
               }
          }
     }

     // If visuals are enabled, visually connect roads

     if (Memory.roomVisuals) this.visual.connectRoads()
}
