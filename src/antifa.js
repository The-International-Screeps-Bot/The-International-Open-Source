let allyList = require("allyList")

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

            let creepIsEdge = (creep.pos.x <= 0 || creep.pos.x >= 49 || creep.pos.y <= 0 || creep.pos.y >= 49)

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
                            creep.advancedPathing({
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
                        creep.advancedPathing({
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
                    creep.advancedPathing({
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

            let creepIsEdge = (creep.pos.x <= 0 || creep.pos.x >= 49 || creep.pos.y <= 0 || creep.pos.y >= 49)

            function healCreep() {

                if (creep.hits < creep.hitsMax) {

                    supporter.heal(creep)
                } else if (supporter.hits < supporter.hitsMax) {

                    supporter.heal(supporter)
                } else {

                    let closestInjured = creep.pos.findClosestByRange(FIND_CREEPS, {
                        filter: (creep) => {
                            return (creep.my || allyList.includes(creep.owner.username.toLowerCase()))
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

                /* let closestInjured = creep.pos.findClosestByRange(FIND_CREEPS, {
                    filter: (creep) => {
                        return (creep.my || allyList.includes(creep.owner.username.toLowerCase()))
                    }
                })

                if (closestInjured) {

                    creep.say("CI")

                    if (supporter.pos.getRangeTo(closestInjured) > 1) {

                        supporter.rangedHeal(closestInjured)

                    } else if (supporter.pos.getRangeTo(closestInjured) <= 3) {

                        supporter.heal(closestInjured)

                    } else {
                        if (supporter.hits < supporter.hitsMax) {

                            creep.say("HS")

                            supporter.heal(supporter)

                        } else {

                            creep.say("HA")

                            supporter.heal(assaulter)
                        }
                    }
                } else {
                    if (supporter.hits < supporter.hitsMax) {

                        creep.say("HS")

                        supporter.heal(supporter)

                    } else {

                        creep.say("HA")

                        supporter.heal(assaulter)
                    }
                } */
            }

            function attackHostile() {

                let closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                    filter: (c) => {
                        return (allyList.indexOf(c.owner.username.toLowerCase()) === -1)
                    }
                })

                if (closestHostile && !(closestHostile.pos.x <= 0 || closestHostile.pos.x >= 49 || closestHostile.pos.y <= 0 || closestHostile.pos.y >= 49)) {

                    creep.say("H")

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
                    if (creep.pos.getRangeTo(closestHostile) <= 2) {

                        let goal = _.map([closestHostile], function(target) {
                            return { pos: target.pos, range: 5 }
                        })

                        supporter.creepFlee(supporter.pos, goal)

                        let direction = creep.pos.getDirectionTo(supporter)
                        creep.move(direction)
                    }
                }
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

                        if (creep.pos.isNearTo(supporter) || creepIsEdge) {

                            creep.say("N")

                            healCreep()

                            let closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                                filter: (c) => {
                                    return (allyList.indexOf(c.owner.username.toLowerCase()) === -1)
                                }
                            })

                            if (closestHostile && !(closestHostile.pos.x <= 0 || closestHostile.pos.x >= 49 || closestHostile.pos.y <= 0 || closestHostile.pos.y >= 49)) {

                                target = "closestHostile"

                                creep.say("H")

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
                                if (creep.pos.getRangeTo(closestHostile) <= 2) {

                                    let goal = _.map([closestHostile], function(target) {
                                        return { pos: target.pos, range: 5 }
                                    })

                                    supporter.creepFlee(supporter.pos, goal)

                                    let direction = creep.pos.getDirectionTo(supporter)
                                    creep.move(direction)
                                }
                            } else {

                                if (creep.fatigue == 0 && supporter.fatigue == 0) {

                                    creep.advancedPathing({
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

                                        let goal = _.map([outerRampart], function(target) {
                                            return { pos: target.pos, range: 0 }
                                        })

                                        if (creep.fatigue == 0 && supporter.fatigue == 0) {

                                            creep.intraRoomPathing(creep.pos, goal)
                                        }
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

                                    let goal = _.map([outerRampart], function(target) {
                                        return { pos: target.pos, range: 0 }
                                    })

                                    if (creep.fatigue == 0 && supporter.fatigue == 0) {

                                        creep.intraRoomPathing(creep.pos, goal)
                                    }
                                }
                            }
                        }
                    }
                } else if (creep.room.name == Memory.global.attackTarget) {

                    if (inSquad) {

                        creep.say("IS")

                        if (creep.pos.isNearTo(supporter) || creepIsEdge) {

                            creep.say("N")

                            healCreep()

                            let closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                                filter: (c) => {
                                    return (allyList.indexOf(c.owner.username.toLowerCase()) === -1)
                                }
                            })

                            if (closestHostile && !(closestHostile.pos.x <= 0 || closestHostile.pos.x >= 49 || closestHostile.pos.y <= 0 || closestHostile.pos.y >= 49)) {

                                target = "closestHostile"

                                creep.say("H")

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
                                if (creep.pos.getRangeTo(closestHostile) <= 2) {

                                    let goal = _.map([closestHostile], function(target) {
                                        return { pos: target.pos, range: 5 }
                                    })

                                    supporter.creepFlee(supporter.pos, goal)

                                    let direction = creep.pos.getDirectionTo(supporter)
                                    creep.move(direction)
                                }
                            } else {

                                let closestHostileStructure = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                                    filter: s => s.structureType != STRUCTURE_CONTROLLER
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

                        if (creep.pos.isNearTo(supporter) || creepIsEdge) {

                            creep.say("N")

                            healCreep()

                            let closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                                filter: (c) => {
                                    return (allyList.indexOf(c.owner.username.toLowerCase()) === -1)
                                }
                            })

                            if (1 == 2 && closestHostile && !(closestHostile.pos.x <= 0 || closestHostile.pos.x >= 49 || closestHostile.pos.y <= 0 || closestHostile.pos.y >= 49)) {

                                target = "closestHostile"

                                creep.say("H")

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
                                if (creep.pos.getRangeTo(closestHostile) <= 2) {

                                    let goal = _.map([closestHostile], function(target) {
                                        return { pos: target.pos, range: 5 }
                                    })

                                    supporter.creepFlee(supporter.pos, goal)

                                    let direction = creep.pos.getDirectionTo(supporter)
                                    creep.move(direction)
                                }
                            } else {

                                if (creep.fatigue == 0 && supporter.fatigue == 0) {

                                    creep.advancedPathing({
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

                            creep.say("F")

                            if (creepIsEdge) {

                                let goal = _.map([new RoomPosition(25, 25, creep.room.name)], function(target) {
                                    return { pos: target, range: 24 }
                                })

                                creep.intraRoomPathing(creep.pos, goal)
                            }
                        }
                    } else {

                        creep.say("NS")

                        if (creepIsEdge) {

                            let goal = _.map([new RoomPosition(25, 25, creep.room.name)], function(target) {
                                return { pos: target, range: 1 }
                            })

                            creep.intraRoomPathing(creep.pos, goal)

                        } else {

                            if (creep.fatigue == 0 && supporter.fatigue == 0) {

                                creep.advancedPathing({
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

                if (creepIsEdge) {

                    if (creep.fatigue == 0) {

                        creep.advancedPathing({
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

                        creep.advancedPathing({
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


/*
        
let allyList = require("allyList")
        
module.exports = {
            run: function(creep) {
                if (creep.memory.role == "antifaSupporter" || creep.memory.role == "antifaAssaulter") {
        
            var antifaRally = true
        
        }
                if (antifaRally == true) {
        
            let antifaAssaulter = _.filter(Game.creeps, (c) => c.memory.role == 'antifaAssaulter');
                    let antifaSupporter = _.filter(Game.creeps, (c) => c.memory.role == 'antifaSupporter');
        
            for (let i = 0; i < antifaSupporter.length; i++) {
        
                let leader = antifaAssaulter[i]
                        let member = antifaSupporter[i]
        
                if (leader && member) {
        
                    let leaderIsEdge = (leader.pos.x <= 0 || leader.pos.x >= 49 || leader.pos.y <= 0 || leader.pos.y >= 49)
                            let memberIsEdge = (member.pos.x <= 0 || member.pos.x >= 49 || member.pos.y <= 0 || member.pos.y >= 49)
        
                    const target = leader.memory.target = Memory.global.attackTarget
        
                    if (leader.room.name == leader.memory.roomFrom && leader.pos.getRangeTo(leader.pos.findClosestByRange(FIND_MY_SPAWNS)) < 8) {
        
                        if (leader.room.name == leader.memory.roomFrom) {
        
                            let goal = _.map([leader.pos.findClosestByRange(FIND_MY_SPAWNS)], function(target) {
                                        return { pos: target.pos, range: 8 }
                                 })   
        
                            leader.creepFlee(leader.pos, goal)
                                }
                    } el        se if (leader.pos.isNearTo(member) || leaderIsEdge || memberIsEdge) {
        
                        member.say("F")
        
                        member.moveTo(leader)
        
                        let squadTarget
        
                        if (leader.room.name == target) {
        
                            let injuredCreep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                                        filter: (c) => {
                                            return (allyList.indexOf(c.owner.username.toLowerCase()) >= 0)
                                }        
                              })      
        
                            if (injuredCreep && creep.moveTo(injuredCreep) != ERR_NO_PATH) {
        
                                member.say("IC")
        
                                if (creep.pos.inRangeTo(injuredCreep, 1)) {
        
                                    creep.heal(injuredCreep)
                                } el        se if (creep.pos.inRangeTo(injuredCreep, 3)) {
        
                                    creep.rangedHeal(injuredCreep)
                                  }      
                               } el     se {
        
                                member.heal(leader)
                                  }  
        
                            let hostile = leader.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                                        filter: (c) => {
                                            return (allyList.indexOf(c.owner.username.toLowerCase()) === -1)
                                  }      
                               })     
        
                            let hostileIsEdge = (hostile.pos.x <= 0 || hostile.pos.x >= 49 || hostile.pos.y <= 0 || hostile.pos.y >= 49)
        
                            if (hostile && !hostileIsEdge) {
        
                                leader.say("H")
        
                                if (leader.pos.inRangeTo(hostile, 3)) {
        
                                    leader.rangedAttack(hostile)
                                  } el      se if (leader.pos.inRangeTo(hostile, 2)) {
        
                                    leader.rangedAttack(hostile)
        
                                    let goal = _.map([hostile], function(target) {
                                                return { pos: target.pos, range: 3 }
                                           }) 
        
                                    leader.creepFlee(leader.pos, goal)
        
                                } else if (leader.pos.inRangeTo(hostile, 1)) {
        
                                    leader.rangedMassAttack(hostile)
        
                                    let goal = _.map([hostile], function(target) {
                                                return { pos: target.pos, range: 3 }
                                         })   
        
                                    leader.creepFlee(leader.pos, goal)
                                        } else {
        
                                    let goal = _.map([hostile], function(target) {
                                                return { pos: target.pos, range: 1 }
                                      })      
        
                                    leader.intraRoomPathing(leader.pos, goal)
                                     }   
        

                            } else {
        
                                let enemySpawn = leader.pos.findClosestByRange(FIND_HOSTILE_SPAWNS, {
                                            filter: (c) => c.owner.username !== "cplive" && c.owner.username !== "Brun1L" && c.owner.username !== "mrmartinstreet" && c.owner.username !== "Source Keeper"
                                 })       
        
                                if (enemySpawn && leader.moveTo(enemySpawn) != ERR_NO_PATH) {
        
                                    leader.say("Enemy Spawn")
        
                                    if (leader.pos.inRangeTo(enemySpawn, 2)) {
        
                                        leader.rangedAttack(enemySpawn)
                                           } else {
        
                                        leader.rangedAttack(enemySpawn)
                                    }        
        
                                    if (leader.pos.inRangeTo(enemySpawn, 1)) {
        
                                        leader.rangedMassAttack(enemySpawn)
                                        } el    se {
        
                                        leader.rangedAttack(enemySpawn)
                                                leader.moveTo(enemySpawn, { visualizePathStyle: { stroke: '#ffffff' } })
                                            }
                                } el        se {
        
                                    let enemyStructure = leader.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                                                filter: (c) => c.owner.username !== "cplive" && c.owner.username !== "Brun1L" && c.owner.username !== "mrmartinstreet" && c.owner.username !== "Source Keeper" && c.structureType != STRUCTURE_CONTROLLER
                                        })    
        
                                    if (enemyStructure && leader.moveTo(enemySpawn) != ERR_NO_PATH) {
        
                                        leader.say("Enemy Structure")
        
                                        if (leader.pos.inRangeTo(enemyStructure, 2)) {
        
                                            leader.rangedAttack(enemyStructure)
                                         } el       se {
        
                                            leader.rangedAttack(enemyStructure)
                                            }    
        
                                        if (leader.pos.inRangeTo(enemyStructure, 1)) {
        
                                            leader.rangedMassAttack(enemyStructure)
                                                } else {
        
                                            leader.rangedAttack(enemyStructure)
                                                    leader.moveTo(enemyStructure, { visualizePathStyle: { stroke: '#ffffff' } })
                                          }      
                                       } el     se {
        
                                        let enemyBarricade = leader.pos.findClosestByPath(FIND_STRUCTURES, {
                                                    filter: s => s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART
                                               }) 
        
                                        if (enemyBarricade) {
        
                                            let mainTarget = Game.getObjectById(leader.room.memory.mainTarget)
        
                                            leader.say("MT: " + mainTarget.pos.x + ", " + mainTarget.pos.y)
        
                                            if (!mainTarget) {
        
                                                leader.room.memory.mainTarget = enemyBarricade.id
                                                 } el   se {
        
                                                leader.room.visual.circle(mainTarget.pos, {
                                                            fill: 'transparent',
                                                            radius: 0.8,
                                                            stroke: '#39A0ED',
                                                            strokeWidth: 0.125
                                                    });    
        
                                                if (leader.pos.inRangeTo(mainTarget, 2)) {
        
                                                    creep.rangedAttack(mainTarget)
                                                       } else {
        
                                                    creep.rangedAttack(mainTarget)
                                                            leader.moveTo(mainTarget)
                                                  }      
                                                }    
                                             } el   se {
        
                                            if (creep.room.controller) {
        
                                                let goal = _.map([leader.room.controller], function(target) {
                                                            return { pos: target.pos, range: 3 }
                                                 })       
        
                                                //leader.intraRoomPathing(leader.pos, goal)
                                                }    
                                             }   
                                          }  
                                       } 
                                }    
                         } el       se {
        
                            leader.say("AT")
        
                            goal = _.map([new RoomPosition(25, 25, target)], function(pos) {
                                        return { pos: pos, range: 3 }
                                  })  
        
                            leader.onlySafeRoomPathing(leader.pos, goal)
                                }
                    } el        se {
        
                        leader.say("No M")
        
                        member.say("No L")
        
                        goal = _.map([leader], function(target) {
                                    return { pos: target.pos, range: 1 }
                              })  
        
                        member.onlySafeRoomPathing(member.pos, goal)
        
                    }
                 }       
              }      
           }     
         }   
      };  
        */