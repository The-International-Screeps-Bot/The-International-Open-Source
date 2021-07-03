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

                    creep.constructionBuild(constructionSite)
                } else {

                    var structure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (s) => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_ROAD) && s.hits < s.hitsMax
                    })

                    if (structure) {

                        creep.say("🔧")

                        creep.repairStructure(lowLogisticStructure)

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
                    creep.advancedWithdraw(container)
                } else {

                    var droppedResources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                        filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= creep.store.getCapacity() * 0.5
                    })

                    if (droppedResources) {

                        creep.say("💡")

                        creep.pickupDroppedEnergy(droppedResources)

                    } else {

                        var source = creep.pos.findClosestByRange(FIND_SOURCES)

                        creep.say("🔦");
                        if (creep.pos.getRangeTo(source) > 1) {

                            let goal = _.map([source], function(target) {
                                return { pos: target.pos, range: 1 }
                            })

                            creep.intraRoomPathing(creep.pos, goal)

                        } else {

                            if (creep.harvest(source) == 0) {

                                creep.findEnergyHarvested(source)
                            }
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

                    if (spawn && creep.pos.getRangeTo(spawn) > 1) {

                        let goal = _.map([spawn], function(target) {
                            return { pos: target.pos, range: 1 }
                        })

                        creep.intraRoomPathing(creep.pos, goal)
                    }
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

        creep.avoidHostiles()
    }
};