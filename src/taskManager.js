function taskManger(room, myCreeps) {

    function findCreepsOfTask(collection, task, requiredAmount) {

        let creepsWithTask = []

        for (let creep of collection) {

            if (creep.memory.task && creep.memory.task == task) {

                creepsWithTask.push(creep)
            }
        }
        if (creepsWithTask.length < requiredAmount) {

            return false
        }

        return true
    }

    function findCreepWithoutTask(collection, requiredAmount) {

        /*         let creeps = [] */

        for (let creep of collection) {

            if (creep.memory.task == undefined) {

                return creep

                /*
                creeps.push(creep)
                
                if (creeps.length == requiredAmount) {

                                    return creeps
                                } */
            }
        }

        return false
    }

    // Harvester

    let harvesters = []

    for (let creep of myCreeps) {

        if (creep.memory.role == "harvester") {

            harvesters.push(creep)
        }
    }

    if (!findCreepsOfTask(harvesters, "source1", (harvesters.length / 2)) && findCreepWithoutTask(harvesters)) {

        findCreepWithoutTask(harvesters).memory.task = "source1"

    } else if (!findCreepsOfTask(harvesters, "source2", (harvesters.length / 2)) && findCreepWithoutTask(harvesters)) {

        findCreepWithoutTask(harvesters).memory.task = "source2"
    }

    // Haulers

    let haulers = []

    for (let creep of myCreeps) {

        if (creep.memory.role == "hauler") {

            haulers.push(creep)
        }
    }

    if (haulers.length > 0) {

        let lowTowers = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => (s.structureType == STRUCTURE_TOWER) && s.energy < 500
        })

        let essentialStructures = room.find(FIND_MY_STRUCTURES, {
            filter: (s) => (s.structureType == STRUCTURE_EXTENSION ||
                    s.structureType == STRUCTURE_SPAWN ||
                    s.structureType == STRUCTURE_TOWER && s.energy < 710) &&
                s.energy < s.energyCapacity
        })

        let storage = room.storage
        let terminal = room.terminal

        let sourceContainer1 = Game.getObjectById(room.memory.sourceContainer1)
        let sourceContainer2 = Game.getObjectById(room.memory.sourceContainer2)
        let controllerContainer = Game.getObjectById(room.memory.controllerContainer)
        let mineralContainer = Game.getObjectById(room.memory.mineralContainer)

        let controllerLink = Game.getObjectById(room.memory.controllerLink)

        if (storage && storage.store[RESOURCE_ENERGY] >= haulers[0].store.getCapacity() && (lowTowers[0] || essentialStructures[0])) {

            if (!findCreepsOfTask(haulers, "deliverFromStorage", 2) && findCreepWithoutTask(haulers)) {

                findCreepWithoutTask(haulers).memory.task = "deliverFromStorage"
            }
        }

        if (controllerLink == null && controllerContainer != null && storage && storage.store[RESOURCE_ENERGY] >= 30000 && controllerContainer.store[RESOURCE_ENERGY] <= haulers[0].store.getCapacity()) {

            if (!findCreepsOfTask(haulers, "deliverToControllerContainer", 1) && findCreepWithoutTask(haulers)) {

                findCreepWithoutTask(haulers).memory.task = "deliverToControllerContainer"
            }
        }

        if (sourceContainer1 != null && sourceContainer1.store[RESOURCE_ENERGY] >= haulers[0].store.getCapacity()) {

            if (!findCreepsOfTask(haulers, "sourceContainer1Full", 1) && findCreepWithoutTask(haulers)) {

                findCreepWithoutTask(haulers).memory.task = "sourceContainer1Full"
            }
        }
        if (sourceContainer2 != null && sourceContainer2.store[RESOURCE_ENERGY] >= haulers[0].store.getCapacity()) {

            if (!findCreepsOfTask(haulers, "sourceContainer2Full", 1) && findCreepWithoutTask(haulers)) {

                findCreepWithoutTask(haulers).memory.task = "sourceContainer2Full"
            }
        }

        let droppedEnergy = room.find(FIND_DROPPED_RESOURCES, {
            filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= haulers[0].store.getCapacity() * 0.5
        })

        if (droppedEnergy.length > 0) {

            if (!findCreepsOfTask(haulers, "droppedEnergy", haulers.length) && findCreepWithoutTask(haulers)) {

                findCreepWithoutTask(haulers).memory.task = "droppedEnergy"
            }
        }

        let tombstones = room.find(FIND_TOMBSTONES, {
            filter: (s) => s.store[RESOURCE_ENERGY] >= haulers[0].store.getCapacity() * 0.5
        })

        if (tombstones.length > 0) {

            if (!findCreepsOfTask(haulers, "tombstone", 1) && findCreepWithoutTask(haulers)) {

                findCreepWithoutTask(haulers).memory.task = "tombstone"
            }
        }

        if (mineralContainer != null && mineralContainer.store.getUsedCapacity() >= haulers[0].store.getCapacity()) {

            if (!findCreepsOfTask(haulers, "mineralContainerFull", 1) && findCreepWithoutTask(haulers)) {

                findCreepWithoutTask(haulers).memory.task = "mineralContainerFull"
            }
        }

        let powerSpawn = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_POWER_SPAWN
        })[0]

        if (powerSpawn && (terminal || storage)) {

            if (powerSpawn.store[RESOURCE_ENERGY] < (powerSpawn.store.getCapacity(RESOURCE_ENERGY) * 0.5) &&
                (terminal.store[RESOURCE_ENERGY] - 70000 >= powerSpawn.store.getFreeCapacity(RESOURCE_ENERGY) ||
                    storage.store[RESOURCE_ENERGY] - 1450000 >= powerSpawn.store.getFreeCapacity(RESOURCE_ENERGY))) {

                if (!findCreepsOfTask(haulers, "fillPowerSpawnEnergy", 1) && findCreepWithoutTask(haulers)) {

                    findCreepWithoutTask(haulers).memory.task = "fillPowerSpawnEnergy"
                }
            }

            if (powerSpawn.store[RESOURCE_POWER] < (powerSpawn.store.getCapacity(RESOURCE_POWER) * 0.5) &&
                (terminal.store[RESOURCE_POWER] >= powerSpawn.store.getFreeCapacity(RESOURCE_POWER) ||
                    storage.store[RESOURCE_POWER] >= powerSpawn.store.getFreeCapacity(RESOURCE_POWER))) {

                if (!findCreepsOfTask(haulers, "fillPowerSpawnPower", 1) && findCreepWithoutTask(haulers)) {

                    findCreepWithoutTask(haulers).memory.task = "fillPowerSpawnPower"
                }
            }
        }
    }
}

module.exports = taskManger