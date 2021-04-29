module.exports = {
    run: function(creep) {
        
        
        /*

        if (creep.carry.energy == creep.carryCapacity) {

            let storage = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] <= 500000
            });

            let structure = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_TERMINAL && s.store[RESOURCE_ENERGY] <= 150000
            });

            let target = Game.flags.RR;

            if (creep.room != target.room && target) {

                creep.say("⬅️")

                creep.moveTo(target, { reusePath: 500 });

            } else if (storage && creep.room == target.room && target) {

                creep.say("S")

                if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                    creep.moveTo(storage, { reusePath: 500 });
                }
            } else if (terminal) {

                creep.say("S")

                if (creep.transfer(terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                    creep.moveTo(terminal, { reusePath: 500 });
                }
            }

        } else {

            let enemyStorage = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_STORAGE
            });

            var target = Game.flags.R;
            if (target == undefined) {

                creep.suicide()

            }
            if (enemyStorage && creep.room == target.room) {

                creep.say("Enemy S");

                if (creep.withdraw(enemyStorage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                    creep.moveTo(enemyStorage, { reusePath: 500 });
                }
            } else if (creep.room != target.room && target) {

                creep.say("⬅️")

                creep.moveTo(target, { reusePath: 500 });

            }
        }
        */
    }
};