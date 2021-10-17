function remoteHarvesterManager(room, creepsWithRole) {

    if (creepsWithRole.length == 0) return

    creepsWithRole[0].remoteRequests()

    for (let creep of creepsWithRole) {

        const remoteRoom = creep.memory.remoteRoom

        if (!remoteRoom) return false

        if (creep.avoidEnemys()) continue

        if (room.name == remoteRoom) {

            let controller = room.get("controller")

            if (controller.reservation && controller.reservation.username != "Invader" && controller.reservation.username != me) {

                // Tell the commune to not operate in this room for the next 20,000 ticks

                Memory.rooms[creep.memory.roomFrom].remoteRooms[remoteRoom].avoidUse = Game.time + 20000
            }

            if (creep.memory.role == "remoteHarvester1") {

                let source1 = room.get("source1")
                let sourceContainer1 = room.get("sourceContainer1")

                if (sourceContainer1 && source1) {

                    creep.say("⛏️ 1")

                    if (creep.pos.getRangeTo(sourceContainer1) == 0) {

                        if (creep.harvest(source1) == 0) {

                            creep.findEnergyHarvested(source1)
                        }
                    } else {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: sourceContainer1.pos, range: 0 },
                            plainCost: false,
                            swampCost: false,
                            defaultCostMatrix: creep.memory.defaultCostMatrix,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 10,
                        })

                    }
                } else if (source1) {

                    creep.say("⛏️ 3")

                    if (creep.pos.inRangeTo(source1, 1)) {

                        if (creep.harvest(source1) == 0) {

                            creep.findEnergyHarvested(source1)
                        }
                    } else {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: source1.pos, range: 1 },
                            plainCost: false,
                            swampCost: false,
                            defaultCostMatrix: creep.memory.defaultCostMatrix,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 10,
                        })
                    }
                }

                continue
            }
            if (creep.memory.role == "remoteHarvester2") {

                let source2 = room.get("source2")
                let sourceContainer2 = room.get("sourceContainer2")

                if (sourceContainer2 && source2) {

                    creep.say("⛏️ 2")

                    if (creep.pos.inRangeTo(sourceContainer2, 0)) {

                        if (creep.harvest(source2) == 0) {

                            creep.findEnergyHarvested(source2)
                        }
                    } else {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: sourceContainer2.pos, range: 0 },
                            plainCost: false,
                            swampCost: false,
                            defaultCostMatrix: creep.memory.defaultCostMatrix,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 10,
                        })
                    }
                } else if (source2) {

                    creep.say("⛏️ 4")

                    if (creep.pos.inRangeTo(source2, 1)) {

                        if (creep.harvest(source2) == 0) {

                            creep.findEnergyHarvested(source2)
                        }

                    } else {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: source2.pos, range: 1 },
                            plainCost: false,
                            swampCost: false,
                            defaultCostMatrix: creep.memory.defaultCostMatrix,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 10,
                        })
                    }
                }

                continue
            }
        }

        creep.say(remoteRoom)

        creep.travel({
            origin: creep.pos,
            goal: { pos: new RoomPosition(25, 25, remoteRoom), range: 1 },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: creep.memory.defaultCostMatrix,
            avoidStages: ["enemyRoom", "keeperRoom", "enemyReservation", "allyRoom"],
            flee: false,
            cacheAmount: 10,
        })
    }
}

module.exports = remoteHarvesterManager