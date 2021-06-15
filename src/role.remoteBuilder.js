var AttackWhitelist = ["cplive", "marvintmb"];
module.exports = {
    run: function(creep) {

        let target = creep.memory.roomFrom

        let remoteRooms = []

        _.forEach(Game.rooms, function(myRooms) {

            if (myRooms.memory.builderNeed == true && myRooms.memory.myRoom != false) {

                //console.log("true")
                let remoteRoomDistance = Game.map.getRoomLinearDistance(creep.room.name, myRooms.name)

                if (remoteRoomDistance == 1) {

                    creep.memory.target = myRooms.name
                    remoteRooms.push(myRooms)

                }
            }
        })

        if (remoteRooms.length == 0) {

            creep.memory.target = creep.memory.roomFrom

        }

        creep.say(target)

        if (creep.room.memory.builderNeed == true) {

            if (creep.memory.building != false && creep.memory.building != true) {

                creep.memory.building = false

            } else if (creep.memory.building == true && creep.carry.energy == 0) {

                creep.memory.building = false;

            } else if (creep.memory.building == false && creep.carry.energy == creep.carryCapacity) {

                creep.memory.building = true;

            }
            if (creep.memory.building == true) {

                creep.say("F1")

                var constructionSite = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)

                if (constructionSite) {

                    creep.say("🚧")

                    if (creep.build(constructionSite) == ERR_NOT_IN_RANGE) {

                        creep.moveTo(constructionSite, { reusePath: 50 });

                    }
                } else {

                    var structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (s) => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_ROAD) && s.hits < s.hitsMax
                    })

                    creep.say("🔧")

                    if (creep.repair(structure) == ERR_NOT_IN_RANGE) {

                        creep.moveTo(structure, { reusePath: 50 }, { visualizePathStyle: { stroke: '#ffffff' } });

                    } else if (creep.room.memory.builderNeed == true && !constructionSite && !structure) {

                        creep.room.memory.builderNeed = false

                    }
                }
            } else {

                creep.say("F2")

                var container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] >= creep.store.getCapacity()
                })

                creep.say("🛄")

                if (container) {
                    if (creep.withdraw(container, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {

                        creep.moveTo(container, { reusePath: 50 }, { visualizePathStyle: { stroke: '#ffffff' } })
                            /*
                            const path = creep.room.findPath(creep.pos, container.pos, { maxOps: 200 })
                        
                            creep.moveByPath(path)
                        */
                    }
                } else {

                    var droppedResources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                        filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= creep.store.getCapacity() * 0.5
                    })

                    creep.say("💡")

                    if (creep.pickup(droppedResources) == ERR_NOT_IN_RANGE) {

                        creep.moveTo(droppedResources, { reusePath: 50 }, { visualizePathStyle: { stroke: '#ffffff' } })
                            /*
                            const path = creep.room.findPath(creep.pos, container.pos, { maxOps: 200 })
                        
                            creep.moveByPath(path)
                        */
                    } else {

                        var source = creep.pos.findClosestByRange(FIND_SOURCES)

                        creep.say("🔦");
                        if (!creep.pos.inRangeTo(source, 1)) {

                            creep.moveTo(source, { reusePath: 50 })

                        } else {

                            creep.harvest(source)

                        }
                    }
                }
            }
        } else {
            if (creep.memory.target == creep.memory.roomFrom) {

                target = creep.memory.roomFrom

                if (creep.room.name != target) {

                    creep.say("0")

                    target = creep.memory.roomFrom

                    let path = Game.map.findRoute(creep.room, target);
                    creep.memory.path = path
                    let route = creep.memory.path

                    if (route.length > 0) {

                        creep.say(target)

                        const exit = creep.pos.findClosestByRange(route[0].exit)
                        creep.moveTo(exit)
                    }
                } else if (creep.room.name == target) {

                    creep.say(target)

                    let spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS)

                    creep.moveTo(spawn)

                }
            } else {

                target = creep.memory.target

                let path = Game.map.findRoute(creep.room, target);
                creep.memory.path = path
                let route = creep.memory.path

                if (route.length > 0) {

                    creep.say(target)

                    const exit = creep.pos.findClosestByRange(route[0].exit)
                    creep.moveTo(exit)

                }

            }
        }
    }
};