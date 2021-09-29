module.exports = function antifaAssaulterManager(room, assaulters) {

    for (let creep of assaulters) {

        // Define useful variables

        const roomFrom = creep.memory.roomFrom
        const attackTarget = Memory.global.attackTarget

        const type = creep.memory.type
        const size = creep.memory.size
        const amount = creep.memory.amount
        const requiredAmount = creep.memory.requiredAmount
        const part = creep.memory.part

        const supporter = Game.creeps[creep.memory.supporter]
        const secondAssaulter = Game.creeps[creep.memory.secondAssaulter]
        const secondSupporter = Game.creeps[creep.memory.secondSupporter]

        const members = [creep, supporter, secondAssaulter, secondSupporter]

        creep.findMemberCount(members)

        // If not in a full squad

        if (!creep.isSquadFull()) {

            newSquad()

            function newSquad() {

                if (room.name != roomFrom) {

                    creep.travel({
                        origin: creep.pos,
                        goal: { pos: new RoomPosition(25, 25, roomFrom), range: 1 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: false,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 10,
                    })
                }

                const anchorPoint = room.get("anchorPoint")

                if (creep.pos.getRangeTo(anchorPoint) != 6) {

                    creep.say("AIR" + creep.pos.getRangeTo(anchorPoint.x, anchorPoint.y))

                    if (creep.pos.getRangeTo(anchorPoint.x, anchorPoint.y) > 6) {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: anchorPoint, range: 6 },
                            plainCost: false,
                            swampCost: false,
                            defaultCostMatrix: false,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 10,
                        })

                        return
                    }

                    creep.travel({
                        origin: creep.pos,
                        goal: { pos: anchorPoint, range: 6 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: false,
                        avoidStages: [],
                        flee: true,
                        cacheAmount: 10,
                    })

                    return
                }
            }

            creep.say("🚬")

            if (size == "quad" && supporter && creep.pos.getRangeTo(supporter) == 1) {

                creep.say("FD")

                creep.findDuo(assaulters)
            }
        }

        if (part != "front") continue

        // State machine for room

        if (room.name == attackTarget) {

            inAttackTarget()
            continue
        }

        if (room.name == roomFrom) {

            inRoomFrom()
            continue
        }

        inOtherRoom()
        continue


        function inAttackTarget() {

            // Squad is in attackTarget

            if (creep.squadEnterRoom(members, supporter, secondAssaulter, secondSupporter)) return

            creep.quadEnterAttackMode(members)
        }

        function inRoomFrom() {

            // Squad is in roomFrom

            if (creep.squadEnterRoom(members, supporter, secondAssaulter, secondSupporter)) return

            creep.squadTravel(
                members, supporter, secondAssaulter, secondSupporter, {
                    pos: new RoomPosition(25, 25, attackTarget),
                    range: 1
                })
        }

        function inOtherRoom() {

            // Squad is travelling to attackTarget

            if (creep.squadEnterRoom(members, supporter, secondAssaulter, secondSupporter)) return

            creep.squadTravel(
                members, supporter, secondAssaulter, secondSupporter, {
                    pos: new RoomPosition(25, 25, attackTarget),
                    range: 1
                })
        }

        if (room.name == attackTarget) {

            // Creep is in room to attack

            let enteringRoom = creep.memory.enteringRoom

            if (creep.isEdge()) creep.memory.enteringRoom = true

            if (enteringRoom) {

                if (part == "front") {

                    creep.memory.enteringRoom = creep.moveFromExit(members)

                } else if (part == "middle2") {

                    if (creep.pos.getRangeTo(secondSupporter) > 1) {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: secondSupporter.pos, range: 1 },
                            plainCost: false,
                            swampCost: false,
                            defaultCostMatrix: false,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 1,
                        })
                    } else {

                        creep.move(creep.pos.getDirectionTo(secondSupporter))
                    }
                }
            } else if (creep.isSquadFull()) {

                creep.say(part)

                if (part == "front") {

                    if (creep.squadCanMove(members) && creep.squadInRange(members)) {

                        let controller = room.get("controller")

                        if (controller && creep.pos.getRangeTo(controller) > 6) {

                            creep.travel({
                                origin: creep.pos,
                                goal: { pos: room.get("controller").pos, range: 6 },
                                plainCost: false,
                                swampCost: false,
                                defaultCostMatrix: false,
                                avoidStages: [],
                                flee: false,
                                cacheAmount: 10,
                            })
                        } else {

                            creep.quadEnterAttackMode(members)
                        }
                    }
                } else if (part == "middle2") {

                    if (creep.pos.getRangeTo(secondSupporter) > 1) {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: secondSupporter.pos, range: 1 },
                            plainCost: false,
                            swampCost: false,
                            defaultCostMatrix: false,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 1,
                        })
                    } else {

                        creep.move(creep.pos.getDirectionTo(secondSupporter))
                    }
                } else {

                    creep.travel({
                        origin: creep.pos,
                        goal: { pos: new RoomPosition(25, 25, roomFrom), range: 1 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: false,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 1,
                    })
                }
            }
        } else if (room.name == roomFrom) {

            // Creep is at home

            if (creep.isSquadFull()) {

                creep.say(part)

                if (part == "front") {

                    if (creep.squadCanMove(members) && creep.squadInRange(members)) {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: new RoomPosition(25, 25, attackTarget), range: 1 },
                            plainCost: false,
                            swampCost: false,
                            defaultCostMatrix: false,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 10,
                        })
                    }
                } else if (part == "middle2") {

                    if (creep.pos.getRangeTo(secondSupporter) > 1) {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: secondSupporter.pos, range: 1 },
                            plainCost: false,
                            swampCost: false,
                            defaultCostMatrix: false,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 1,
                        })
                    } else {

                        creep.move(creep.pos.getDirectionTo(secondSupporter))
                    }
                }
            } else {

                const anchorPoint = creep.room.memory.anchorPoint

                if (anchorPoint) {

                    if (creep.pos.getRangeTo(anchorPoint.x, anchorPoint.y) != 6) {

                        creep.say("AIR" + creep.pos.getRangeTo(anchorPoint.x, anchorPoint.y))

                        if (creep.pos.getRangeTo(anchorPoint.x, anchorPoint.y) > 6) {

                            creep.travel({
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

                            creep.travel({
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
                    } else {

                        creep.say("🚬")

                        if (size == "quad" && supporter && creep.pos.getRangeTo(supporter) == 1) {

                            creep.say("FD")

                            creep.findDuo(assaulters)
                        }
                    }
                }
            }
        } else {

            // Creep is traveling to attackTarget

            if (creep.squadEnterRoom(members, supporter, secondAssaulter, secondSupporter)) continue

            if (creep.isSquadFull()) {

                creep.say(part)

                if (part == "front") {

                    if (creep.squadCanMove(members) && creep.squadInRange(members)) {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: new RoomPosition(25, 25, attackTarget), range: 1 },
                            plainCost: false,
                            swampCost: false,
                            defaultCostMatrix: false,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 10,
                        })
                    }
                } else if (part == "middle2") {

                    if (creep.pos.getRangeTo(secondSupporter) > 1) {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: secondSupporter.pos, range: 1 },
                            plainCost: false,
                            swampCost: false,
                            defaultCostMatrix: false,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 1,
                        })
                    } else {

                        creep.move(creep.pos.getDirectionTo(secondSupporter))
                    }
                }
            } else {

                creep.travel({
                    origin: creep.pos,
                    goal: { pos: new RoomPosition(25, 25, roomFrom), range: 1 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: false,
                    avoidStages: [],
                    flee: false,
                    cacheAmount: 1,
                })
            }
        }
    }
}