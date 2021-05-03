module.exports = {
    run: function(creep) {
        
        creep.checkRoom()

        if (creep.memory.role == "harvester1") {
            
            let sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
            let source1 = Game.getObjectById(creep.room.memory.source1)
            
            if (sourceContainer1) {

                creep.say("⛏️ 1")

                if (creep.pos.inRangeTo(sourceContainer1, 0)) {

                    creep.harvest(source1)

                } else {
                    
                    let origin = creep.pos
                    let goal = _.map([sourceContainer1], function(target) {
                        return { pos: target.pos, range: 0 }
                    })
                    
                    creep.intraRoomPathing(origin, goal)

                }
            }
            else {
                
                creep.say("⛏️ 3")
                
                if (source1 != null && creep.pos.inRangeTo(source1, 1)) {

                    
                    creep.harvest(source1)

                } else {
                    
                    let origin = creep.pos
                    let goal = _.map([source1], function(target) {
                        return { pos: target.pos, range: 1 }
                    })
                    
                    creep.intraRoomPathing(origin, goal)

                }
            }
        } else if (creep.memory.role == "harvester2") {
            
            let sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)
            let source2 = Game.getObjectById(creep.room.memory.source2)
            
            if (sourceContainer2) {

                creep.say("⛏️ 2")

                if (creep.pos.inRangeTo(sourceContainer2, 0)) {

                    creep.harvest(source2)

                } else {
                    
                    let origin = creep.pos
                    let goal = _.map([sourceContainer2], function(target) {
                        return { pos: target.pos, range: 0 }
                    })
                    
                    creep.intraRoomPathing(origin, goal)

                }
            }
            else {
                
                creep.say("⛏️ 4")
                
                if (source2 != null && creep.pos.inRangeTo(source2, 1)) {

                    
                    creep.harvest(source2)

                } else {
                    
                    let origin = creep.pos
                    let goal = _.map([source2], function(target) {
                        return { pos: target.pos, range: 1 }
                    })
                    
                    creep.intraRoomPathing(origin, goal)

                }
            }
        }
        
        let baseLink = Game.getObjectById(creep.room.memory.baseLink)
        
        if (baseLink != null && creep.store.getUsedCapacity() <= creep.myParts("work") * 2) {
                
            let sourceLink1 = Game.getObjectById(creep.room.memory.sourceLink1)
            let sourceLink2 = Game.getObjectById(creep.room.memory.sourceLink2)
                
            let closestLink = creep.pos.findClosestByRange([sourceLink1, sourceLink2])
                
              if (closestLink && closestLink.store[RESOURCE_ENERGY] < 800) {

                creep.transfer(closestLink, RESOURCE_ENERGY)
            }
        }
    }
};