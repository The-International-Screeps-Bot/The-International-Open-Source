import { generalFuncs } from "international/generalFunctions"

/**
 * Creates tasks for spawns and extensions when they are empty
 */
export function structuresForSpawningManager(room: Room) {

    // Find a hauler in the room and get it's capacity

    const haulerCapacity = Game.creeps[room.myCreeps.hauler[0]].store.getCapacity()

    // Construct structure groups

    const stuctureGroups = {}

    // Get exensions and spawns

    const structuresForSpawning = room.get('structuresForSpawning')

    // Iterate through structures in structureForSpawning

    for (const structure of structuresForSpawning) {

        // If there is no created task IDs object for the creator

        if (!global[structure.id].createdTaskIDs) {

            // Create it

            global[structure.id].createdTaskIDs = {}
        }

        // Iterate if the structure has already created a task

        if (global[structure.id].createdTaskIDs, new Set(['withdraw'])) continue

        //
    }
}
