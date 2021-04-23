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

        let source1 = Game.getObjectById(creep.room.memory.source1)
        let source2 = Game.getObjectById(creep.room.memory.source2)

        if (!source1 && !source2) {

            let sources = creep.room.find(FIND_SOURCES)
            
            if (sources[0]) {
            
                creep.room.memory.source1 = sources[0].id
            }
            if (sources[1]) {
            
                creep.room.memory.source2 = sources[1].id
            }
        }

        if (creep.memory.role == "harvester1") {
            
            let sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
            let closestSource = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)
            
            if (sourceContainer1) {

                creep.say("⛏️ 1")

                if (creep.pos.inRangeTo(sourceContainer1, 0)) {

                    creep.harvest(closestSource)

                } else {

                    creep.moveTo(sourceContainer1, { reusePath: 50 })

                }
            } else {

                creep.moveTo(source1, { reusePath: 50 })
                creep.harvest(source1);
                creep.say("⛏️ 3")

            }
            if (creep.store[RESOURCE_ENERGY] >= creep.store.getCapacity() - 10) {
                
                let sourceLink1 = Game.getObjectById(creep.room.memory.sourceLink1)
                
                if (sourceLink1) {

                    creep.transfer(sourceLink1, RESOURCE_ENERGY)

                }
            }
        } else if (creep.memory.role == "harvester2") {
            
            let sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)
            let closestSource = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)
            
            if (sourceContainer2) {

                creep.say("⛏️ 2")

                if (creep.pos.inRangeTo(sourceContainer2, 0)) {

                    creep.harvest(closestSource)

                } else {

                    creep.moveTo(sourceContainer2, { reusePath: 50 })

                }
            } else {

                creep.moveTo(source2, { reusePath: 50 })
                creep.harvest(source2);
                creep.say("⛏️ 4")

            }
            if (creep.store[RESOURCE_ENERGY] >= creep.store.getCapacity() - 10) {
                
                let sourceLink2 = Game.getObjectById(creep.room.memory.sourceLink2)
                
                if (sourceLink2) {

                    creep.transfer(sourceLink2, RESOURCE_ENERGY)

                }
            }
        }
    }
};