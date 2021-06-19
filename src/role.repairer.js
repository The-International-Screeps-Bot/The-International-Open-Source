module.exports = {
    run: function(creep) {

        creep.isFull()

        if (creep.memory.isFull == true) {

            let lowLogisticStructures = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_ROAD) && s.hits <= (s.hitsMax - creep.myParts("work") * 100)
            })

            if (lowLogisticStructures.length > 0) {

                let lowLogisticStructure = creep.pos.findClosestByRange(lowLogisticStructures)

                creep.repairStructure(lowLogisticStructure)
            }
        } else {

            let storage = creep.room.storage

            if (storage) {

                creep.say("S 5k")

                let target = storage

                if (target.store[RESOURCE_ENERGY] >= 5000) {

                    creep.advancedWithdraw(target)
                }
            } else {

                creep.searchSourceContainers()

                if (creep.container != null && creep.container) {

                    creep.say("SC")

                    let target = creep.container

                    creep.advancedWithdraw(target)
                }
            }
        }

        creep.avoidHostiles()
    }
};