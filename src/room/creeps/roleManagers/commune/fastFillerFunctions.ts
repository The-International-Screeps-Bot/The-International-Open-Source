import { customLog, getRange, getRangeBetween, unpackAsRoomPos } from 'international/generalFunctions'
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

     this.say('💁')

     // If the creep has a non-energy resource

     if (this.usedStore() > this.store.energy) {
          for (const resourceType in this.store) {
               if (resourceType == RESOURCE_ENERGY) continue

               this.say('WR')

               this.drop(resourceType as ResourceConstant)
               return true
          }
     }

     const fastFillerContainers: (StructureContainer)[] = [
          room.fastFillerContainerLeft,
          room.fastFillerContainerRight,
     ]

     // If all spawningStructures are filled, inform false

     if (room.energyAvailable === room.energyCapacityAvailable) return false

     // If the this needs resources

     if (this.needsResources()) {
          // Get the sourceLinks

          const fastFillerStoringStructures: (StructureContainer | StructureLink)[] = [
               room.fastFillerLink,
               ...fastFillerContainers
          ]

          let structures = fastFillerStoringStructures.length

          // Loop through each fastFillerStoringStructure

          for (const structure of fastFillerStoringStructures) {
               // If the structure is undefined, iterate

               if (!structure) {

                    structures -= 1
                    continue
               }

               // Otherwise, if the structure is not in range 1 to the this

               if (getRange(this.pos.x - structure.pos.x, this.pos.y - structure.pos.y) > 1) continue

               // If there is a non-energy resource in the structure

               if (
                    structure.structureType != STRUCTURE_LINK &&
                    this.usedStore() > structure.store.energy
               ) {
                    for (const resourceType in structure.store) {
                         if (resourceType == RESOURCE_ENERGY) continue

                         this.say('WCR')

                         this.withdraw(structure, resourceType as ResourceConstant)
                         return true
                    }
               }

               // Otherwise, if there is insufficient energy in the structure, iterate

               if (structure.store.energy < this.freeSpecificStore(RESOURCE_ENERGY) || structure.store.getUsedCapacity(RESOURCE_ENERGY) < this.freeSpecificStore(RESOURCE_ENERGY)) continue

               // Otherwise, withdraw from the structure and inform true

               this.say('W')

               this.withdraw(structure, RESOURCE_ENERGY)
               structure.store.energy -= this.store.getCapacity() - this.store.energy
               return true
          }

          if (structures === 0) {

               this.suicide()
               return false
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

          // If the structureType is an extension or spawn, iterate

          if (structure.structureType !== STRUCTURE_SPAWN && structure.structureType !== STRUCTURE_EXTENSION) continue

          if (structure.store.energy >= structure.store.getCapacity(RESOURCE_ENERGY)) continue

          // Otherwise, transfer to the structure record the action and inform true

          this.say('T')

          this.transfer(structure, RESOURCE_ENERGY).toString()
          structure.store.energy += this.store.energy

          return true
     }
/*
     if (this.store.energy === 0) return false

     for (const container of fastFillerContainers) {
          if (!container) continue

          if (container.store.getCapacity() - container.store.energy < this.store.energy) continue

          this.say('FC')

          this.transfer(container, RESOURCE_ENERGY)
          return true
     }
 */
     // Otherwise inform false

     return false
}
