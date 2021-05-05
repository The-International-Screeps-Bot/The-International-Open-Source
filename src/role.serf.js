module.exports = {
    run: function(creep) {
        
        //Not on a if full / not full basis, but instead commands. If baseLink is full, run baseLink function. If power spawn is empty and we have energy and power in storage or terminal, fill it. Etc.
        
        creep.checkRoom()
        
        creep.hasEnergy()

        if (creep.memory.hasEnergy == false) {

            var baseLink = Game.getObjectById(creep.room.memory.baseLink)

            if (baseLink != null && baseLink.store[RESOURCE_ENERGY] >= 700) {
    
                creep.say("BL")
    
                if (creep.withdraw(baseLink, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
    
                    creep.moveTo(baseLink, { reusePath: 50 })
                }
            }
            else {
                
                let terminal = creep.room.terminal
                
                if (terminal && terminal.store[RESOURCE_ENERGY] >= 125000) {
                    
                    if (creep.withdraw(terminal, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
    
                        creep.moveTo(terminal, { reusePath: 50 })
                    }
                }
                
                else {
    
                    if (!creep.pos.isNearTo(baseLink)) {
    
                        creep.moveTo(baseLink, { reusePath: 50 })
    
                    }
                }
            }
        } else {
            
            /*
            let powerSpawn = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_POWER_SPAWN
            })
            
            if (powerSpawn && (powerSpawn)
            */

            var storage = creep.room.storage
            
            if (storage && storage.store[RESOURCE_ENERGY] <= 400000) {
                if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
    
                    creep.moveTo(storage, { reusePath: 50 })
    
                }
            }
        }
    }
};