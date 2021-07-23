var AttackWhitelist = ["cplive", "marvintmb"];
module.exports = {
    run: function(creep) {

        const roomFrom = creep.memory.roomFrom
        let remoteRoom

        _.forEach(Game.rooms, function(unfilteredRoom) {

            if (unfilteredRoom.memory.stage == "remoteRoom" && unfilteredRoom.memory.builderNeed == true) {

                let remoteRoomDistance = Game.map.getRoomLinearDistance(creep.memory.roomFrom, unfilteredRoom.name)

                if (remoteRoomDistance == 1) {

                    remoteRoom = unfilteredRoom.name
                }
            }
        })

        creep.memory.remoteRoom = remoteRoom

        if (remoteRoom) {

            if (creep.room.name == remoteRoom) {

                creep.isFull()

                if (creep.memory.isFull) {

                    let lowLogisticStructure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: (s) => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_ROAD) && s.hits <= (s.hitsMax - creep.myParts("work") * 100)
                    })

                    if (lowLogisticStructure) {

                        creep.repairStructure(lowLogisticStructure)

                    } else {

                        let constructionSite = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)

                        if (constructionSite) {

                            creep.say("🚧")

                            creep.constructionBuild(constructionSite)

                        } else if (creep.room.memory.builderNeed == true && !constructionSite && !lowLogisticStructure) {

                            creep.memory.remoteRoom = false

                            creep.room.memory.builderNeed = false
                        }
                    }
                } else {

                    let container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity()
                    })

                    if (container) {

                        creep.say("🛄")

                        creep.advancedWithdraw(container)

                    } else {

                        let droppedResources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                            filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= creep.store.getFreeCapacity() * 0.5
                        });

                        if (droppedResources) {

                            creep.say("💡")

                            creep.pickupDroppedEnergy(droppedResources)

                        } else {

                            let closestSource = creep.pos.findClosestByRange(FIND_SOURCES)

                            creep.say("🔦")

                            if (creep.pos.getRangeTo(closestSource) > 3) {

                                let goal = _.map([closestSource], function(target) {
                                    return { pos: target.pos, range: 1 }
                                })

                                creep.intraRoomPathing(creep.pos, goal)

                            } else {

                                let goal = _.map([closestSource], function(target) {
                                    return { pos: target.pos, range: 3 }
                                })

                                creep.creepFlee(creep.pos, goal)
                            }
                        }
                    }
                }
            } else {

                creep.say(remoteRoom)

                let goal = _.map([new RoomPosition(25, 25, remoteRoom)], function(target) {
                    return { pos: target, range: 24 }
                })

                creep.onlySafeRoomPathing(creep.pos, goal, ["enemyRoom", "keeperRoom", "enemyReservation"])
            }
        } else {
            if (creep.room.name == roomFrom) {

                creep.say("🚬")

                let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_RAMPART
                })

                if (ramparts.length > 0) {

                    let outerRampart

                    let cm = PathFinder.CostMatrix.deserialize(creep.room.memory.defaultCostMatrix)

                    for (let rampart of ramparts) {

                        if (cm && cm.get(rampart.pos.x, rampart.pos.y) < 255) {

                            outerRampart = rampart
                            break
                        }
                    }

                    if (outerRampart) {

                        let goal = _.map([outerRampart], function(target) {
                            return { pos: target.pos, range: 0 }
                        })

                        if (creep.fatigue == 0) {

                            creep.intraRoomPathing(creep.pos, goal)
                        }
                    }
                } else {

                    let spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS)

                    if (spawn && creep.pos.getRangeTo(spawn) > 5) {

                        let goal = _.map([spawn], function(target) {
                            return { pos: target.pos, range: 5 }
                        })

                        creep.intraRoomPathing(creep.pos, goal)
                    }
                }
            } else {

                creep.say("🚬")

                let goal = _.map([new RoomPosition(25, 25, roomFrom)], function(target) {
                    return { pos: target, range: 24 }
                })

                creep.onlySafeRoomPathing(creep.pos, goal, ["enemyRoom", "keeperRoom", "enemyReservation"])

            }
        }

        creep.avoidHostiles()
    }
}