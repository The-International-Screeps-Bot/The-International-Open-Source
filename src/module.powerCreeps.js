let creepFunctions = require("module.powerCreepFunctions")


module.exports = {
    run: function powerCreeps() {

        for (let name in Game.powerCreeps) {

            let creep = Game.powerCreeps[name]

            if (creep.ticksToLive) {
                if (!creep.room.controller.isPowerEnabled) {

                    creep.say("PE")

                    if (creep.enableRoom(creep.room.controller) == ERR_NOT_IN_RANGE) {

                        let goal = _.map([creep.room.controller], function(target) {
                            return { pos: target.pos, range: 1 }
                        })

                        creep.intraRoomPathing(creep.pos, goal)
                    }
                } else {

                    let powerSpawn = creep.room.find(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_POWER_SPAWN
                    })[0]

                    if (creep.ticksToLive <= 1000 && powerSpawn) {

                        creep.say("R")

                        if (creep.pos.isNearTo(powerSpawn)) {

                            creep.renew(powerSpawn)

                        } else {

                            let goal = _.map([powerSpawn], function(target) {
                                return { pos: target.pos, range: 1 }
                            })

                            creep.intraRoomPathing(creep.pos, goal)
                        }
                    } else {

                        creep.isFull()

                        if (creep.memory.isFull) {

                            let terminal = creep.room.terminal
                            let storage = creep.room.storage

                            if (terminal && terminal.store.getFreeCapacity() > creep.store.getUsedCapacity()) {

                                creep.say("T")

                                creep.advancedTransfer(terminal, RESOURCE_OPS)

                            } else if (storage && storage.store.getFreeCapacity() > creep.store.getUsedCapacity()) {

                                creep.say("S")

                                creep.advancedTransfer(storage, RESOURCE_OPS)
                            }
                        } else {

                            if (creep.usePower(PWR_GENERATE_OPS) == 0) {

                                creep.say("Ops")

                                Memory.data.opsGenerated += creep.powers[PWR_GENERATE_OPS].level
                            }

                            function findPowers() {


                            }

                            creep.say("🚬")

                            if (powerSpawn && creep.pos.getRangeTo(powerSpawn) > 1) {

                                creep.say("PS")

                                let goal = _.map([powerSpawn], function(target) {
                                    return { pos: target.pos, range: 1 }
                                })

                                creep.intraRoomPathing(creep.pos, goal)
                            }
                        }
                    }
                }
            }
        }

        //creep.avoidHostiles()
    }
}