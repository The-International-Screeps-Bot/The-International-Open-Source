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

                let closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                    filter: (c) => {
                        return (allyList.indexOf(c.owner.username) === -1 && (c.body.some(i => i.type === ATTACK) || c.body.some(i => i.type === RANGED_ATTACK) || c.body.some(i => i.type === WORK) || c.body.some(i => i.type === HEAL) || c.body.some(i => i.type === CLAIM) || c.body.some(i => i.type === CARRY)))
                    }
                })

                creep.say("No Enemy")

                if (closestHostile) {

                    creep.say("Enemy")

                    let rampart = closestHostile.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_RAMPART
                    })

                    if (rampart) {

                        creep.say("Rampart")

                        if (creep.pos.getRangeTo(closestHostile) == 1) {

                            creep.attack(closestHostile)

                        } else {

                            let goal = _.map([rampart], function(target) {
                                return { pos: target.pos, range: 0 }
                            })

                            creep.rampartPathing(creep.pos, goal)
                        }
                    } else {

                        creep.say("NE")

                        if (!(closestHostile.pos.x <= 0 || closestHostile.pos.x >= 49 || closestHostile.pos.y <= 0 || closestHostile.pos.y >= 49)) {

                            creep.say("H")

                            if (creep.pos.getRangeTo(closestHostile) == 1) {

                                creep.attack(closestHostile)

                            } else {

                                creep.advancedPathing({
                                    origin: creep.pos,
                                    goal: { pos: closestHostile, range: 6 },
                                    plainCost: false,
                                    swampCost: false,
                                    defaultCostMatrix: false,
                                    avoidStages: [],
                                    flee: false,
                                    cacheAmount: 10,
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