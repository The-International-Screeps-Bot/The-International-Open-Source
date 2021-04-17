module.exports = {
    run: function(creep) {

        let source = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE);

        let sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
        let sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)

        let sourceLink1 = Game.getObjectById(creep.room.memory.sourceLink1)
        let sourceLink2 = Game.getObjectById(creep.room.memory.sourceLink2)

        let source1 = Game.getObjectById(creep.room.memory.source1)
        let source2 = Game.getObjectById(creep.room.memory.source2)

        if (!source1 && !source2) {

            let sources = creep.room.find(FIND_SOURCES)

            creep.room.memory.source1 = sources[0].id
            creep.room.memory.source2 = sources[1].id

        }

        if (creep.memory.role == "harvester1") {
            if (sourceContainer1) {

                creep.say("⛏️ 1")

                if (creep.pos.inRangeTo(sourceContainer1, 0)) {

                    creep.harvest(source)

                } else {

                    creep.moveTo(sourceContainer1, { reusePath: 50 })

                }
            } else {

                creep.moveTo(source1, { reusePath: 50 })
                creep.harvest(source1);
                creep.say("⛏️ 3")

            }
            if (creep.store[RESOURCE_ENERGY] >= creep.store.getCapacity() - 10) {
                if (sourceLink1) {

                    creep.transfer(sourceLink1, RESOURCE_ENERGY)

                } else if (sourceContainer1) {

                    creep.transfer(sourceContainer1, RESOURCE_ENERGY)

                }
            }
        } else if (creep.memory.role == "harvester2") {
            if (sourceContainer2) {

                creep.say("⛏️ 2")

                if (creep.pos.inRangeTo(sourceContainer2, 0)) {

                    creep.harvest(source)

                } else {

                    creep.moveTo(sourceContainer2, { reusePath: 50 })

                }
            } else {

                creep.moveTo(source2, { reusePath: 50 })
                creep.harvest(source2);
                creep.say("⛏️ 4")

            }
            if (creep.store[RESOURCE_ENERGY] >= creep.store.getCapacity() - 10) {
                if (sourceLink2) {

                    creep.transfer(sourceLink2, RESOURCE_ENERGY)

                } else if (sourceContainer2) {

                    creep.transfer(sourceContainer2, RESOURCE_ENERGY)

                }
            }
        }
    }
};