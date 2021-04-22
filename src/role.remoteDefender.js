var AttackWhitelist = ["cplive", "marvintmb"];
module.exports = {
    run: function(creep) {

        let target = creep.memory.roomFrom

        let remoteRooms = []

        _.forEach(Game.rooms, function(myRooms) {

            if (myRooms.memory.enemy == true && myRooms.memory.myRoom != false) {

                //console.log("true")
                let remoteRoomDistance = Game.map.getRoomLinearDistance(creep.room.name, myRooms.name)

                if (remoteRoomDistance == 1) {

                    creep.memory.target = myRooms.name
                    remoteRooms.push(myRooms)

                }
            }
        })

        if (remoteRooms.length == 0) {

            creep.memory.target = creep.memory.roomFrom

        }

        let hostile = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS, {
            filter: (c) => c.owner.username != "Q13214" && c.owner.username != "Brun1L" && c.owner.username != "mrmartinstreet" && c.owner.username != "Orlet" && c.owner.username != "slowmotionghost"
        })

        let hostileStructure = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
            filter: (c) => c.owner.username !== "cplive" && c.owner.username !== "Brun1L" && c.owner.username !== "mrmartinstreet" && c.owner.username !== "Public" && c.structureType !== STRUCTURE_RAMPART && c.structureType !== STRUCTURE_KEEPER_LAIR
        })

        let injuredSelf = creep.pos.findClosestByPath(FIND_MY_CREEPS, {
            filter: (s) => s.hits < s.hitsMax
        })

        if (injuredSelf) {

            creep.heal(injuredSelf)

        }
        if (hostile || hostileStructure) {

            if (hostile) {

                creep.say("H")
                creep.rangedAttack(hostile)

                if (creep.attack(hostile) == ERR_NOT_IN_RANGE) {

                    creep.moveTo(hostile)

                }
            } else if (hostileStructure) {

                creep.say("HS")
                creep.rangedAttack(hostileStructure)

                if (creep.attack(hostileStructure) == ERR_NOT_IN_RANGE) {

                    creep.moveTo(hostileStructure)

                }
            } else {

                creep.room.memory.enemy = false

            }
        } else {
            if (creep.memory.target == creep.memory.roomFrom) {

                target = creep.memory.roomFrom

                if (creep.room.name != target) {

                    creep.say("0")

                    target = creep.memory.roomFrom

                    let path = Game.map.findRoute(creep.room, target);
                    creep.memory.path = path
                    let route = creep.memory.path

                    if (route.length > 0) {

                        creep.say(target)

                        const exit = creep.pos.findClosestByRange(route[0].exit)
                        creep.moveTo(exit)
                    }
                } else if (creep.room.name == target) {

                    creep.say(target)

                    let spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS)

                    creep.moveTo(spawn)

                }
            } else {

                target = creep.memory.target

                let path = Game.map.findRoute(creep.room, target);
                creep.memory.path = path
                let route = creep.memory.path

                if (route.length > 0) {

                    creep.say(target)

                    const exit = creep.pos.findClosestByRange(route[0].exit)
                    creep.moveTo(exit)

                }

            }
        }
    }
};