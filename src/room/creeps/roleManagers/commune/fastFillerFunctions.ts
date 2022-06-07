import { customLog, getRangeBetween, unpackAsRoomPos } from 'international/generalFunctions'
import { FastFiller } from 'room/creeps/creepClasses'

FastFiller.prototype.travelToFastFiller = function () {
     const { room } = this

     // Try to find a fastFillerPos, inform true if it failed

     if (!this.findFastFillerPos()) return true

     // Unpack the this's packedFastFillerPos

     const fastFillerPos = unpackAsRoomPos(this.memory.packedPos, room.name)

     // If the this is standing on the fastFillerPos, inform false

     if (getRangeBetween(this.pos.x, this.pos.y, fastFillerPos.x, fastFillerPos.y) === 0) return false

     // Otherwise, make a move request to it

     this.say('⏩F')

     this.createMoveRequest({
          origin: this.pos,
          goal: { pos: fastFillerPos, range: 0 },
     })

     // And inform true

     return true
}

FastFiller.prototype.fillFastFiller = function () {
     const { room } = this

     this.say('FFF')

     // Drop a resource if the creep has a non-energy resource

     if (this.store.energy < _.sum(Object.values(this.store))) {
          for (const resourceType in this.store) {
               if (resourceType == RESOURCE_ENERGY) continue

               this.drop(resourceType as ResourceConstant)
               return true
          }
     }

     // If all spawningStructures are filled, inform false

     if (room.energyAvailable === room.energyCapacityAvailable) return false

     // If the this needs resources

     if (this.needsResources()) {

          const fastFillerContainers: (StructureContainer | false)[] = [
               room.get('fastFillerContainerLeft'),
               room.get('fastFillerContainerRight'),
          ]

          // Withdraw from a fastFiller container if it has a non-energy resource

          for (const container of fastFillerContainers) {
               if (!container) continue

               if (container.store.energy >= _.sum(Object.values(container.store))) continue

               for (const resourceType in container.store) {
                    if (resourceType == RESOURCE_ENERGY) continue

                    this.withdraw(container, resourceType as ResourceConstant)
                    return true
               }
          }

          // Get the sourceLinks

          const fastFillerStoringStructure: (StructureContainer | StructureLink | false)[] = [
               ...fastFillerContainers,
               room.get('fastFillerLink'),
          ]

          // Loop through each fastFillerStoringStructure

          for (const structure of fastFillerStoringStructure) {
               // If the structure is undefined, iterate

               if (!structure) continue

               // Otherwise, if the structure is not in range 1 to the this

               if (getRangeBetween(this.pos.x, this.pos.y, structure.pos.x, structure.pos.y) !== 1) continue

               // Otherwise, if there is insufficient energy in the structure, iterate

               if (structure.store.getUsedCapacity(RESOURCE_ENERGY) < this.store.getCapacity()) continue

               // Otherwise, withdraw from the structure and inform true

               this.say('W')

               this.withdraw(structure, RESOURCE_ENERGY)
               return true
          }

          // Inform false

          return false
     }

     // Otherwise if the this doesn't need energy, get adjacent extensions and spawns to the this

     const adjacentStructures = room.lookForAtArea(
          LOOK_STRUCTURES,
          this.pos.y - 1,
          this.pos.x - 1,
          this.pos.y + 1,
          this.pos.x + 1,
          true,
     )

     // For each structure of adjacentStructures

     for (const adjacentPosData of adjacentStructures) {
          // Get the structure at the adjacentPos

          const structure = adjacentPosData.structure as StructureSpawn | StructureExtension

          // If the structure has no store property, iterate

          if (!structure.store) continue

          // If the structure has already had resources moved, iterate

          if (structure.hasHadResourcesMoved) continue

          // If the structureType is an extension or spawn, iterate

          if (structure.structureType !== STRUCTURE_SPAWN && structure.structureType !== STRUCTURE_EXTENSION) continue

          // , iterate

          if (structure.store.getFreeCapacity(RESOURCE_ENERGY) === 0) continue

          // Otherwise, transfer to the structure record the action and inform true

          this.say('T')

          this.transfer(structure, RESOURCE_ENERGY)
          structure.hasHadResourcesMoved = true

          return true
     }

     // Otherwise inform false

     return false
}
