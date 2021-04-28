module.exports = {
    run: function(creep) {
        
        creep.checkRoom()
        
        creep.hasEnergy()
            
        if (creep.memory.hasEnergy == true) {
    
            if (creep.memory.quota) {

                creep.say(creep.memory.quota.toFixed(0) / 1000 + "k")
            }
            
            creep.barricadesFindAndRepair()

        } else {
                
                let storage = creep.room.storage
                
                if (storage) {
                    
                    creep.say("S 10k")
                    
                    let target = storage
                    
                    if (target.store[RESOURCE_ENERGY] >= 10000) {
                        
                        creep.energyWithdraw(target)
                    }
                }
                else {

                    creep.searchSourceContainers()
                            
                        if (creep.container != null && creep.container) {
                                
                            creep.say("SC")
                                
                            let target = creep.container
                                
                            creep.energyWithdraw(target)
                    } else {
        
                        let droppedResources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                            filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= creep.store.getCapacity() * 0.5
                        });
        
                        if (droppedResources) {
        
                            creep.say("💡")
                            
                            target = droppedResources
        
                            creep.pickupDroppedEnergy(target)
                        }
                    }
                }
            }
    }
};