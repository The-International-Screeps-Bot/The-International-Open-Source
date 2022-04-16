import { allyList, constants } from "international/constants";
import { MeleeDefender } from "room/creeps/creepClasses";


MeleeDefender.prototype.advancedDefend = function() {

    const creep = this,
    room = creep.room

    // Get enemyAttackers in the room, informing false if there are none

    const enemyAttackers = room.find(FIND_HOSTILE_CREEPS, {
        filter: enemyAttacker => !allyList.has(enemyAttacker.owner.username) && !enemyAttacker.isOnExit() && enemyAttacker.hasPartsOfTypes([WORK, ATTACK, RANGED_ATTACK])
    })
    if(!enemyAttackers.length) return false

    // Get the closest enemyAttacker

    const ememyAttacker = creep.pos.findClosestByRange(enemyAttackers)

    // Get the room's ramparts, filtering for thoseinforming false if there are none

    const ramparts = (room.get('rampart') as StructureRampart[]).filter(function(rampart) {

        // Get structures at the rampart's pos

        const structuresAtPos = room.lookForAt(LOOK_STRUCTURES, rampart.pos)

        // Loop through each structure

        for (const structure of structuresAtPos) {

            // If the structure is impassible, inform false

            if (constants.impassibleStructureTypes.includes(structure.structureType)) return false
        }

        // Get creeps at the rampart's pos

        const creepsAtPos = room.lookForAt(LOOK_CREEPS, rampart.pos)

        // Loop through each creep

        for (const creepAlt of creepsAtPos) {

            // If the creepAlt is the creep, inform true

            if (creepAlt.id == creep.id) return true

            // Otherwise inform false

            return false
        }

        // Otherwise inform true

        return true
    })
    if (!ramparts.length) return false

    // Attack the enemyAttacker

    creep.attack(ememyAttacker)

    // Find the closest rampart to the enemyAttacker

    const closestRampart = ememyAttacker.pos.findClosestByRange(ramparts)

    // If the creep is range 0 to the closestRampart, inform false

    if (creep.pos.getRangeTo(closestRampart) == 0) return false

    // Otherwise move to the rampart preffering ramparts and inform true

    creep.createMoveRequest({
        origin: creep.pos,
        goal: { pos: closestRampart.pos, range: 0 },
        plainCost: 30,
        swampCost: 80,
        weightGamebjects: {
            2: room.get('road'),
            1: ramparts,
        }
    })

    return true
}
