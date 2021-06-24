let creepFunctions = require("module.powerCreepFunctions")
let allyList = require("module.allyList")

module.exports = {
    run: function powerCreeps() {

        for (let name in Game.powerCreeps) {

            let creep = Game.powerCreeps[name]

            if (creep.ticksToLive) {
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

                    let terminal = creep.room.terminal
                    let storage = creep.room.storage

                    if (terminal && terminal.store.getFreeCapacity() > creep.store.getUsedCapacity()) {

                        creep.advancedTransfer(terminal, RESOURCE_OPS)

                    } else if (storage && storage.store.getFreeCapacity() > creep.store.getUsedCapacity()) {

                        creep.advancedTransfer(storage, RESOURCE_OPS)
                    }
                } else {

                    creep.usePower(PWR_GENERATE_OPS)

                    if (powerSpawn && !creep.pos.isNearTo(powerSpawn)) {

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