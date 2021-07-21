let allyList = require("module.allyList")

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

                if (creep.hits < creep.hitsMax) {

                    creep.heal(creep)
                }

                let closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                    filter: (c) => {
                        return (allyList.run().indexOf(c.owner.username.toLowerCase()) === -1 && (c.body.some(i => i.type === ATTACK) || c.body.some(i => i.type === RANGED_ATTACK) || c.body.some(i => i.type === WORK) || c.body.some(i => i.type === HEAL) || c.body.some(i => i.type === CLAIM) || c.body.some(i => i.type === CARRY)))
                    }
                })

                if (closestHostile && !(closestHostile.pos.x <= 0 || closestHostile.pos.x >= 49 || closestHostile.pos.y <= 0 || closestHostile.pos.y >= 49)) {

                    creep.say("H")

                    creep.attack(closestHostile)

                    let goal = _.map([closestHostile], function(target) {
                        return { pos: target.pos, range: 1 }
                    })

                    creep.intraRoomPathing(creep.pos, goal)

                } else {

                    let hostileStructure = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                        filter: (c) => {
                            return (allyList.run().indexOf(c.owner.username.toLowerCase()) === -1)
                        }
                    })

                    if (hostileStructure) {

                        creep.say("H")

                        creep.attack(hostileStructure)

                        let goal = _.map([hostileStructure], function(target) {
                            return { pos: target.pos, range: 1 }
                        })

                        creep.intraRoomPathing(creep.pos, goal)

                    } else {

                        creep.room.memory.enemy = false
                    }
                }
            } else {

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

                        if (cm && cm.get(rampart.x, rampart.y) < 255) {

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
    }
}