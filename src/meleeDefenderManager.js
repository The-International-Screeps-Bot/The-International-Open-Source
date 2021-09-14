function meleeDefenderManager(room, creepsWithRole) {

    let hostiles = room.find(FIND_HOSTILE_CREEPS, {
        filter: hostileCreep => !allyList.includes(hostileCreep.owner.username) && hostileCreep.hasPartsOfTypes([ATTACK, RANGED_ATTACK, WORK])
    })

    for (let creep of creepsWithRole) {

        creep.say("NH")

        if (hostiles.length > 0) {

            creep.say("H")

            let hostile = creep.pos.findClosestByRange(hostiles)

            let ramparts = room.find(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_RAMPART
            })

            if (ramparts.length > 0) {

                let openRamparts = []

                let cm = new PathFinder.CostMatrix

                for (let rampart of ramparts) {

                    let creeps = room.find(FIND_MY_CREEPS)

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

                        creep.travel({
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
                }
            }
        }
    }
}

module.exports = meleeDefenderManager