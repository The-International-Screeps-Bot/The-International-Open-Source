import { CreepMemoryKeys } from 'international/constants'
import { findClosestPos, getRangeXY, getRange } from 'international/utils'
import { packCoord, packPos, unpackCoord, unpackCoordAsPos, unpackPos } from 'other/codec'

export class FastFiller extends Creep {
    travelToFastFiller?(): boolean {
        const fastFillerPos = this.findFastFillerPos()
        if (!fastFillerPos) return true

        // If the this is standing on the fastFillerPos, inform false

        if (getRange(this.pos, fastFillerPos) === 0) return false

        // Otherwise, make a move request to it

        this.message = '⏩F'

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: fastFillerPos, range: 0 }],
        })

        // And inform true

        return true
    }

    findFastFillerPos?() {
        const { room } = this

        this.message = 'FFP'

        // Stop if the creep already has a packedFastFillerPos

        if (this.memory[CreepMemoryKeys.packedCoord]) return unpackCoordAsPos(this.memory[CreepMemoryKeys.packedCoord], room.name)

        // Get usedFastFillerPositions

        const usedFastFillerCoords = room.usedFastFillerCoords

        const openFastFillerPositions = room.fastFillerPositions.filter(
            pos => !usedFastFillerCoords.has(packCoord(pos)),
        )
        if (!openFastFillerPositions.length) return false

        const fastFillerPos = findClosestPos(this.pos, openFastFillerPositions)
        const packedCoord = packCoord(fastFillerPos)

        this.memory[CreepMemoryKeys.packedCoord] = packedCoord
        room._usedFastFillerCoords.add(packedCoord)

        return fastFillerPos
    }

    fillFastFiller?(): boolean {
        const { room } = this

        this.message = '🚬'

        // If the creep has a non-energy resource

        if (this.usedStore() > this.store.energy) {
            for (const resourceType in this.store) {
                if (resourceType == RESOURCE_ENERGY) continue

                this.message = 'WR'

                this.drop(resourceType as ResourceConstant)
                return true
            }
        }

        const fastFillerContainers: StructureContainer[] = []

        if (room.fastFillerContainerLeft) fastFillerContainers.push(room.fastFillerContainerLeft)
        if (room.fastFillerContainerRight) fastFillerContainers.push(room.fastFillerContainerRight)

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

                if (structure.usedStore() > structure.store.energy) {
                    for (const key in structure.store) {
                        const resourceType = key as ResourceConstant

                        if (resourceType === RESOURCE_ENERGY) continue

                        this.message = 'WCR'

                        this.withdraw(structure, resourceType as ResourceConstant)

                        return true
                    }
                }

                // Otherwise, if there is insufficient energy in the structure, iterate

                if (structure.store.getUsedCapacity(RESOURCE_ENERGY) < structure.store.getCapacity() * 0.5) continue

                this.withdraw(structure, RESOURCE_ENERGY)
                return true
            }

            let fastFillerStoringStructures: (StructureContainer | StructureLink)[] = []
            if (room.fastFillerLink && room.fastFillerLink.RCLActionable)
                fastFillerStoringStructures.push(room.fastFillerLink)
            fastFillerStoringStructures = fastFillerStoringStructures.concat(fastFillerContainers)

            // Loop through each fastFillerStoringStructure

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

            if (structure.structureType !== STRUCTURE_SPAWN && structure.structureType !== STRUCTURE_EXTENSION) continue

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

            creep.passiveRenew()

            /* creep.message = ('🚬') */
        }
    }
}
