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

                            if (creep.harvest(closestSource) == ERR_NOT_IN_RANGE) {

                                creep.advancedPathing({
                                    origin: creep.pos,
                                    goal: { pos: closestSource.pos, range: 1 },
                                    plainCost: false,
                                    swampCost: false,
                                    defaultCostMatrix: creep.memory.defaultCostMatrix,
                                    avoidStages: [],
                                    flee: false,
                                    cacheAmount: 10,
                                })
                            }
                        }
                    }
                }
            } else {

                creep.say(remoteRoom)

                creep.advancedPathing({
                    origin: creep.pos,
                    goal: { pos: new RoomPosition(25, 25, remoteRoom), range: 1 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: creep.memory.defaultCostMatrix,
                    avoidStages: ["enemyRoom", "keeperRoom", "enemyReservation"],
                    flee: false,
                    cacheAmount: 10,
                })
            }
        } else {
            if (creep.room.name == roomFrom) {

                creep.say("🚬")

                let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_RAMPART
                })

                if (ramparts.length > 0) {

                    let cm = PathFinder.CostMatrix.deserialize(false)

                    let outerRamparts = []

                    for (let rampart of ramparts) {

                        let creeps = creep.room.find(FIND_CREEPS)

                        for (let creep of creeps) {

                            cm.set(creep.pos.x, creep.pos.y, 255)
                        }

                        cm.set(creep.pos.x, creep.pos.y, 1)

                        if (cm && cm.get(rampart.pos.x, rampart.pos.y) < 255) {

                            outerRamparts.push(rampart)
                        }
                    }

                    if (outerRamparts.length > 0) {

                        let outerRampart = creep.pos.findClosestByRange(outerRamparts)

                        if (outerRampart) {

                            creep.advancedPathing({
                                origin: creep.pos,
                                goal: { pos: outerRampart.pos, range: 0 },
                                plainCost: false,
                                swampCost: false,
                                defaultCostMatrix: false,
                                avoidStages: [],
                                flee: false,
                                cacheAmount: 10,
                            })
                        }
                    }
                } else {

                    const anchorPoint = creep.room.memory.anchorPoint

                    if (anchorPoint) {

                        if (creep.pos.getRangeTo(anchorPoint.x, anchorPoint.y) != 6) {

                            creep.say("AIR" + creep.pos.getRangeTo(anchorPoint.x, anchorPoint.y))

                            if (creep.pos.getRangeTo(anchorPoint.x, anchorPoint.y) > 6) {

                                creep.advancedPathing({
                                    origin: creep.pos,
                                    goal: { pos: anchorPoint, range: 6 },
                                    plainCost: false,
                                    swampCost: false,
                                    defaultCostMatrix: false,
                                    avoidStages: [],
                                    flee: false,
                                    cacheAmount: 10,
                                })
                            } else {

                                creep.advancedPathing({
                                    origin: creep.pos,
                                    goal: { pos: anchorPoint, range: 6 },
                                    plainCost: false,
                                    swampCost: false,
                                    defaultCostMatrix: false,
                                    avoidStages: [],
                                    flee: true,
                                    cacheAmount: 10,
                                })
                            }
                        }
                    }
                }
            } else {

                creep.say(roomFrom)

                creep.advancedPathing({
                    origin: creep.pos,
                    goal: { pos: new RoomPosition(25, 25, roomFrom), range: 1 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: creep.memory.defaultCostMatrix,
                    avoidStages: ["enemyRoom", "keeperRoom", "enemyReservation"],
                    flee: false,
                    cacheAmount: 10,
                })
            }
        }

        creep.avoidHostiles()
    }
}