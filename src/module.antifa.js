let _ = require('lodash'); // Used for VS Code Intellisense
let allyList = require('module.allyList');

module.exports = {
    // Used for VS Code Intellisense
    /**
     * @param {Creep} creep 
     */
    run: creep => {
        // We already know were attacking, thank you screeps
        creep.notifyWhenAttacked(false);

        var attackTarget = Memory.global.attackTarget;

        if(attackTarget){
            if(creep.memory.role == 'antifaAssaulter'){
                // Check if we have a Memorised Member
                if(!creep.memory.supporter){
                    // If not then try find one
                    creep.say('No MM');

                    var supporter = _.filter(Game.creeps, c => c.memory.role == 'antifaSupporter' && !c.memory.leader).sort((a, b) => creep.pos.getRangeTo(a.pos) - creep.pos.getRangeTo(b.pos))[0];
                    if(supporter){
                        creep.memory.supporter = supporter.id;
                        supporter.memory.leader = creep.id;
                    }
                }else{
                    var supporter = Game.getObjectById(creep.memory.supporter);

                    if(!supporter && creep.room.name == creep.memory.roomFrom){
                        // If our Member is dead and were still in the spawn room, await a new one
                        delete creep.memory.supporter;
                    }else{
                        // If we have a Member and were not near the edge, wait for their fatigue to be 0(prevent splitting in swamps) and next to us
                        if((supporter && (supporter.fatigue != 0 || !supporter.pos.isNearTo(creep))) && !(creep.pos.x <= 0 || creep.pos.x >= 48 || creep.pos.y <= 0 || creep.pos.y >= 48)){
                            creep.say('No M');
                        }else{
                            if(creep.room.name != attackTarget){
                                var route = Game.map.findRoute(creep.room.name, attackTarget);

                                var target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
                                    filter: (c) => {
                                        return (allyList.run().indexOf(c.owner.username.toLowerCase()) === -1);
                                    }
                                });
                                if(target && creep.pos.getRangeTo(target) <= 3) creep.attack(target); // If a hostile is near us while travelling attack it

                                if(route.length > 0){
                                    creep.say('AT');
                                    creep.moveTo(creep.room.find(route[0].exit)[0], { maxRooms: 1 }); // maxRooms set to 1 so pathing doesnt take us to room exit unless we want it to
                                }else{
                                    creep.say('No P');
                                }
                            }else{
                                /** @type {Creep | AnyStructure } */ var target; // JSDoc comment used for VS Code Intellisense

                                // Find findClosestByPath would either return the closest target or null if they are unreachable(behind a wall/rampart)
                                target = creep.pos.findClosestByPath(FIND_HOSTILE_CREEPS, {
                                    filter: (c) => {
                                        return (allyList.run().indexOf(c.owner.username.toLowerCase()) === -1);
                                    }
                                });
                                if(!target) target = creep.pos.findClosestByPath(FIND_HOSTILE_SPAWNS, {
                                    filter: (c) => {
                                        return (allyList.run().indexOf(c.owner.username.toLowerCase()) === -1) && c.owner.username !== "Source Keeper";
                                    }
                                });
                                if(!target) target = creep.pos.findClosestByPath(FIND_HOSTILE_STRUCTURES, {
                                    filter: (c) => {
                                        return (allyList.run().indexOf(c.owner.username.toLowerCase()) === -1) && c.owner.username !== "Source Keeper" && c.structureType != STRUCTURE_CONTROLLER;
                                    }
                                })
                                if(!target) target = creep.pos.findClosestByPath(FIND_STRUCTURES, {
                                    filter: s => s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART
                                });

                                if(target){
                                    creep.say('H');
                                    // TODO: Improved attacking & self detection of body parts
                                    creep.attack(target);
                                    creep.rangedAttack(target);
                                }

                                // Make sure were not on the edge & move towards target
                                if((creep.pos.x <= 0 || creep.pos.x >= 48 || creep.pos.y <= 0 || creep.pos.y >= 48) || (supporter && (supporter.pos.x <= 0 || supporter.pos.x >= 48 || supporter.pos.y <= 0 || supporter.pos.y >= 48))){
                                    creep.moveTo(25, 25);
                                }else if(target){
                                    creep.moveTo(target);
                                }
                            }
                        }
                    }
                }
            }

            if(creep.memory.role == 'antifaSupporter'){
                // Check if we have a Memorised Leader
                if(creep.memory.leader){
                    /** @type {Creep} */ var leader = Game.getObjectById(creep.memory.leader);

                    if(leader){
                        if(creep.pos.isNearTo(leader.pos)){
                            creep.say('F');
                            creep.move(creep.pos.getDirectionTo(leader.pos));

                            // Heal leader if damaged, else focus on ourself
                            if(leader.hits != leader.hitsMax){
                                creep.heal(leader);
                            }else{
                                creep.heal(creep);
                            }
                        }else{
                            creep.say('No L');
                            creep.moveTo(leader);
                            creep.heal(creep);
                        }
                    }else{
                        // Removed Memorised Leader if dead, this creep can't function without one
                        delete creep.memory.leader;
                    }
                }else{
                    // If not wait for one & heal ourself
                    creep.say('No ML');
                    creep.heal();
                }
            }
        }
    }
}
