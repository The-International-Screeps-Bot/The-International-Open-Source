function antifa(room, creeps) {

    let squadType

    let squadMode = 2

    // let squadMode = 4

    // let squadMode = 6

    if (Memory.global.attackTarget) {

        // Define antifa creeps

        let antifaAssaulters = []
        let antifaSupporters = []

        for (let creep of creeps.myCreeps) {

            if (creep.memory.role == "antifaAssaulter") {

                antifaAssaulters.push(creep)
            }
            if (creep.memory.role == "antifaSupporter") {

                antifaSupporters.push(creep)
            }
        }

        for (let creep of antifaSupporters) {

            const inSquad = creep.memory.inSquad
            const assaulter = Game.creeps[creep.memory.assaulter]

            if (creep.memory.assaulter && !assaulter) {

                creep.memory.assaulter = undefined
                creep.memory.inSquad = false
            }
            if (assaulter != null) {

                if (inSquad) {

                    creep.say("IS")

                    if (creep.room == assaulter.room) {

                        if (creep.pos.isNearTo(assaulter)) {

                            let direction = creep.pos.getDirectionTo(assaulter)
                            creep.move(direction)

                        } else {

                            let goal = _.map([assaulter], function(target) {
                                return { pos: target.pos, range: 1 }
                            })

                            creep.intraRoomPathing(creep.pos, goal)
                        }
                    } else {

                        if (creep.fatigue == 0 && assaulter.fatigue == 0) {
                            creep.travel({
                                origin: creep.pos,
                                goal: { pos: assaulter.pos, range: 1 },
                                plainCost: 1,
                                swampCost: 6,
                                defaultCostMatrix: false,
                                avoidStages: ["enemyRoom", "keeperRoom", "allyRoom"],
                                flee: false
                            })
                        }
                    }
                } else {

                    creep.say("NS")

                    if (creep.fatigue == 0 && assaulter.fatigue == 0) {
                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: new RoomPosition(25, 25, creep.memory.roomFrom), range: 1 },
                            plainCost: 1,
                            swampCost: 6,
                            defaultCostMatrix: false,
                            avoidStages: ["enemyRoom", "keeperRoom", "allyRoom"],
                            flee: false
                        })
                    }
                }
            } else if (findCreepWithoutTask(creep, antifaAssaulters)) {

                creep.memory.assaulter = findCreepWithoutTask(creep, antifaAssaulters).name
                creep.memory.inSquad = true

                findCreepWithoutTask(creep, antifaAssaulters).memory.supporter = creep.name
                findCreepWithoutTask(creep, antifaAssaulters).memory.inSquad = true

            } else {

                creep.say("NA")

                if (creep.fatigue == 0) {
                    creep.travel({
                        origin: creep.pos,
                        goal: { pos: new RoomPosition(25, 25, creep.memory.roomFrom), range: 1 },
                        plainCost: 1,
                        swampCost: 6,
                        defaultCostMatrix: false,
                        avoidStages: ["enemyRoom", "keeperRoom", "allyRoom"],
                        flee: false
                    })
                }
            }
        }

        function findCreepWithoutTask(creep, collection) {

            for (let assaulter of collection) {

                if (assaulter.memory.roomFrom == creep.room.name) {

                    if (!assaulter.memory.inSquad) {

                        return assaulter
                    }
                }
            }
            return false
        }
        for (let creep of antifaAssaulters) {

            const squadType = creep.memory.squadType
            const inSquad = creep.memory.inSquad
            const supporter = Game.creeps[creep.memory.supporter]

            function healCreep() {

                if (creep.hits < creep.hitsMax) {

                    supporter.heal(creep)
                } else if (supporter.hits < supporter.hitsMax) {

                    supporter.heal(supporter)
                } else {

                    let closestInjured = creep.pos.findClosestByRange(FIND_CREEPS, {
                        filter: (creep) => {
                            return (creep.my || allyList.includes(creep.owner.username))
                        }
                    })

                    if (closestInjured) {

                        creep.say("CI")

                        if (supporter.pos.getRangeTo(closestInjured) > 1) {

                            supporter.rangedHeal(closestInjured)

                        } else {

                            supporter.heal(closestInjured)

                        }
                    }
                }
            }

            function attackHostile() {

                let closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                    filter: (c) => {
                        return (!allyList.includes(c.owner.username))
                    }
                })

                let closestAttacker = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                    filter: (c) => {
                        return (!allyList.includes(c.owner.username) && (c.body.some(i => i.type === ATTACK) || c.body.some(i => i.type === RANGED_ATTACK)))
                    }
                })

                if (!closestHostile || (closestHostile.pos.x <= 0 || closestHostile.pos.x >= 49 || closestHostile.pos.y <= 0 || closestHostile.pos.y >= 49)) return false

                if (squadType == "attack") {

                    if (closestAttacker) {

                        creep.say("CA")

                        if (creep.attack(closestAttacker) == ERR_NOT_IN_RANGE) {

                            let goal = _.map([closestAttacker], function(target) {
                                return { pos: target.pos, range: 1 }
                            })

                            creep.intraRoomPathing(creep.pos, goal)
                        }
                    } else return false
                }
                if (squadType == "dismantle") {

                    return false
                }
                if (squadType == "rangedAttack") {

                    if (closestAttacker) {

                        creep.say("CA")

                        if (creep.pos.getRangeTo(closestAttacker) > 3) {

                            let goal = _.map([closestAttacker], function(target) {
                                return { pos: target.pos, range: 1 }
                            })

                            creep.intraRoomPathing(creep.pos, goal)

                        } else {

                            if (creep.pos.getRangeTo(closestAttacker) == 1) {

                                creep.rangedMassAttack()

                            } else if (creep.pos.getRangeTo(closestAttacker) <= 3) {

                                creep.rangedAttack(closestAttacker)
                            }
                        }
                        if (closestAttacker && (closestAttacker.body.some(i => i.type === ATTACK) || closestAttacker.getActiveBodyparts(RANGED_ATTACK) <= creep.findParts("rangedAttack")) && creep.pos.getRangeTo(closestAttacker) <= 2) {

                            let goal = _.map([closestAttacker], function(target) {
                                return { pos: target.pos, range: 6 }
                            })

                            supporter.creepFlee(supporter.pos, goal)

                            let direction = creep.pos.getDirectionTo(supporter)
                            creep.move(direction)
                        } else {

                            let goal = _.map([closestAttacker], function(target) {
                                return { pos: target.pos, range: 1 }
                            })

                            creep.intraRoomPathing(creep.pos, goal)
                        }
                    } else if (closestHostile) {

                        creep.say("CH")

                        if (creep.pos.getRangeTo(closestHostile) > 3) {

                            let goal = _.map([closestHostile], function(target) {
                                return { pos: target.pos, range: 1 }
                            })

                            creep.intraRoomPathing(creep.pos, goal)

                        } else {

                            if (creep.pos.getRangeTo(closestHostile) == 1) {

                                creep.rangedMassAttack()

                            } else if (creep.pos.getRangeTo(closestHostile) <= 3) {

                                creep.rangedAttack(closestHostile)
                            }
                        }
                    } else return false
                }

                return true
            }

            function attackStructure(structure) {

                if (squadType == "attack") {

                    if (creep.pos.getRangeTo(structure) <= 1) {

                        creep.attack(structure)

                    } else {

                        let goal = _.map([structure], function(target) {
                            return { pos: target.pos, range: 1 }
                        })

                        if (creep.fatigue == 0 && supporter.fatigue == 0) {

                            creep.intraRoomPathing(creep.pos, goal)
                        }
                    }
                }
                if (squadType == "dismantle") {

                    if (creep.pos.getRangeTo(structure) <= 1) {

                        creep.dismantle(structure)

                    } else {

                        let goal = _.map([structure], function(target) {
                            return { pos: target.pos, range: 1 }
                        })

                        if (creep.fatigue == 0 && supporter.fatigue == 0) {

                            creep.intraRoomPathing(creep.pos, goal)
                        }
                    }
                }
                if (squadType == "rangedAttack") {

                    if (creep.pos.getRangeTo(structure) <= 1) {

                        if (structure.owner) {

                            creep.rangedMassAttack()
                        } else {

                            creep.rangedAttack(structure)
                        }
                    } else {

                        let goal = _.map([structure], function(target) {
                            return { pos: target.pos, range: 1 }
                        })

                        if (creep.fatigue == 0 && supporter.fatigue == 0) {

                            creep.intraRoomPathing(creep.pos, goal)
                        }

                        creep.rangedAttack(structure)
                    }
                }
            }

            if (creep.memory.supporter && !supporter) {

                creep.memory.supporter = undefined
                creep.memory.inSquad = false
            }
            if (supporter != null) {

                if (!creep.memory.squadType) {

                    if (creep.body.some(i => i.type === ATTACK)) {

                        creep.memory.squadType = "attack"

                    } else if (creep.body.some(i => i.type === WORK)) {

                        creep.memory.squadType = "dismantle"

                    } else if (creep.body.some(i => i.type === RANGED_ATTACK)) {

                        creep.memory.squadType = "rangedAttack"
                    }
                }
                if (creep.room.name == creep.memory.roomFrom) {

                    if (inSquad) {

                        creep.say("IS")

                        if (creep.pos.isNearTo(supporter) || creep.isEdge()) {

                            creep.say("N")

                            healCreep()

                            if (attackHostile()) {

                            } else {

                                if (creep.fatigue == 0 && supporter.fatigue == 0) {

                                    creep.travel({
                                        origin: creep.pos,
                                        goal: { pos: new RoomPosition(25, 25, Memory.global.attackTarget), range: 1 },
                                        plainCost: 1,
                                        swampCost: 6,
                                        defaultCostMatrix: false,
                                        avoidStages: ["enemyRoom", "keeperRoom", "allyRoom"],
                                        flee: false
                                    })
                                }
                            }
                        } else {

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

                                        creep.travel({
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
                            }
                        }
                    } else {

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

                                    creep.travel({
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
                        }
                    }
                } else if (creep.room.name == Memory.global.attackTarget) {

                    if (inSquad) {

                        creep.say("IS")

                        if (creep.pos.isNearTo(supporter) || creep.isEdge()) {

                            creep.say("N")

                            healCreep()

                            if (attackHostile()) {

                            } else {

                                let closestHostileStructure = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                                    filter: s => (!allyList.includes(toLowerCase(s.owner.username)) && s.structureType != STRUCTURE_CONTROLLER)
                                })

                                if (closestHostileStructure) {

                                    attackStructure(closestHostileStructure)

                                } else {

                                    let goal = _.map([creep.room.controller], function(target) {
                                        return { pos: target.pos, range: 2 }
                                    })

                                    if (creep.fatigue == 0 && supporter.fatigue == 0) {

                                        creep.intraRoomPathing(creep.pos, goal)
                                    }
                                }
                            }
                        } else {

                            let goal = _.map([creep.room.controller], function(target) {
                                return { pos: target.pos, range: 2 }
                            })

                            if (creep.fatigue == 0 && supporter.fatigue == 0) {

                                creep.intraRoomPathing(creep.pos, goal)
                            }
                        }
                    }
                } else {

                    if (inSquad) {

                        creep.say("IS")

                        if (creep.pos.isNearTo(supporter) || creep.isEdge()) {

                            creep.say("N")

                            healCreep()

                            if (creep.fatigue == 0 && supporter.fatigue == 0) {

                                creep.travel({
                                    origin: creep.pos,
                                    goal: { pos: new RoomPosition(25, 25, Memory.global.attackTarget), range: 1 },
                                    plainCost: 1,
                                    swampCost: 6,
                                    defaultCostMatrix: false,
                                    avoidStages: ["enemyRoom", "keeperRoom", "allyRoom"],
                                    flee: false
                                })
                            }
                        } else {

                            creep.say("F")

                            if (creep.isEdge()) {

                                let goal = _.map([new RoomPosition(25, 25, creep.room.name)], function(target) {
                                    return { pos: target, range: 24 }
                                })

                                creep.intraRoomPathing(creep.pos, goal)
                            }
                        }
                    } else {

                        creep.say("NS")

                        if (creep.isEdge()) {

                            let goal = _.map([new RoomPosition(25, 25, creep.room.name)], function(target) {
                                return { pos: target, range: 1 }
                            })

                            creep.intraRoomPathing(creep.pos, goal)

                        } else {

                            if (creep.fatigue == 0 && supporter.fatigue == 0) {

                                creep.travel({
                                    origin: creep.pos,
                                    goal: { pos: new RoomPosition(25, 25, creep.memory.roomFrom), range: 1 },
                                    plainCost: 1,
                                    swampCost: 6,
                                    defaultCostMatrix: false,
                                    avoidStages: ["enemyRoom", "keeperRoom", "allyRoom"],
                                    flee: false
                                })
                            }
                        }
                    }
                }
            } else {

                if (creep.isEdge()) {

                    if (creep.fatigue == 0) {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: new RoomPosition(25, 25, creep.room.name), range: 1 },
                            plainCost: 1,
                            swampCost: 6,
                            defaultCostMatrix: false,
                            avoidStages: ["enemyRoom", "keeperRoom", "allyRoom"],
                            flee: false
                        })
                    }
                } else {

                    if (creep.fatigue == 0) {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: new RoomPosition(25, 25, creep.memory.roomFrom), range: 1 },
                            plainCost: 1,
                            swampCost: 6,
                            defaultCostMatrix: false,
                            avoidStages: ["enemyRoom", "keeperRoom", "allyRoom"],
                            flee: false
                        })
                    }
                }
            }
        }
    }
}


module.exports = antifa