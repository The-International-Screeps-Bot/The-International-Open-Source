let creepFunctions = require("module.powerCreepFunctions")
let allyList = require("module.allyList")

module.exports = {
    run: function powerCreeps() {

        for (let name in Game.powerCreeps) {

            let creep = Game.powerCreeps[name]

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

            if (creep.isFull) {

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

                if (powerSPawn && !creep.pos.isNearTo(powerSpawn)) {

                    creep.intraRoomPathing(creep.pos, powerSpawn)
                }

                creep.usePower(PWR_GENERATE_OPS)
            }
        }
    }
}