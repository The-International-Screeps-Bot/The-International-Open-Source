var roleBuilder = require('role.builder');

module.exports = {
    run: function(creep) {
        
        creep.checkRoom()

        var lowLogisticStructure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
            filter: (s) => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_ROAD) && s.hits < s.hitsMax * 0.5
        })

        if (!lowLogisticStructure) {

            roleBuilder.run(creep)

        }
        else {
            if (creep.memory.hasEnergy == true) {
    
                creep.say("🔧")
                
                let target = lowLogisticStructure
    
                creep.repairLogisticStructures(target)
            }
            else {
                
                let storage = creep.room.storage
                
                if (storage) {
                    
                    creep.say("S 5k")
                    
                    let target = storage
                    
                    if (target.store[RESOURCE_ENERGY] >= 5000) {
                        
                        creep.energyWithdraw(target)
                    }
                }
                else {
                    
                    creep.searchSourceContainers()
                    
                    if (creep.container != null && creep.container) {
                        
                        creep.say("SC")
                        
                        let target = creep.container
                        
                        creep.energyWithdraw(target)
                    }
                }
            }
        }
    }
};