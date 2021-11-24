require("powerCreepFunctions")

module.exports = function powerCreepManager(room) {

    const powerCreeps = room.get("myPowerCreeps")

    if (powerCreeps.length == 0) return

    for (const creep of powerCreeps) {

        if (!creep.ticksToLive) continue

        function enablePower() {

            if (room.controller.isPowerEnabled) return

            creep.say("PE")

            if (creep.enableRoom(creep.room.controller) == ERR_NOT_IN_RANGE) {

                let goal = _.map([creep.room.controller], function(target) {
                    return { pos: target.pos, range: 1 }
                })

                creep.intraRoomPathing(creep.pos, goal)
            }

            return true
        }

        if (enablePower()) continue

        const powerSpawn = room.get('powerSpawn')

        function renew() {

            if (creep.ticksToLive > 1000) return

            if (!powerSpawn) return


            creep.say("R")

            if (creep.pos.isNearTo(powerSpawn)) {

                creep.renew(powerSpawn)

            } else {

                let goal = _.map([powerSpawn], function(target) {
                    return { pos: target.pos, range: 1 }
                })

                creep.intraRoomPathing(creep.pos, goal)
            }

            return true
        }

        if (renew()) continue

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

            if (regenSource()) continue

            function regenSource() {

                const power = PWR_REGEN_SOURCE

                if (!creep.hasPower(power)) return

                creep.say("RS")

                const sources = room.get('sources')

                for (const source of sources) {

                    if (source.effects) {

                        const effectsWithPower = source.effects.filter(effectObj => effectObj.effect == power)[0]
                        if (effectsWithPower) continue
                    }

                    if (creep.usePower(power, source) == ERR_NOT_IN_RANGE) {

                        let goal = _.map([source], function(target) {
                            return { pos: target.pos, range: 1 }
                        })

                        creep.intraRoomPathing(creep.pos, goal)
                        return true
                    }
                }
            }

            if (idle()) continue

            function idle() {

                creep.say("🚬")

                const anchorPoint = room.get('anchorPoint')

                if (creep.pos.getRangeTo(anchorPoint) < 6) {

                    let goal = _.map([anchorPoint], function(target) {
                        return { pos: target, range: 6 }
                    })

                    creep.intraRoomPathing(creep.pos, goal)
                    return true
                }

                if (creep.pos.getRangeTo(anchorPoint) > 6) {

                    let goal = _.map([anchorPoint], function(target) {
                        return { pos: target, range: 6 }
                    })

                    creep.creepFlee(creep.pos, goal)
                    return true
                }
            }
        }
    }
}