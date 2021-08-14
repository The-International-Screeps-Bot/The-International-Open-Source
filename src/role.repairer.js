module.exports = {
    run: function(creep) {

        creep.isFull()

        if (creep.memory.isFull) {

            let lowLogisticStructure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s) => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_ROAD) && s.hits <= (s.hitsMax - creep.findParts("work") * 100)
            })

            if (lowLogisticStructure) {

                creep.repairStructure(lowLogisticStructure)
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