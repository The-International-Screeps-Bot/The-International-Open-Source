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

                    }
                    if (leader.memory.attacking == true) {

                        leader.say("W")

                        member.moveTo(leader)
                            /*
                        let leaderDirection = member.pos.getDirectionTo(leader)
                    
                        member.move(leaderDirection)
                        */
                        member.say(bigBoyMember.length + " S")

                        let flag = Game.flags.BB
                        let squadTarget = flag

                        if (!flag) {

                            leader.suicide()
                            member.suicide()

                        }

                        let squadType = creep.memory.squadType

                        let hostile = leader.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
                            filter: (c) => c.owner.username !== "cplive" && c.owner.username !== "Brun1L" && c.owner.username !== "mrmartinstreet" && c.owner.username !== "Source Keeper"
                        })

                        if (hostile && !creep.attack(hostile) == ERR_NO_PATH) {

                            /*
                        let anyHostile = leader.room.find(FIND_HOSTILE_CREEPS, {
                            filter: (c) => c.owner.username != "cplive" && c.owner.username != "Brun1L" && c.owner.username != "mrmartinstreet"
                        })
*/
                            squadTarget = hostile
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

                        } else {

                            let hostileSpawn = leader.pos.findClosestByRange(FIND_HOSTILE_SPAWNS, {
                                    filter: (c) => c.owner.username !== "cplive" && c.owner.username !== "Brun1L" && c.owner.username !== "mrmartinstreet" && c.owner.username !== "Public" && c.structureType !== STRUCTURE_RAMPART
                                })
                                /*
                                let hostileStructure = leader.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                                    filter: (c) => c.owner.username !== "cplive" && c.owner.username !== "Brun1L" && c.owner.username !== "mrmartinstreet" && c.owner.username !== "Public" && c.structureType !== STRUCTURE_RAMPART
                                })
                                */

                            if (hostileSpawn && !creep.attack(hostileSpawn) == ERR_NO_PATH) {

                                squadTarget = hostileSpawn
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

                                    squadTarget = mainTarget

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

                                        squadTarget = "mainTarget"

                                        leader.say("S")
                                        mainTarget = rawMainTarget.id
                                        leader.room.memory.mainTarget = mainTarget
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
                        if (squadTarget == flag) {

                            squadTarget = flag
                                /*
                                if (squadTarget.room != leader.room) {

                                    const route = Game.map.findRoute(leader.room, squadTarget.room);

                                    if (route.length > 0) {

                                        leader.say("BB")

                                        const exit = leader.pos.findClosestByRange(route[0].exit);
                                        leader.moveTo(exit, { reusePath: 10 });
                                    }
                                } else */
                            if (!leader.pos.inRangeTo(squadTarget, 2)) {

                                leader.say("BB")
                                leader.moveTo(squadTarget, { reusePath: 10 })

                            } else {

                                leader.say("WF")

                            }
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