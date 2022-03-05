import { RoomTransferTask } from "./roomTasks"

Room.prototype.towersRequestResources = function() {

    const room = this

    // Get the room's towers

    const towers: StructureTower[] = room.get('tower')

    // Get and loop through each tower

    for (const tower of towers) {

        // if there is no global for the tower, make one

        if (!global[tower.id]) global[tower.id] = {}

        // If there is no created task ID obj for the tower's global, create one

        if (!global[tower.id].createdTaskIDs) global[tower.id].createdTaskIDs = {}

        // Otherwise

        else {

            // Find the towers's tasks of type tansfer

            const towersTransferTasks = room.findTasksOfTypes(global[tower.id].createdTaskIDs, new Set(['transfer'])) as RoomTransferTask[]

            // Track the amount of energy the resource has offered in tasks

            let totalResourcesRequested = 0

            // Loop through each pickup task

            for (const task of towersTransferTasks) {

                // Otherwise find how many resources the task has requested to pick up

                totalResourcesRequested += task.transferAmount
            }

            // If there are more or equal resources offered than the free energy capacity of the tower, iterate

            if (totalResourcesRequested >= tower.store.getFreeCapacity(RESOURCE_ENERGY)) continue
        }

        // Get the amount of energy the tower needs at a max of the hauler's capacity

        const transferAmount = Math.min(tower.store.getFreeCapacity(RESOURCE_ENERGY))

        // If the transferAmount is more than 0

        if (transferAmount > 0) {

            // Create a new transfer task for the tower

            new RoomTransferTask(room.name, RESOURCE_ENERGY, transferAmount, tower.id, 8)
        }
    }
}

Room.prototype.towersHealCreeps = function() {

    const room = this

    // Get the room's towers

    const towers: StructureTower[] = room.get('tower')

    // Stop if there are no towers

    if (!towers.length) return

    // Construct heal targets from my and allied damaged creeps in the room

    const healTargets: Creep[] = room.find(FIND_MY_CREEPS).concat(room.get('allyCreeps')).filter(creep => creep.hits < creep.hitsMax)

    // Loop through the room's towers

    for (const tower of towers) {

        // Iterate if the tower is inactionable

        if (tower.inactionable) continue

        // Otherwise, get the first target

        const creep = healTargets[0]

        // Try to heal the creep

        const healResult = tower.heal(creep)

        // If the heal failed, iterate

        if (healResult != OK) continue

        // Otherwise record that the tower is no longer inactionable

        tower.inactionable = true

        /* // Remove healTarget if it is fully healed

        if (creep.hitsMax - creep.hits == 0) delete healTargets[0] */

        // And iterate

        continue
    }
}


Room.prototype.towersAttackCreeps = function() {

    const room = this

    // Get the room's towers

    const towers: StructureTower[] = room.get('tower')

    // Stop if there are no towers

    if (!towers.length) return

    // Construct attack targets from my and allied damaged creeps in the room

    const attackTargets: Creep[] = room.get('enemyCreeps')

    // Loop through the room's towers

    for (const tower of towers) {

        // Iterate if the tower is inactionable

        if (tower.inactionable) continue

        // Otherwise, get the first target

        const creep = attackTargets[0]

        // Try to attack the creep

        const healResult = tower.attack(creep)

        // If the attack failed, iterate

        if (healResult != OK) continue

        // Otherwise record that the tower is no longer inactionable

        tower.inactionable = true

        /* // Remove healTarget if it is fully healed

        if (creep.hitsMax - creep.hits == 0) delete healTargets[0] */

        // And iterate

        continue
    }
}
