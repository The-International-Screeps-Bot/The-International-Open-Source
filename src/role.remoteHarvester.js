module.exports = {
    run: function(creep) {

        const remoteRoom = creep.memory.remoteRoom

        if (!remoteRoom) return false

        if (creep.room.name == remoteRoom) {

            if (creep.room.controller.reservation && creep.room.controller.reservation.username != "Invader" && creep.room.controller.reservation.username != me) {

                creep.room.memory.stage = "enemyReservation"
            }

            if (creep.memory.role == "remoteHarvester1") {

                let source1 = creep.room.get("source1")
                let sourceContainer1 = creep.room.get("sourceContainer1")

                if (sourceContainer1 && source1) {

                    creep.say("⛏️ 1")

                    if (creep.pos.getRangeTo(sourceContainer1) == 0) {

                        if (creep.harvest(source1) == 0) {

                            creep.findEnergyHarvested(source1)
                        }
                    } else {

                        creep.advancedPathing({
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

                        creep.advancedPathing({
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
            } else if (creep.memory.role == "remoteHarvester2") {

                let source2 = creep.room.get("source2")
                let sourceContainer2 = creep.room.get("sourceContainer2")

                if (sourceContainer2 && source2) {

                    creep.say("⛏️ 2")

                    if (creep.pos.inRangeTo(sourceContainer2, 0)) {

                        if (creep.harvest(source2) == 0) {

                            creep.findEnergyHarvested(source2)
                        }
                    } else {

                        creep.advancedPathing({
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

                        creep.advancedPathing({
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
            }

            let hostiles = creep.room.find(FIND_HOSTILE_CREEPS, {
                filter: hostileCreep => !allyList.includes(hostileCreep.owner.username) && hostileCreep.hasPartsOfTypes([ATTACK, RANGED_ATTACK, WORK, CARRY, CLAIM])
            })

            let hostileStructure = creep.room.find(FIND_HOSTILE_STRUCTURES, {
                filter: s => !allyList.includes(s.owner.username)
            })

            if (hostiles.length > 0 || hostileStructure.length > 0) {

                Memory.rooms[creep.memory.roomFrom].remoteRooms[creep.room.name].enemy = true

            } else {

                Memory.rooms[creep.memory.roomFrom].remoteRooms[creep.room.name].enemy = false
            }

            let constructionSite = creep.room.find(FIND_MY_CONSTRUCTION_SITES)

            let structure = creep.room.find(FIND_STRUCTURES, {
                filter: s => (s.structureType == STRUCTURE_CONTAINER || s.structureType == STRUCTURE_ROAD) && s.hits < s.hitsMax * 0.5
            })

            if (constructionSite.length > 0 || structure.length > 0) {

                Memory.rooms[creep.memory.roomFrom].remoteRooms[creep.room.name].builderNeed = true
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

        creep.avoidHostiles()
    }
}