module.exports = {
    run: function(creep) {
        
        //Not on a if full / not full basis, but instead commands. If baseLink is full, run baseLink function. If power spawn is empty and we have energy and power in storage or terminal, fill it. Etc.
        
        creep.checkRoom()
        
        creep.hasEnergy()
        
        let baseLink = Game.getObjectById(creep.room.memory.baseLink)
        let terminal = creep.room.terminal
        let storage = creep.room.storage
        
        const stationaryPos = creep.room.memory.stationaryPos
    
        if (stationaryPos == null && baseLink != null && terminal && storage) {
                
            for (let x = 5; x <= 45; x++) {
                for (let y = 5; y <= 45; y++) {
                    
                    let position = new RoomPosition(x, y, creep.room.name)
            
                    if (position.inRangeTo(baseLink, 1) && position.inRangeTo(terminal, 1) && position.inRangeTo(storage, 1)) {
                        
                        creep.room.memory.stationaryPos = position
                        break
                    }
                }
            }
        }
        else {
            
            if (creep.pos != stationaryPos) {
                
                let origin = creep.pos
                        
                let goal = _.map([stationaryPos], function(target) {
                    return { pos: target, range: 0 }
                })
                        
                creep.intraRoomPathing(origin, goal)
            }
            
            if (creep.memory.hasEnergy == false && stationaryPos != null && baseLink != null && terminal && storage && creep.pos.inRangeTo(baseLink, 1) && creep.pos.inRangeTo(terminal, 1) && creep.pos.inRangeTo(storage, 1)) {
    
                if (baseLink.store[RESOURCE_ENERGY] >= 700) {
            
                    creep.say("BL")
            
                    creep.withdraw(baseLink, RESOURCE_ENERGY)
                }
                else {
                        
                    if (terminal && terminal.store[RESOURCE_ENERGY] >= 125000) {
                        
                        creep.withdraw(terminal, RESOURCE_ENERGY)
                    }
                }
            }
            else {
                
                /*
                let powerSpawn = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_POWER_SPAWN
                })
                
                if (powerSpawn && (powerSpawn)
                */
    
                let storage = creep.room.storage
                
                if (storage && storage.store[RESOURCE_ENERGY] <= 400000) {
                    
                    creep.transfer(storage, RESOURCE_ENERGY)
                }
            }
        }
    }
};