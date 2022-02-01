import { generalFuncs } from "international/generalFunctions"
import { RoomTransferTask } from "./roomTasks"

/**
 * Creates tasks for spawns and extensions when they are empty
 */
export function structuresForSpawningManager(room: Room) {

    // Find a hauler in the room and get it's capacity

    const haulerCapacity = Game.creeps[room.myCreeps.hauler[0]] ? Game.creeps[room.myCreeps.hauler[0]].store.getCapacity() : 100

    // Construct group data

    let groupIndex = 0

    // Construct structure groups

    interface StructureGroup {
        totalTransferAmount: number
        structures: (Id<StructureSpawn> | Id<StructureExtension>)[]
    }

    const structureGroups: StructureGroup[] = [
        {
            totalTransferAmount: 0,
            structures: []
        }
    ]

    // Get exensions and spawns

    const structuresForSpawning: (StructureSpawn | StructureExtension)[] = room.get('structuresForSpawning')

    // Iterate through structures in structureForSpawning

    for (const structure of structuresForSpawning) {

        // if there is no global for the structure, make one

        if (!global[structure.id]) global[structure.id] = {}

        // Otherwise if there is no created task ID obj for the structure's global, create one

        if (!global[structure.id].createdTaskIDs) global[structure.id].createdTaskIDs = {}

        // Otherwise

        else {

            // Find the structures's tasks of type tansfer

            const structuresTransferTasks = room.findTasksOfTypes(global[structure.id].createdTaskIDs, new Set(['transfer'])) as RoomTransferTask[]

            // Track the amount of energy the resource has offered in tasks

            let totalResourcesRequested = 0

            // Loop through each pickup task

            for (const task of structuresTransferTasks) {

                // Otherwise find how many resources the task has requested to pick up

                totalResourcesRequested += task.transferAmount
            }

            // If there are more or equal resources offered than the free energy capacity of the structure, iterate

            if (totalResourcesRequested >= structure.store.getFreeCapacity(RESOURCE_ENERGY)) continue
        }

        // Get the amount of energy the structure needs at a max of the hauler's capacity

        const transferAmount: number = Math.min(structure.store.getFreeCapacity(RESOURCE_ENERGY), haulerCapacity)

        // If the groupTransferAmount plus transferAmount is more than hauler capacity

        if (structureGroups[groupIndex].totalTransferAmount + transferAmount > haulerCapacity) {

            // Create a new group

            structureGroups.push({
                totalTransferAmount: 0,
                structures: []
            })

            // And increment the groupIndex

            groupIndex++
        }

        // Add the transferAmount to the group's totalTransferAmount

        structureGroups[groupIndex].totalTransferAmount += transferAmount

        // And add the structure's ID to the group's structures

        structureGroups[groupIndex].structures.push(structure.id)
    }

    // Loop through each group of structureGroups

    for (const group of structureGroups) {

        // Iterate if there is no transfer amount for the group

        if (group.totalTransferAmount == 0) continue

        // Create a transfer task based on the group's data

        new RoomTransferTask(room.name, RESOURCE_ENERGY, group.totalTransferAmount, group.structures)
    }
}
