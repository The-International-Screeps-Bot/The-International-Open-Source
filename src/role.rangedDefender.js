module.exports = {
    run: function(creep) {
        
        if (creep.memory.roomFrom && creep.room.name != creep.memory.roomFrom) {

                const route = Game.map.findRoute(creep.room.name, creep.memory.roomFrom);

                if (route.length > 0) {

                    creep.say(creep.memory.roomFrom)

                    const exit = creep.pos.findClosestByRange(route[0].exit);
                    creep.moveTo(exit);
                }
            }

        var enemyCreep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: (c) => {
                filter: (c) => c.owner.username !== "cplive" && c.owner.username !== "Brun1L" && c.owner.username !== "mrmartinstreet" && c.owner.username !== "Source Keeper"
            }
        });

        let target
        let ramparts = creep.room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_RAMPART
        })

        for (let rampart of ramparts) {

            if (rampart.pos.inRangeTo(enemyCreep)) {

                target = rampart
                return
            }
        }
        
        if (!creep.pos.inRangeTo(target, 0)) {
            
            creep.moveTo(target, {reusePath: 50})
        }
        
        if (creep.pos.inRangeTo(enemyCreep, 1)) {
            
            creep.rangedMassAttack(enemyCreep)
        }
        else if (creep.pos.inRangeTo(enemyCreep, 3)) {
            
            creep.rangedAttack(enemyCreep)
        }
    }
};