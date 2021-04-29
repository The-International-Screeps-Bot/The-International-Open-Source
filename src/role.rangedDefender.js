module.exports = {
    run: function(creep) {
        
        creep.checkRoom()

        let enemyCreep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: (c) => c.owner.username !== "cplive" && c.owner.username !== "Brun1L" && c.owner.username !== "Invader"
        })
        
        creep.say("No Enemy")
        
        if (enemyCreep) { 
            
            creep.say("Enemy")
        
            let target = enemyCreep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_RAMPART
            })
        
            if (target) { 
                
                creep.say("Rampart")
            
                creep.attack(enemyCreep)
                creep.moveTo(target)
            }
        }
        
        /*
        let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_RAMPART
        })

        for (let rampart of ramparts) {

            if (enemyCreep && rampart.pos.inRangeTo(enemyCreep, 2)) {

                target = rampart
                break
            }
        }
        if (target && enemyCreep) {
        
            if (!creep.pos.inRangeTo(target, 0)) {
                
                creep.moveTo(target, {reusePath: 50})
            }
            
            if (creep.pos.inRangeTo(enemyCreep, 1)) {
                
                creep.rangedMassAttack(enemyCreep)
            }
            else if (creep.pos.inRangeTo(enemyCreep, 2)) {
                
                creep.rangedAttack(enemyCreep)
            }
            else if (creep.pos.inRangeTo(enemyCreep, 3)) {
                
                creep.rangedAttack(enemyCreep)
            }
        }
        */
    }
};