module.exports = {
    run: function(creep) {
        if (creep.memory.role == "bigBoyMember" || creep.memory.role == "bigBoyLeader") {

            var bigBoys = true

        }
        if (bigBoys == true) {

            let bigBoyLeader = _.filter(Game.creeps, (c) => c.memory.role == 'bigBoyLeader');
            let bigBoyMember = _.filter(Game.creeps, (c) => c.memory.role == 'bigBoyMember');

            for (let i = 0; i < bigBoyMember.length; i++) {

                let leader = bigBoyLeader[i]
                let member = bigBoyMember[i]

                if (leader && member) {

                    let leaderIsEdge = (leader.pos.x <= 0 || leader.pos.x >= 48 || leader.pos.y <= 0 || leader.pos.y >= 48)
                    let memberIsEdge = (member.pos.x <= 0 || member.pos.x >= 49 || member.pos.y <= 0 || member.pos.y >= 49)

                    /*
                    const direction = member.pos.getDirectionTo(25, 25);
                    member.move(direction); 
                    */

                    if (leader.pos.inRangeTo(member, 1) || leaderIsEdge || memberIsEdge) {

                        leader.memory.attacking = true

                    } else {

                        leader.say("No M")
                        leader.memory.attacking = false
                        
                        member.say("No L")
                        member.moveTo(leader)

                    }
                    if (leader.memory.attacking == true) {

                        member.say("Following")
                        member.moveTo(leader)

                        let squadTarget
                        let flag = Game.flags.BB

                        let injuredCreep = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                            filter: (c) => c.owner.username == "cplive" && c.owner.username == "Brun1L" && c.owner.username == "mrmartinstreet" && c.owner.username == "Source Keeper"
                        })

                        if (injuredCreep && creep.moveTo(injuredCreep) != ERR_NO_PATH) {

                            member.say("Injured Creep")

                            if (creep.pos.inRangeTo(injuredCreep, 1)) {

                                creep.heal(injuredCreep)
                            } else if (creep.pos.inRangeTo(injuredCreep, 3)) {

                                creep.rangedHeal(injuredCreep)
                            }
                        }
                        else {
                            
                            creep.heal(creep)
                        }

                        let hostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                            filter: (c) => c.owner.username !== "cplive" && c.owner.username !== "Brun1L" && c.owner.username !== "mrmartinstreet" && c.owner.username !== "Source Keeper"
                        })

                        if (hostile && leader.moveTo(hostile) != ERR_NO_PATH) {

                            leader.say("Hostile")

                            if (leader.pos.inRangeTo(hostile, 2)) {

                                creep.rangedAttack(hostile)
                            } else {

                                creep.rangedAttack(hostile)
                                leader.moveTo(hostile)
                            }
                        } else {

                            let enemySpawn = creep.pos.findClosestByRange(FIND_HOSTILE_SPAWNS, {
                                filter: (c) => c.owner.username !== "cplive" && c.owner.username !== "Brun1L" && c.owner.username !== "mrmartinstreet" && c.owner.username !== "Source Keeper"
                            })

                            if (enemySpawn && leader.moveTo(enemySpawn) != ERR_NO_PATH) {

                                leader.say("Enemy Spawn")

                                if (leader.pos.inRangeTo(enemySpawn, 2)) {

                                    creep.rangedAttack(enemySpawn)
                                } else {

                                    creep.rangedAttack(enemySpawn)
                                    leader.moveTo(enemySpawn)
                                }
                            } else {

                                let enemyBarricade = leader.pos.findClosestByPath(FIND_STRUCTURES, {
                                    filter: s => s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART
                                })

                                if (enemyBarricade && leader.room == flag.room) {

                                    leader.say("Main Target")

                                    if (leader.memory.mainTarget) {

                                        if (leader.pos.inRangeTo(leader.memory.mainTarget, 2)) {

                                            creep.rangedAttack(leader.memory.mainTarget)
                                        } else {

                                            creep.rangedAttack(leader.memory.mainTarget)
                                            leader.moveTo(leader.memory.mainTarget)
                                        }
                                    } else {

                                        leader.memory.mainTarget = enemyBarricade
                                    }
                                } else {

                                    leader.say("BB")

                                    leader.moveTo(flag, { reusePath: 50 })
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};
/*
module.exports = {
    run: function(creep) {
        if (creep.memory.role == "bigBoyMember" || creep.memory.role == "bigBoyLeader") {

            var bigBoys = true

        }
        if (bigBoys == true) {

            let bigBoyLeader = _.filter(Game.creeps, (c) => c.memory.role == 'bigBoyLeader');
            let bigBoyMember = _.filter(Game.creeps, (c) => c.memory.role == 'bigBoyMember');

            for (let i = 0; i < bigBoyMember.length; i++) {

                let leader = bigBoyLeader[i]
                let member = bigBoyMember[i]

                if (leader && member) {

                    let leaderIsEdge = (leader.pos.x <= 0 || leader.pos.x >= 48 || leader.pos.y <= 0 || leader.pos.y >= 48)
                    let memberIsEdge = (member.pos.x <= 0 || member.pos.x >= 49 || member.pos.y <= 0 || member.pos.y >= 49)

                    /*
                    const direction = member.pos.getDirectionTo(25, 25);
                    member.move(direction); 
                    */
/*


if (leader.pos.inRangeTo(member, 1) || leaderIsEdge || memberIsEdge) {

    leader.memory.attacking = true

} else {

    leader.say("No M")
    leader.memory.attacking = false

}
if (leader.memory.attacking == true) {

    leader.say("W")

    member.moveTo(leader)
        /*
                        let leaderDirection = member.pos.getDirectionTo(leader)
                    
                        member.move(leaderDirection)
                        */
/*
member.say(bigBoyMember.length + " S")

let flag = Game.flags.BB

if (!flag) {

    leader.suicide()
    member.suicide()

}

let squadType = creep.memory.squadType

let hostile = leader.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
    filter: (c) => c.owner.username !== "cplive" && c.owner.username !== "Brun1L" && c.owner.username !== "mrmartinstreet" && c.owner.username !== "Source Keeper"
})

if (hostile && !creep.rangedAttack(hostile) == ERR_NO_PATH) {

    /*
                        let anyHostile = leader.room.find(FIND_HOSTILE_CREEPS, {
                            filter: (c) => c.owner.username != "cplive" && c.owner.username != "Brun1L" && c.owner.username != "mrmartinstreet"
                        })
*/
/*
var squadTarget = "hostile"
leader.say("H")
    //leader
leader.rangedAttack(hostile)

if (!leader.pos.inRangeTo(hostile, 3)) {

    leader.moveTo(hostile)

} else if (creep.pos.inRangeTo(hostile, 3)) {

    leader.say("Yo")

    var getawaypath = PathFinder.search(creep.pos, hostile.pos, { range: 4, flee: true }).path;
    new RoomVisual(creep.room.name).poly(getawaypath, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' });

    leader.moveByPath(getawaypath)
    member.moveByPath(getawaypath)

}
//member
member.rangedAttack(hostile)

}
else {

    let hostileSpawn = leader.pos.findClosestByRange(FIND_HOSTILE_SPAWNS, {
            filter: (c) => c.owner.username !== "cplive" && c.owner.username !== "Brun1L" && c.owner.username !== "mrmartinstreet" && c.owner.username !== "Public" && c.structureType !== STRUCTURE_RAMPART
        })
        /*
        let hostileStructure = leader.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
            filter: (c) => c.owner.username !== "cplive" && c.owner.username !== "Brun1L" && c.owner.username !== "mrmartinstreet" && c.owner.username !== "Public" && c.structureType !== STRUCTURE_RAMPART
        })
        */
/*

if (hostileSpawn && !creep.rangedAttack(hostileSpawn) == ERR_NO_PATH) {

    var squadTarget = "hostileSpawn"

    leader.say("HS")
        //leader
    if (!leader.pos.inRangeTo(hostileSpawn, 3)) {

        leader.moveTo(hostileSpawn)

    } else {

        leader.rangedAttack(hostileSpawn)

    }
    //member
    member.rangedAttack(hostileSpawn)
} else if (leader.room == flag.room) {

    let mainTarget = leader.room.memory.mainTarget

    if (Game.getObjectById(mainTarget) != null) {

        mainTarget = Game.getObjectById(leader.room.memory.mainTarget)

        var squadTarget = "mainTarget"

        leader.say("Y")

        leader.room.visual.circle(mainTarget.pos, {
            fill: 'transparent',
            radius: 0.8,
            stroke: '#39A0ED',
            strokeWidth: 0.125
        });

        if (leader.pos.inRangeTo(mainTarget, 3)) {

            leader.say("MT")
                //leader.rangedAttack(mainTarget)

        } else {

            leader.say("M - T")
            leader.moveTo(mainTarget)

        }
    } else {

        leader.say("N")

        let rawMainTarget = leader.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART
        })

        console.log(rawMainTarget)

        if (rawMainTarget) {

            leader.say("S")
            mainTarget = rawMainTarget.id
            leader.room.memory.mainTarget = mainTarget
        } else {

            var squadTarget = flag

            if (!leader.pos.inRangeTo(squadTarget, 2)) {

                leader.say("BB")
                leader.moveTo(squadTarget, { reusePath: 10 })

            } else {

                leader.say("WF")

            }
        }
    }
}
}

let injuredCreep = leader.pos.findClosestByRange(FIND_MY_CREEPS, {
    filter: (c) => c.hits < c.hitsMax
})

if (injuredCreep) {

    leader.say("IC")
        //leader
    if (!leader.pos.inRangeTo(injuredCreep, 1) && !hostile && !hostileStructure && !Game.getObjectById(creep.room.memory.mainTarget)) {

        //leader
        leader.moveTo(injuredCreep)
        leader.rangedHeal(injuredCreep)
            //member
        member.rangedHeal(injuredCreep)

    }
    //leader
    leader.heal(injuredCreep)

    //member
    member.heal(injuredCreep)

}
} else {

    member.say("No L")
    member.moveTo(leader)

}
}
}
}
}
};
*/