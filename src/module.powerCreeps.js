let creepFunctions = require("module.powerCreepFunctions")
let allyList = require("module.allyList")

module.exports = {
    run: function powerCreeps() {

        for (let name in Game.powerCreeps) {

            let creep = Game.powerCreeps[name]

            if (creep.room.controller.isPowerEnabled == false) {

                if (creep.enableRoom(creep.room.controller) == ERR_NOT_IN_RANGE) {

                    creep.moveTo(creep.room.controller)
                }
            }

            let powerSpawn = creep.room.find(FIND_MY_STRUCTURES, {
                filter: s => s.structureType == STRUCTURE_POWER_SPAWN
            })[0]

            if (creep.ticksToLive <= 1000 && powerSpawn) {

                if (creep.pos.isNearTo(powerSpawn)) {

                    creep.renew(powerSpawn)

                } else {

                    creep.intraRoomPathing(creep.pos, powerSpawn)
                }
            }

            creep.isFull()

            if (creep.memory.isFull) {

                if (creep.room.terminal) {

                    for (let resourceType in creep.store) {

                        creep.advancedTransfer(creep.room.terminal, resourceType)
                    }
                } else if (creep.room.storage) {

                    for (let resourceType in creep.store) {

                        creep.advancedTransfer(creep.room.terminal, resourceType)
                    }
                }
            } else {

                creep.usePower(PWR_GENERATE_OPS)

                if (powerSpawn && !creep.pos.isNearTo(powerSpawn)) {

                    creep.intraRoomPathing(creep.pos, powerSpawn)
                }
            }
        }
    }
}