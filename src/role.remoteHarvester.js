let allyList = require("allyList")

module.exports = {
    run: function(creep) {

        const remoteRoom = creep.memory.remoteRoom

        if (!remoteRoom) return false

        if (creep.room.name == remoteRoom) {

            creep.room.memory.stage = "remoteRoom"

            if (creep.room.controller.reservation && creep.room.controller.reservation.username != "Invader" && creep.room.controller.reservation.username != "MarvinTMB") {

                creep.room.memory.stage = "enemyReservation"
            }

            let creepIsEdge = (creep.pos.x <= 0 || creep.pos.x >= 49 || creep.pos.y <= 0 || creep.pos.y >= 49)

            if (creepIsEdge) {

                let goal = _.map([new RoomPosition(25, 25, creep.room.name)], function(pos) {
                    return { pos: pos, range: 0 }
                })

                creep.intraRoomPathing(creep.pos, goal)
            }

            let source1 = Game.getObjectById(creep.room.memory.source1)
            let source2 = Game.getObjectById(creep.room.memory.source2)

            if (!source1) {

                let sources = creep.room.find(FIND_SOURCES)[0]

                creep.room.memory.source1 = sources.id

            }

            if (!source2) {

                let sources = creep.room.find(FIND_SOURCES)[1]

                if (sources) {

                    creep.room.memory.source2 = sources.id
                }
            }

            let sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
            let sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)

            if (!sourceContainer1) {

                let container = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER
                })[0]

                if (container) {

                    creep.room.memory.sourceContainer1 = container.id
                }
            }
            if (!sourceContainer2) {

                let container = creep.room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER
                })[1]

                if (container) {

                    creep.room.memory.sourceContainer2 = container.id
                }
            }

            if (creep.memory.role == "remoteHarvester1") {

                let sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
                let source1 = Game.getObjectById(creep.room.memory.source1)

                if (sourceContainer1 != null && source1 != null) {

                    creep.say("⛏️ 1")

                    if (creep.pos.inRangeTo(sourceContainer1, 0)) {

                        if (creep.harvest(source1) == 0) {

                            creep.findEnergyHarvested(source1)
                        }

                    } else {

                        let goal = _.map([sourceContainer1], function(target) {
                            return { pos: target.pos, range: 0 }
                        })

                        creep.intraRoomPathing(creep.pos, goal)

                    }
                } else if (source1 != null) {

                    creep.say("⛏️ 3")

                    if (creep.pos.inRangeTo(source1, 1)) {


                        if (creep.harvest(source1) == 0) {

                            creep.findEnergyHarvested(source1)
                        }

                    } else {

                        let goal = _.map([source1], function(target) {
                            return { pos: target.pos, range: 1 }
                        })

                        creep.intraRoomPathing(creep.pos, goal)

                    }
                }
            } else if (creep.memory.role == "remoteHarvester2") {

                let sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)
                let source2 = Game.getObjectById(creep.room.memory.source2)

                if (sourceContainer2 != null && source2 != null) {

                    creep.say("⛏️ 2")

                    if (creep.pos.inRangeTo(sourceContainer2, 0)) {

                        if (creep.harvest(source2) == 0) {

                            creep.findEnergyHarvested(source2)
                        }

                    } else {

                        let goal = _.map([sourceContainer2], function(target) {
                            return { pos: target.pos, range: 0 }
                        })

                        creep.intraRoomPathing(creep.pos, goal)

                    }
                } else if (source2 != null) {

                    creep.say("⛏️ 4")

                    if (creep.pos.inRangeTo(source2, 1)) {

                        if (creep.harvest(source2) == 0) {

                            creep.findEnergyHarvested(source2)
                        }

                    } else {

                        let goal = _.map([source2], function(target) {
                            return { pos: target.pos, range: 1 }
                        })

                        creep.intraRoomPathing(creep.pos, goal)

                    }
                }
            }

            let closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                filter: (c) => {
                    return (allyList.indexOf(c.owner.username.toLowerCase()) === -1 && (c.body.some(i => i.type === ATTACK) || c.body.some(i => i.type === RANGED_ATTACK) || c.body.some(i => i.type === WORK) || c.body.some(i => i.type === HEAL) || c.body.some(i => i.type === CLAIM) || c.body.some(i => i.type === CARRY)))
                }
            })

            let hostileStructure = creep.room.find(FIND_HOSTILE_STRUCTURES, {
                filter: (c) => {
                    return (allyList.indexOf(c.owner.username.toLowerCase()) === -1)
                }
            })

            if ((closestHostile && !(closestHostile.pos.x <= 0 || closestHostile.pos.x >= 49 || closestHostile.pos.y <= 0 || closestHostile.pos.y >= 49)) || hostileStructure.length > 0) {

                creep.room.memory.enemy = true

            } else {

                creep.room.memory.enemy = false
            }

            let constructionSite = creep.room.find(FIND_MY_CONSTRUCTION_SITES)

            let structure = creep.room.find(FIND_STRUCTURES, {
                filter: (s) => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_ROAD) && s.hits < s.hitsMax * 0.5
            })

            if (constructionSite.length > 0 || structure.length > 0) {

                creep.room.memory.builderNeed = true
            }

            let sources = creep.room.find(FIND_SOURCES)

            if (sources.length == 2) {

                for (let object of Game.rooms[creep.memory.roomFrom].memory.remoteRooms) {

                    if (object.name == creep.room.name) {

                        object.sources = 2
                    }
                }
            }
        } else {

            creep.say(remoteRoom)

            let goal = _.map([new RoomPosition(25, 25, remoteRoom)], function(target) {
                return { pos: target, range: 24 }
            })

            creep.onlySafeRoomPathing(creep, goal, ["enemyRoom", "keeperRoom", "enemyReservation"])
        }

        creep.avoidHostiles()
    }
}