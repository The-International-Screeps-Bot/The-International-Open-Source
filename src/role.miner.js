module.exports = {
    run: function(creep) {
        
        if (creep.memory.roomFrom && creep.room.name != creep.memory.roomFrom) {

                const route = Game.map.findRoute(creep.room.name, creep.memory.roomFrom);

                if (route.length > 0) {

                    creep.say(creep.memory.roomFrom)

                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.moveTo(exit);
                }
            }

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