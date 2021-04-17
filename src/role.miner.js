module.exports = {
    run: function(creep) {

        let target = creep.pos.findClosestByRange(FIND_MINERALS)
        let mineral = creep.memory.mineral = target.mineralType

        if (creep.memory.mining == true && creep.carryCapacity == _.sum(creep.carry)) {

            creep.memory.mining = false;

        }

        if (creep.memory.mining == false && 0 == _.sum(creep.carry)) {

            creep.memory.mining = true;

        }

        if (creep.memory.mining == true) {

            creep.say("⛏️");

            if (creep.harvest(target) == ERR_NOT_IN_RANGE) {

                creep.moveTo(target, { reusePath: 50 })

            }
        } else {

            var terminal = creep.room.terminal

            creep.say(_.sum(creep.store) + " " + mineral)

            if (terminal /* && _.sum(terminal.store) <= 250000*/ && creep.transfer(terminal, mineral) == ERR_NOT_IN_RANGE) {

                creep.moveTo(terminal, { reusePath: 50 })

            }
        }
    }
};