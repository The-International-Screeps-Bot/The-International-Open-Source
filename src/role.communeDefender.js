module.exports = {
    run: function(creep) {

        const roomFrom = creep.memory.roomFrom
        let remoteRoom

        _.forEach(Game.rooms, function(unfilteredRoom) {

            if (unfilteredRoom.memory.stage == "remoteRoom" && unfilteredRoom.memory.enemy == true) {

                let remoteRoomDistance = Game.map.getRoomLinearDistance(creep.memory.roomFrom, unfilteredRoom.name)

                if (remoteRoomDistance == 1) {

                    remoteRoom = unfilteredRoom.name

                }
            }
        })

        creep.memory.remoteRoom = remoteRoom

        if (remoteRoom) {
            if (creep.room.name == remoteRoom) {

                let closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                    filter: (c) => {
                        return (allyList.indexOf(c.owner.username) === -1 && (c.body.some(i => i.type === ATTACK) || c.body.some(i => i.type === RANGED_ATTACK) || c.body.some(i => i.type === WORK) || c.body.some(i => i.type === HEAL) || c.body.some(i => i.type === CLAIM) || c.body.some(i => i.type === CARRY)))
                    }
                })

                if (closestHostile && !(closestHostile.pos.x <= 0 || closestHostile.pos.x >= 49 || closestHostile.pos.y <= 0 || closestHostile.pos.y >= 49)) {

                    creep.say("H")

                    creep.attack(closestHostile)

                    creep.advancedPathing({
                        origin: creep.pos,
                        goal: { pos: closestHostile.pos, range: 1 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: false,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: 10,
                    })
                } else {

                    let hostileStructure = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                        filter: (c) => {
                            return (allyList.indexOf(c.owner.username) === -1)
                        }
                    })

                    if (hostileStructure) {

                        creep.say("H")

                        creep.attack(hostileStructure)

                        creep.advancedPathing({
                            origin: creep.pos,
                            goal: { pos: hostileStructure.pos, range: 1 },
                            plainCost: false,
                            swampCost: false,
                            defaultCostMatrix: false,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 10,
                        })
                    } else {

                        if (creep.hits < creep.hitsMax) {

                            creep.heal(creep)
                        }

                        creep.room.memory.enemy = false
                    }
                }
            } else {

                creep.advancedPathing({
                    origin: creep.pos,
                    goal: { pos: new RoomPosition(25, 25, remoteRoom), range: 1 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: false,
                    avoidStages: ["enemyRoom", "keeperRoom", "enemyReservation"],
                    flee: false,
                    cacheAmount: 10,
                })
            }
        } else {
            if (creep.room.name == roomFrom) {

                let hostiles = creep.room.find(FIND_HOSTILE_CREEPS, {
                    filter: hostileCreep => !allyList.includes(hostileCreep.owner.username) && hostileCreep.hasPartsOfTypes([ATTACK, RANGED_ATTACK, WORK])
                })

                if (hostiles.length > 0) {

                    creep.say("H")

                    let hostile = creep.pos.findClosestByRange(hostiles)

                    let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_RAMPART
                    })

                    if (ramparts.length > 0) {

                        let openRamparts = []

                        let cm = new PathFinder.CostMatrix

                        for (let rampart of ramparts) {

                            let creeps = creep.room.find(FIND_MY_CREEPS)

                            for (let creep of creeps) {

                                cm.set(creep.pos.x, creep.pos.y, 255)
                            }

                            cm.set(creep.pos.x, creep.pos.y, 1)

                            if (cm.get(rampart.pos.x, rampart.pos.y) < 255) openRamparts.push(rampart)
                        }

                        if (openRamparts.length > 0) {

                            creep.say("OR")

                            let rampart = hostile.pos.findClosestByRange(openRamparts)

                            let goal = _.map([rampart], function(target) {
                                return { pos: target.pos, range: 0 }
                            })

                            creep.rampartPathing(creep.pos, goal)

                            creep.attack(hostile)
                        }
                    } else {

                        creep.say("NE")

                        if (!hostile.isEdge()) {

                            creep.say("H")

                            creep.attack(hostile)

                            if (creep.pos.getRangeTo(hostile) > 1) {

                                creep.advancedPathing({
                                    origin: creep.pos,
                                    goal: { pos: hostile.pos, range: 1 },
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
                } else {

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
                }
            } else {

                creep.say(roomFrom)

                creep.advancedPathing({
                    origin: creep.pos,
                    goal: { pos: new RoomPosition(25, 25, roomFrom), range: 1 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: false,
                    avoidStages: ["enemyRoom", "keeperRoom", "enemyReservation"],
                    flee: false,
                    cacheAmount: 10,
                })
            }
        }
    }
}