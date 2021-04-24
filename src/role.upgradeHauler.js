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

            if (creep.memory.fullEnergy == true && creep.carry.energy == 0) {

                creep.memory.fullEnergy = false;

            } else if (creep.memory.fullEnergy == false && creep.carry.energy == creep.carryCapacity) {

                creep.memory.fullEnergy = true;

            }
            if (creep.memory.fullEnergy == true) {

                let controllerLink = Game.getObjectById(creep.room.memory.controllerLink)
                
                if (controllerLink != null && controllerLink.store[RESOURCE_ENERGY] <= 100) {
                    
                    if (creep.transfer(controllerLink, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        
                        creep.moveTo(controllerLink, {reusePath: 50})
                    }
                }
            } else {

                let terminal = creep.room.terminal
                
                if (terminal && terminal.store[RESOURCE_ENERGY] >= 80000) {
                    
                    if (creep.withdraw(terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                        
                        creep.moveTo(terminal, {reusePath: 50})
                    }
                }
        }
    }
};