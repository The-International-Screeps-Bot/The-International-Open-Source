const roleHauler = require("role.hauler")

module.exports = {
    /*
    task manager manages haulers tasks. Task manager filters haulers in room and find jobs that need filling. Jobs are added to the que, and removed when a creep commits to a task. If a creep is doing a task and is asked for a more important task, it finishes the existing task first. Creeps have a primaryTask and a seoncdaryTask, primary task is what the creep is doing, secondary task is what the creep will do when done. when primaryTask is compelte, it becomes secondaryTask and secondary task becomes undefined.
    */
    /*
    task manager also manages harvesters, telling harvesters sources they may pick, then having them subtracted when a harvester chooses one
    */
    run: function taskManger(room, haulers) {

        //for haulers:

        /*
        -if energy structures aren't full check if there is a baseLink and sourceContainers

        -If so
        */

        function communeBuilders() {


        }

        function remoteHarvesters() {


        }

        function harvesters() {


        }

        function findHaulersOfRoom() {

            let creepsOfRoom = []

            for (let object of haulers) {

                if (object.roomFrom == room.name) {

                    creepsOfRoom.push(object.creep)
                }
            }
            return creepsOfRoom
        }

        if (findHaulersOfRoom().length > 0) {

            function findCreepWithTask(task, requiredAmount) {

                let creepsWithTask = []

                for (let object of haulers) {

                    if (object.roomFrom == room.name) {

                        if (object.creep.memory.task && object.creep.memory.task == task) {

                            creepsWithTask.push("creep")
                        }
                    }
                }
                if (creepsWithTask.length < requiredAmount) {

                    return false
                }
                return true
            }

            function findCreepWithoutTask() {

                for (let object of haulers) {

                    if (object.roomFrom == room.name) {

                        if (!object.creep.memory.task) {

                            return object.creep
                        }
                    }
                }
                return false
            }

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

            let sourceContainer1 = Game.getObjectById(room.memory.sourceContainer1)
            let sourceContainer2 = Game.getObjectById(room.memory.sourceContainer2)
            let controllerContainer = Game.getObjectById(room.memory.controllerContainer)

            let controllerLink = Game.getObjectById(room.memory.controllerLink)

            if (storage && storage.store[RESOURCE_ENERGY] >= findHaulersOfRoom()[0].store.getCapacity() && lowTowers[0] || essentialStructures[0]) {

                if (!findCreepWithTask("deliverFromStorage", 2) && findCreepWithoutTask()) {

                    findCreepWithoutTask().memory.task = "deliverFromStorage"
                }
            }

            if (controllerLink == null && controllerContainer != null && storage && storage.store[RESOURCE_ENERGY] >= 30000 && controllerContainer.store[RESOURCE_ENERGY] <= 1000) {

                if (!findCreepWithTask("deliverToControllerContainer", 1) && findCreepWithoutTask()) {

                    findCreepWithoutTask().memory.task = "deliverToControllerContainer"
                }
            }

            if (sourceContainer1 != null && sourceContainer1.store[RESOURCE_ENERGY] >= findHaulersOfRoom()[0].store.getCapacity()) {

                if (!findCreepWithTask("sourceContainer1Full", 1) && findCreepWithoutTask()) {

                    findCreepWithoutTask().memory.task = "sourceContainer1Full"
                }
            }
            if (sourceContainer2 != null && sourceContainer2.store[RESOURCE_ENERGY] >= findHaulersOfRoom()[0].store.getCapacity()) {

                if (!findCreepWithTask("sourceContainer2Full", 1) && findCreepWithoutTask()) {

                    findCreepWithoutTask().memory.task = "sourceContainer2Full"
                }
            }

            let droppedEnergy = room.find(FIND_DROPPED_RESOURCES, {
                filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= findHaulersOfRoom()[0].store.getCapacity()
            })

            if (droppedEnergy[0]) {

                if (!findCreepWithTask("droppedEnergy", findHaulersOfRoom().length) && findCreepWithoutTask()) {

                    findCreepWithoutTask().memory.task = "droppedEnergy"
                }
            }

            let powerSpawn = room.find(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_POWER_SPAWN
            })[0]

            if (powerSpawn && (powerSpawn.store.getUsedCapacity(RESOURCE_ENERGY) < powerSpawn.store.getCapacity(RESOURCE_ENERGY) ||
                    powerSpawn.store.getUsedCapacity(RESOURCE_POWER) < powerSpawn.store.getCapacity(RESOURCE_POWER)) &&
                ((terminal && terminal.store[RESOURCE_POWER] >= powerSpawn.store.getUsedCapacity(RESOURCE_POWER) - powerSpawn.store.getCapacity(RESOURCE_POWER) &&
                        terminal.store[RESOURCE_ENERGY] >= powerSpawn.store.getUsedCapacity(RESOURCE_ENERGY) - powerSpawn.store.getCapacity(RESOURCE_ENERGY)) ||
                    (storage && storage.store[RESOURCE_POWER] >= powerSpawn.store.getUsedCapacity(RESOURCE_POWER) - powerSpawn.store.getCapacity(RESOURCE_POWER) &&
                        storage.store[RESOURCE_ENERGY] >= powerSpawn.store.getUsedCapacity(RESOURCE_ENERGY) - powerSpawn.store.getCapacity(RESOURCE_ENERGY)))) {

                if (!findCreepWithTask("fillPowerSpawn", 1) && findCreepWithoutTask()) {

                    findCreepWithoutTask().memory.task = "fillPowerSpawn"
                }
            }

            for (let object of haulers) {

                if (object.roomFrom == room.name) {

                    roleHauler.run(object.creep)
                }
            }
        }
    }
};