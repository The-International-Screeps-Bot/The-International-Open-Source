var AttackWhitelist = ["cplive", "marvintmb", "slowmotionghost"];
module.exports = {
    run: function(creep) {

        var remoteRoom = creep.memory.remoteRoom


        if (remoteRoom == creep.room.name) {

            creep.room.memory.stage = "remoteRoom";

            let sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
            let sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)

            let source1 = Game.getObjectById(creep.room.memory.source1)
            let source2 = Game.getObjectById(creep.room.memory.source2)

            if (sourceContainer1) {

                creep.say("⛏️ 1")

                if (creep.harvest(source1) == ERR_NOT_IN_RANGE) {

                    creep.moveTo(sourceContainer1, { reusePath: 50 }, { visualizePathStyle: { stroke: '#ffffff' } })

                }
            } else if (sourceContainer2) {

                creep.say("⛏️ 2")

                if (creep.harvest(source2) == ERR_NOT_IN_RANGE) {

                    creep.moveTo(sourceContainer2, { reusePath: 50 }, { visualizePathStyle: { stroke: '#ffffff' } })

                }
            } else {

                var altSource = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)

                creep.say("⛏️ 3")

                if (creep.harvest(altSource) == ERR_NOT_IN_RANGE) {

                    creep.moveTo(altSource, { reusePath: 50 }, { visualizePathStyle: { stroke: '#ffffff' } });

                }
            }

            //targets
            var hostileCreep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: (c) => {
                    return (AttackWhitelist.indexOf(c.owner.username.toLowerCase()) === -1);
                }
            })
            var hostileStructure = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                filter: (c) => {
                    return (AttackWhitelist.indexOf(c.owner.username.toLowerCase()) === -1);
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
                
                Game.rooms[creep.memory.roomFrom].memory.remoteRooms.sources = 2
            }
            else {
                
                Game.rooms[creep.memory.roomFrom].memory.remoteRooms.sources = 1
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