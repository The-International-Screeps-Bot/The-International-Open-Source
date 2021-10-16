module.exports = {
    run: function(creep) {

        creep.say("Broke")

        let closestEnemy = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: enemyCreep => !allyList.includes(enemyCreep.owner.username) && enemyCreep.hasPartsOfTypes([ATTACK, RANGED_ATTACK, WORK])
        })

        creep.say("No Enemy")

        if (closestEnemy) {

            creep.say("Enemy")

            let rampart = closestEnemy.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_RAMPART
            })

            if (rampart) {

                creep.say("Rampart")

                let goal = _.map([rampart], function(target) {
                    return { pos: target.pos, range: 0 }
                })

                creep.rampartPathing(creep.pos, goal)

                if (creep.pos.getRangeTo(closestEnemy) == 1) {

                    creep.rangedMassAttack()
                } else {

                    creep.rangedAttack(closestEnemy)
                }
            } else {

                creep.say("NE")

                if (!(closestEnemy.pos.x <= 0 || closestEnemy.pos.x >= 49 || closestEnemy.pos.y <= 0 || closestEnemy.pos.y >= 49)) {

                    creep.say("H")

                    if (creep.pos.getRangeTo(closestEnemy) > 3) {

                        let goal = _.map([closestEnemy], function(rampart) {
                            return { pos: rampart.pos, range: 1 }
                        })

                        creep.intraRoomPathing(creep.pos, goal)

                    } else {

                        if (creep.pos.getRangeTo(closestEnemy) == 1) {

                            creep.rangedMassAttack()

                        } else if (creep.pos.getRangeTo(closestEnemy) <= 3) {

                            creep.rangedAttack(closestEnemy)
                        }
                    }
                    if (creep.pos.getRangeTo(closestEnemy) <= 2) {

                        let goal = _.map([closestEnemy], function(rampart) {
                            return { pos: rampart.pos, range: 3 }
                        })

                        creep.creepFlee(creep.pos, goal)
                    }
                }
            }
        } else {

            let spawn = creep.room.find(FIND_MY_SPAWNS)[0]

            if (creep.pos.getRangeTo(spawn) >= 6) {

                let goal = _.map([spawn], function(rampart) {
                    return { pos: rampart.pos, range: 1 }
                })

                creep.intraRoomPathing(creep.pos, goal)
            }
        }
    }
};