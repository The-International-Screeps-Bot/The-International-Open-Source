let allyList = require("module.allyList")

module.exports = {
    run: function(creep) {

        var remoteRoom = creep.memory.remoteRoom

        if (remoteRoom == creep.room.name) {

            creep.room.memory.stage = "remoteRoom";

            let source1 = Game.getObjectById(creep.room.memory.source1)
            let source2 = Game.getObjectById(creep.room.memory.source2)

            if (!source1) {

                let sources = creep.room.find(FIND_SOURCES)[0]

                creep.room.memory.source1 = sources.id

            }
            if (!source2) {

                let sources = creep.room.find(FIND_SOURCES)[1]

                if (sources) {

                    creep.room.memory.source2 = sources.id
                }
            }

            let sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
            let sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)

            if (!sourceContainer1) {

                let container = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER
                })[0]

                if (container) {

                    creep.room.memory.sourceContainer1 = container.id
                }
            }
            if (!sourceContainer2) {

                let container = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER
                })[1]

                if (container) {

                    creep.room.memory.sourceContainer2 = container.id
                }
            }

            if (creep.memory.role == "remoteHarvester1") {

                let closestSource = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)

                if (sourceContainer1 != null) {

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
            } else if (creep.memory.role == "remoteHarvester2") {

                let closestSource = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)

                if (sourceContainer2 != null) {

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
            }

            //targets
            var hostileCreep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: (c) => {
                    return (allyList.run().indexOf(c.owner.username.toLowerCase()) === -1 && (c.getActiveBodyparts(ATTACK) != 0 || c.getActiveBodyparts(RANGED_ATTACK) != 0))
                }
            })
            var hostileStructure = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                filter: (c) => {
                    return (allyList.run().indexOf(c.owner.username.toLowerCase()) === -1)
                }
            })

            var constructionSite = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES)

            var structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                filter: (s) => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_ROAD) && s.hits < s.hitsMax * 0.5
            })

            if (hostileCreep || hostileStructure) {

                creep.room.memory.enemy = true

            } else {

                creep.room.memory.enemy = false

            }
            if (constructionSite || structure) {

                creep.room.memory.builderNeed = true

            }

            let sources = creep.room.find(FIND_SOURCES)

            if (sources.length == 2) {

                for (let object of Game.rooms[creep.memory.roomFrom].memory.remoteRooms) {

                    if (object.name == creep.room.name) {

                        object.sources = 2
                    }
                }
            }
        } else {

            creep.memory.target = remoteRoom
            const route = Game.map.findRoute(creep.room, remoteRoom);

            if (route.length > 0) {

                creep.say(creep.memory.target)

                const exit = creep.pos.findClosestByRange(route[0].exit);
                creep.moveTo(exit);
            }
        }
    }
};