var AttackWhitelist = ["cplive", me];
module.exports = {
    run: function(creep) {

        const roomFrom = creep.memory.roomFrom
        let remoteRoom

        for (let remoteRoomName in Memory.rooms[roomFrom].remoteRooms) {

            let remoteRoomMemory = Memory.rooms[roomFrom].remoteRooms[remoteRoomName]

            if (!remoteRoomMemory.builderNeed) continue

            remoteRoom = remoteRoomName
            break
        }

        creep.memory.remoteRoom = remoteRoom

        if (remoteRoom) {

            if (creep.room.name == remoteRoom) {

                creep.isFull()

                if (creep.memory.isFull) {

                    let lowLogisticStructure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                        filter: s => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_ROAD) && s.hits <= (s.hitsMax - creep.findParts("work") * 100)
                    })

                    if (lowLogisticStructure) {

                        creep.repairStructure(lowLogisticStructure)

                    } else {

                        let constructionSite = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES)

                        if (constructionSite) {

                            creep.say("🚧")

                            creep.buildSite(constructionSite)

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