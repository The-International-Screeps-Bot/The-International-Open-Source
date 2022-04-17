import { customLog, getRangeBetween, unPackAsRoomPos } from "international/generalFunctions";
import { FastFiller } from "room/creeps/creepClasses";

FastFiller.prototype.travelToFastFiller = function() {

    const creep = this,
    room = creep.room

    // Try to find a fastFillerPos, inform true if it failed

    if (!creep.findFastFillerPos()) return true

    // Unpack the creep's packedFastFillerPos

    const fastFillerPos = unPackAsRoomPos(creep.memory.packedFastFillerPos, room.name)

    // If the creep is standing on the fastFillerPos, inform false

    if (getRangeBetween(creep.pos.x, creep.pos.y, fastFillerPos.x, fastFillerPos.y) == 0) return false

    // Otherwise, make a move request to it

    creep.say('⏩F')

    creep.createMoveRequest({
        origin: creep.pos,
        goal: { pos: fastFillerPos, range: 0 }
    })

    // And inform true

    return true
}

FastFiller.prototype.fillFastFiller = function() {

    const creep = this,
    room = creep.room

    creep.say('FFF')

    // If all spawningStructures are filled, inform false

    if (room.energyAvailable == room.energyCapacityAvailable) return false

    // If the creep needs resources

    if (creep.needsResources()) {

        // Get the sourceLinks

        const fastFillerStoringStructure: (StructureContainer | StructureLink | false)[] = [room.get('fastFillerContainerLeft'), room.get('fastFillerContainerRight'), room.get('fastFillerLink')]

        // Loop through each fastFillerStoringStructure

        for (const structure of fastFillerStoringStructure) {

            // If the structure is undefined, iterate

            if (!structure) continue

            // Otherwise, if the structure is not in range 1 to the creep

            if (getRangeBetween(creep.pos.x, creep.pos.y, structure.pos.x, structure.pos.y) != 1) continue

            // Otherwise, if there is insufficient energy in the structure, iterate

            if (structure.store.getUsedCapacity(RESOURCE_ENERGY) < creep.store.getCapacity()) continue

            // Otherwise, withdraw from the structure and inform true

            creep.say('W')

            creep.withdraw(structure, RESOURCE_ENERGY)
            return true
        }

        // Inform false

        return false
    }

    // Otherwise if the creep doesn't need energy, get adjacent structures to the creep

    const adjacentStructures = room.lookForAtArea(LOOK_STRUCTURES, creep.pos.y - 1, creep.pos.x - 1, creep.pos.y + 1, creep.pos.x + 1, true)

    // For each structure of adjacentStructures

    for (const adjacentPosData of adjacentStructures) {

        // Get the structure at the adjacentPos

        const structure = adjacentPosData.structure as AnyStoreStructure

        // If the structure has no store property, iterate

        if (!structure.store) continue

        // If the structureType is an extension or spawn, iterate

        if (structure.structureType != STRUCTURE_SPAWN && structure.structureType != STRUCTURE_EXTENSION) continue

        // Otherwise, if the structure is full, iterate

        if (structure.store.getFreeCapacity(RESOURCE_ENERGY) == 0) continue

        // Otherwise, transfer to the structure and inform true

        creep.say('T')

        creep.transfer(structure, RESOURCE_ENERGY)
        return true
    }

    // Otherwise inform false

    return false
}
