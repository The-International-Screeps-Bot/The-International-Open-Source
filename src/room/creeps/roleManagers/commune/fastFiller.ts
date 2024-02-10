import { CreepMemoryKeys, ReservedCoordTypes } from '../../../../constants/general'
import { findClosestPos, getRangeXY, getRange } from 'utils/utils'
import { packCoord, packPos, unpackCoord, unpackCoordAsPos, unpackPos } from 'other/codec'
import { StructureUtils } from 'room/structureUtils'
import { CreepOps } from 'room/creeps/creepOps'
import { RoomUtils } from 'room/roomUtils'
import { roomData } from 'room/roomData'
import { CreepUtils } from 'room/creeps/creepUtils'

export class FastFiller extends Creep {
  update() {
    const packedCoord = Memory.creeps[this.name][CreepMemoryKeys.packedCoord]
    if (packedCoord) {
      if (this.isDying()) {
        this.room.roomManager.reserveCoord(packedCoord, ReservedCoordTypes.dying)
      } else {
        this.room.roomManager.reserveCoord(packedCoord, ReservedCoordTypes.important)
      }
    }
  }

  travelToFastFiller?(): boolean {
    const fastFillerCoord = CreepUtils.findFastFillerCoord(this)
    if (!fastFillerCoord) return true

    // If the this is standing on the fastFillerPos, we didn't travel
    if (getRange(this.pos, fastFillerCoord) === 0) return false

    // Otherwise, make a move request to it

    this.message = '⏩F'

    this.createMoveRequest({
      origin: this.pos,
      goals: [
        { pos: new RoomPosition(fastFillerCoord.x, fastFillerCoord.y, this.room.name), range: 0 },
      ],
    })

    // And inform true

    return true
  }

  fillFastFiller?(): boolean {
    const { room } = this

    this.message = '🚬'

    // If the creep has a non-energy resource

    if (this.store.getUsedCapacity() > this.store.energy) {
      for (const resourceType in this.store) {
        if (resourceType == RESOURCE_ENERGY) continue

        this.message = 'WR'

        this.drop(resourceType as ResourceConstant)
        return true
      }
    }

    const fastFillerContainers = this.room.roomManager.fastFillerContainers

    // If all spawningStructures are filled, inform false

    if (room.energyAvailable === room.energyCapacityAvailable) return false

    // If the this needs resources

    if (this.needsResources()) {
      for (let i = fastFillerContainers.length - 1; i >= 0; i--) {
        const structure = fastFillerContainers[i]

        // Otherwise, if the structure is not in range 1 to the this

        if (getRange(this.pos, structure.pos) > 1) {
          fastFillerContainers.splice(i, 1)
          continue
        }

        // If there is a non-energy resource in a container

        if (structure.store.getUsedCapacity() > structure.store.energy) {
          for (const key in structure.store) {
            const resourceType = key as ResourceConstant

            if (resourceType === RESOURCE_ENERGY) continue

            this.message = 'WCR'
            this.withdraw(structure, resourceType as ResourceConstant)
            return true
          }
        }

        // Otherwise, if there is insufficient energy in the structure, iterate

        if (structure.store.getUsedCapacity(RESOURCE_ENERGY) < structure.store.getCapacity() * 0.5)
          continue

        this.withdraw(structure, RESOURCE_ENERGY)
        return true
      }

      let fastFillerStoringStructures: (StructureContainer | StructureLink)[] = []

      const fastFillerLink = room.roomManager.fastFillerLink
      if (fastFillerLink && StructureUtils.isRCLActionable(fastFillerLink))
        fastFillerStoringStructures.push(fastFillerLink)
      fastFillerStoringStructures = fastFillerStoringStructures.concat(fastFillerContainers)

      // Find a storing structure to get energy from

      for (const structure of fastFillerStoringStructures) {
        // Otherwise, if the structure is not in range 1 to the this
        if (getRange(this.pos, structure.pos) > 1) continue

        // If there is a non-energy resource in the structure
        if (structure.nextStore.energy <= 0) continue

        // Otherwise, withdraw from the structure and inform true

        this.message = 'W'

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

      if (!structure.nextStore) continue

      // If the structureType is an extension or spawn, iterate

      if (
        structure.structureType !== STRUCTURE_SPAWN &&
        structure.structureType !== STRUCTURE_EXTENSION
      )
        continue

      if (structure.nextStore.energy >= structure.store.getCapacity(RESOURCE_ENERGY)) continue

      // Otherwise, transfer to the structure record the action and inform true

      this.message = 'T'

      this.transfer(structure, RESOURCE_ENERGY)
      structure.nextStore.energy += this.store.energy
      return true
    }
    /*
         if (this.store.energy === 0) return false

         for (const container of fastFillerContainers) {
              if (!container) continue

              if (container.store.getCapacity() - container.store.energy < this.store.energy) continue

              this.message = ('FC')

              this.transfer(container, RESOURCE_ENERGY)
              return true
         }
     */
    // Otherwise inform false

    return false
  }

  constructor(creepID: Id<Creep>) {
    super(creepID)
  }

  static roleManager(room: Room, creepsOfRole: string[]) {
    for (const creepName of creepsOfRole) {
      const creep: FastFiller = Game.creeps[creepName]

      if (creep.travelToFastFiller()) continue

      if (creep.fillFastFiller()) continue

      CreepOps.passiveRenew(creep)

      /* creep.message = ('🚬') */
    }
  }
}
