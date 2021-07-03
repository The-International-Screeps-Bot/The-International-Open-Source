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

                if (baseLink != null && creep.store.getUsedCapacity() >= 100 - creep.myParts("work")) {

                    let sourceLink1 = Game.getObjectById(creep.room.memory.sourceLink1)

                    if (sourceLink1 != null && sourceLink1.store[RESOURCE_ENERGY] < 800) {
                        console.log(creep.transfer(sourceLink1, RESOURCE_ENERGY))

                        creep.transfer(sourceLink1, RESOURCE_ENERGY)
                    }
                }

                let sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
                let source1 = Game.getObjectById(creep.room.memory.source1)

                if (sourceContainer1 != null && source1 != null) {

                    creep.say("⛏️ 1")

                    if (creep.pos.inRangeTo(sourceContainer1, 0)) {

                        if (creep.harvest(source1) == 0) {

                            creep.findEnergyHarvested(source1)
                        }

                    } else {

                        let origin = creep.pos
                        let goal = _.map([sourceContainer1], function(target) {
                            return { pos: target.pos, range: 0 }
                        })

                        creep.intraRoomPathing(origin, goal)

                    }
                } else if (source1 != null) {

                    creep.say("⛏️ 3")

                    if (creep.pos.inRangeTo(source1, 1)) {


                        if (creep.harvest(source1) == 0) {

                            creep.findEnergyHarvested(source1)
                        }

                    } else {

                        let origin = creep.pos
                        let goal = _.map([source1], function(target) {
                            return { pos: target.pos, range: 1 }
                        })

                        creep.intraRoomPathing(origin, goal)

                    }
                }
            } else if (creep.memory.role == "remoteHarvester2") {

                if (baseLink != null && creep.store.getUsedCapacity() >= 100 - creep.myParts("work")) {

                    let sourceLink2 = Game.getObjectById(creep.room.memory.sourceLink2)

                    if (sourceLink2 != null && sourceLink2.store[RESOURCE_ENERGY] < 800) {

                        creep.transfer(sourceLink2, RESOURCE_ENERGY)
                    }
                }

                let sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)
                let source2 = Game.getObjectById(creep.room.memory.source2)

                if (sourceContainer2 != null && source2 != null) {

                    creep.say("⛏️ 2")

                    if (creep.pos.inRangeTo(sourceContainer2, 0)) {

                        if (creep.harvest(source2) == 0) {

                            creep.findEnergyHarvested(source2)
                        }

                    } else {

                        let origin = creep.pos
                        let goal = _.map([sourceContainer2], function(target) {
                            return { pos: target.pos, range: 0 }
                        })

                        creep.intraRoomPathing(origin, goal)

                    }
                } else if (source2 != null) {

                    creep.say("⛏️ 4")

                    if (creep.pos.inRangeTo(source2, 1)) {

                        if (creep.harvest(source2) == 0) {

                            creep.findEnergyHarvested(source2)
                        }

                    } else {

                        let goal = _.map([source2], function(target) {
                            return { pos: target.pos, range: 1 }
                        })

                        creep.intraRoomPathing(creep.pos, goal)

                    }
                }
            }

            //targets
            var hostileCreep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: (c) => {
                    return (allyList.run().indexOf(c.owner.username.toLowerCase()) === -1 && (c.body.some(i => i.type === ATTACK) || c.body.some(i => i.type === RANGED_ATTACK) || c.body.some(i => i.type === WORK)))
                }
            })
            var hostileStructure = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                filter: (c) => {
                    return (allyList.run().indexOf(c.owner.username.toLowerCase()) === -1)
                }
            })

            var constructionSite = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)

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

        creep.avoidHostiles()
    }
};