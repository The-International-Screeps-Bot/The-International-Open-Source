module.exports = {
    run: function(creep) {

        let enemyCreep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: (c) => c.owner.username !== "cplive" && c.owner.username !== "Brun1L"
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