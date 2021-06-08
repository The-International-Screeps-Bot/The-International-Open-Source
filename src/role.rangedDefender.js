let allyList = require("module.allyList")

module.exports = {
    run: function(creep) {

        let enemyCreep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: (c) => {
                return (allyList.run().indexOf(c.owner.username.toLowerCase()) === -1 && (c.body.some(i => i.type === ATTACK) || c.body.some(i => i.type === RANGED_ATTACK) || c.body.some(i => i.type === WORK) || body.some(i => i.type === CARRY)))
            }
        })

        creep.say("No Enemy")

        if (enemyCreep) {

            creep.say("Enemy")

            let target = enemyCreep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_RAMPART
            })

            if (target) {

                creep.say("Rampart")

                let origin = creep.pos

                let goal = target

                creep.rampartPathing(origin, goal)

                if (enemyCreep.pos.isNearTo(creep)) {

                    creep.rangedMassAttack(enemyCreep)
                } else {

                    creep.rangedAttack(enemyCreep)
                }
            } else {

                creep.rangedAttack(enemyCreep)

                if (!creep.pos.inRangeTo(enemyCreep, 2)) {

                    let goal = _.map([enemyCreep], function(target) {
                        return { pos: target.pos, range: 1 }
                    })

                    creep.intraRoomPathing(creep.pos, goal)
                }
                if (creep.pos.isNearTo(enemyCreep)) {

                    creep.rangedMassAttack(enemyCreep)
                }
            }
        }
    }
};