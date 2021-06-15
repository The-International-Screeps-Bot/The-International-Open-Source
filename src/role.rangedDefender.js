let allyList = require("module.allyList")

module.exports = {
    run: function(creep) {

        let closestHostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: (c) => {
                return (allyList.run().indexOf(c.owner.username.toLowerCase()) === -1 && (c.body.some(i => i.type === ATTACK) || c.body.some(i => i.type === RANGED_ATTACK) || c.body.some(i => i.type === WORK) || body.some(i => i.type === CARRY)))
            }
        })

        creep.say("No Enemy")

        if (closestHostile) {

            creep.say("Enemy")

            let target = closestHostile.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_RAMPART
            })

            if (target) {

                creep.say("Rampart")

                let origin = creep.pos

                let goal = target

                creep.rampartPathing(origin, goal)

                if (closestHostile.pos.isNearTo(creep)) {

                    creep.rangedMassAttack(closestHostile)
                } else {

                    creep.rangedAttack(closestHostile)
                }
            } else {

                if (!(closestHostile.pos.x <= 0 || closestHostile.pos.x >= 48 || closestHostile.pos.y <= 0 || closestHostile.pos.y >= 48)) {

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
                            return { pos: target.pos, range: 3 }
                        })

                        creep.creepFlee(creep.pos, goal)
                    }
                }
            }
        }
    }
};