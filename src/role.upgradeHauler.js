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

        if (creep.memory.isFull == true && creep.carry.energy == 0) {

            creep.memory.isFull = false;

        } else if (creep.memory.isFull == false && creep.carry.energy == creep.carryCapacity) {

            creep.memory.isFull = true;

        }
        if (creep.memory.isFull == true) {

            let controllerLink = Game.getObjectById(creep.room.memory.controllerLink)

            if (controllerLink != null) {

                if (creep.transfer(controllerLink, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                    creep.moveTo(controllerLink, { reusePath: 50 })
                }
            }
        } else {

            let terminal = creep.room.terminal

            if (terminal && terminal.store[RESOURCE_ENERGY] >= 80000) {

                if (creep.withdraw(terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                    creep.moveTo(terminal, { reusePath: 50 })
                }
            }
        }
    }
};