var AttackWhitelist = ["cplive", "marvintmb"];
module.exports = {
    run: function(creep) {

        const roomFrom = creep.memory.roomFrom
        let remoteRoom

        _.forEach(Game.rooms, function(unfilteredRoom) {

            if (unfilteredRoom.memory.stage == "remoteRoom" && unfilteredRoom.memory.enemy == true) {

                let remoteRoomDistance = Game.map.getRoomLinearDistance(creep.room.name, unfilteredRoom.name)

                if (remoteRoomDistance == 1) {

                    creep.memory.target = unfilteredRoom.name
                    remoteRooms = unfilteredRoom

                }
            }
        })

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

                        } else if (creep.room.memory.builderNeed == true && !constructionSite && !structure) {

                            creep.room.memory.builderNeed = false

                        }
                    }
                } else {

                    let container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] >= creep.store.getCapacity()
                    })

                    if (container) {

                        creep.say("🛄")

                        creep.advancedWithdraw(container)

                    } else {

                        let droppedResources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                            filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= creep.store.getCapacity() * 0.5
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

                let goal = _.map([new RoomPosition(25, 25, remoteRoom)], function(target) {
                    return { pos: target.pos, range: 24 }
                })

                creep.onlySafeRoomPathing(creep.pos, goal, ["enemyRoom", "keeperRoom", "enemyReservation"])
            }
        } else {

            let goal = _.map([new RoomPosition(25, 25, roomFrom)], function(target) {
                return { pos: target.pos, range: 24 }
            })

            creep.onlySafeRoomPathing(creep.pos, goal, ["enemyRoom", "keeperRoom", "enemyReservation"])
        }

        creep.avoidHostiles()
    }
}