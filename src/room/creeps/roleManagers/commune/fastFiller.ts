import { getRange, unpackAsRoomPos } from 'international/generalFunctions'

export class FastFiller extends Creep {
    travelToFastFiller?(): boolean {
        const { room } = this

        // Try to find a fastFillerPos, inform true if it failed

        if (!this.findFastFillerPos()) return true

        // Unpack the this's packedFastFillerPos

        const fastFillerPos = unpackAsRoomPos(this.memory.packedPos, room.name)

        // If the this is standing on the fastFillerPos, inform false

        if (getRange(this.pos.x, fastFillerPos.x, this.pos.y, fastFillerPos.y) === 0) return false

        // Otherwise, make a move request to it

        this.say('⏩F')

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: fastFillerPos, range: 0 }],
        })

        // And inform true

        return true
    }

    fillFastFiller?(): boolean {
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

        const fastFillerContainers = [room.fastFillerContainerLeft, room.fastFillerContainerRight]

        // If all spawningStructures are filled, inform false

        if (room.energyAvailable === room.energyCapacityAvailable) return false

        // If the this needs resources

        if (this.needsResources()) {
            // Get the sourceLinks

            let fastFillerStoringStructures: (StructureContainer | StructureLink)[] = [room.fastFillerLink]
            fastFillerStoringStructures = fastFillerStoringStructures.concat(fastFillerContainers)

            let structures = fastFillerStoringStructures.length

            // Loop through each fastFillerStoringStructure

            for (const structure of fastFillerStoringStructures) {
                // If the structure is undefined, iterate

                if (!structure) {
                    structures -= 1
                    continue
                }

                // Otherwise, if the structure is not in range 1 to the this

                if (getRange(this.pos.x, structure.pos.x, this.pos.y, structure.pos.y) > 1) continue

                // If there is a non-energy resource in the structure

                if (structure.structureType != STRUCTURE_LINK && structure.usedStore() > structure.store.energy) {
                    for (const key in structure.store) {
                        const resourceType = key as ResourceConstant

                        if (resourceType === RESOURCE_ENERGY) continue

                        this.say('WCR')

                        this.withdraw(structure, resourceType as ResourceConstant)

                        return true
                    }
                }

                // Otherwise, if there is insufficient energy in the structure, iterate

                if (
                    structure.store.energy < this.freeSpecificStore(RESOURCE_ENERGY) ||
                    structure.store.getUsedCapacity(RESOURCE_ENERGY) < this.freeSpecificStore(RESOURCE_ENERGY)
                )
                    continue

                // Otherwise, withdraw from the structure and inform true

                this.say('W')

                this.withdraw(structure, RESOURCE_ENERGY)
                structure.store.energy -= this.store.getCapacity() - this.store.energy
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

            // If the structureType is an extension or spawn, iterate

            if (structure.structureType !== STRUCTURE_SPAWN && structure.structureType !== STRUCTURE_EXTENSION) continue

            if (structure.store.energy >= structure.store.getCapacity(RESOURCE_ENERGY)) continue

            // Otherwise, transfer to the structure record the action and inform true

            this.say('T')

            this.transfer(structure, RESOURCE_ENERGY)
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

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static fastFillerManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: FastFiller = Game.creeps[creepName]

            if (creep.travelToFastFiller()) continue

            if (creep.fillFastFiller()) continue

            creep.advancedRenew()

            /* creep.say('🚬') */
        }
    }
}
