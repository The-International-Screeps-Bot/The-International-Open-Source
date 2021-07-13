module.exports = {
    run: function(creep) {

        creep.isFull()

        if (creep.memory.isFull) {

            let structure = Game.getObjectById(creep.memory.target)

            if (structure && structure.hits < (structure.hitsMax - creep.myParts("work") * 100)) {

                creep.repairStructure(structure)

            } else {

                let lowLogisticStructures = creep.room.find(FIND_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_ROAD) && s.hits <= (s.hitsMax - creep.myParts("work") * 100)
                })

                if (lowLogisticStructures.length > 0) {

                    let lowLogisticStructure = creep.pos.findClosestByRange(lowLogisticStructures)

                    creep.memory.target = lowLogisticStructure.id
                }
            }
        } else {

            let storage = creep.room.storage

            if (storage && storage.store[RESOURCE_ENERGY] >= 5000) {

                creep.say("S")

                creep.advancedWithdraw(storage)

            } else {

                let terminal = creep.room.terminal

                if (terminal && terminal.store[RESOURCE_ENERGY] >= 5000) {

                    creep.say("T")

                    creep.advancedWithdraw(terminal)

                } else {

                    creep.searchSourceContainers()

                    if (creep.container) {

                        creep.say("SC")

                        creep.advancedWithdraw(creep.container)
                    }
                }
            }
        }

        creep.avoidHostiles()
    }
};