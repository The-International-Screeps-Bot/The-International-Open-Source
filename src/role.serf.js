module.exports = {
    run: function(creep) {
        if (creep.memory.working == true && creep.carry.energy == 0) {

            creep.memory.working = false;

        } else if (creep.memory.working == false && creep.carry.energy == creep.carryCapacity) {

            creep.memory.working = true;
        }

        if (creep.memory.working == false) {

            var baseLink = Game.getObjectById(creep.room.memory.baseLink)

            creep.say("W")

            if (baseLink && baseLink.store[RESOURCE_ENERGY] >= 700) {

                creep.say("BL")

                if (creep.withdraw(baseLink, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                    creep.moveTo(baseLink, { reusePath: 50 })

                }
            } else {

                if (!creep.pos.isNearTo(baseLink)) {

                    creep.moveTo(baseLink, { reusePath: 50 })

                }
            }
        } else {

            var storage = creep.room.storage
            creep.say("T")

            if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                creep.moveTo(storage, { reusePath: 50 })

            }
        }
    }
};