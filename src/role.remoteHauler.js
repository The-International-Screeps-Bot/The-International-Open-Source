module.exports = {
    run: function(creep) {

        const remoteRoom = creep.memory.remoteRoom

        if (!remoteRoom) return false

        const roomFrom = creep.memory.roomFrom

        creep.isFull()

        if (creep.memory.isFull) {

            if (creep.room.name == roomFrom) {

                let storage = creep.room.storage

                if (storage && storage.store[RESOURCE_ENERGY] < 400000 && storage.store.getFreeCapacity() >= creep.store.getUsedCapacity()) {

                    creep.say("S");

                    creep.advancedTransfer(storage)

                } else {

                    let terminal = creep.room.terminal

                    if (terminal && terminal.store[RESOURCE_ENERGY] < 100000 && terminal.store.getFreeCapacity() >= creep.store.getUsedCapacity()) {

                        creep.say("T");

                        creep.advancedTransfer(terminal)

                    } else {

                        let essentialStructure = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                            filter: (s) => (s.structureType == STRUCTURE_EXTENSION ||
                                    s.structureType == STRUCTURE_SPAWN ||
                                    s.structureType == STRUCTURE_TOWER && s.energy < 710) &&
                                s.energy < s.energyCapacity
                        })

                        if (essentialStructure) {

                            creep.room.visual.text("☀️", essentialStructure.pos.x, essentialStructure.pos.y + 0.25, { align: 'center' })

                            if (creep.advancedTransfer(essentialStructure) == 0) {

                                let structureToMoveTo = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                                    filter: (s) => (s.structureType == STRUCTURE_EXTENSION ||
                                            s.structureType == STRUCTURE_SPAWN ||
                                            s.structureType == STRUCTURE_TOWER && s.energy < 710) &&
                                        s.energy < s.energyCapacity && s.id != essentialStructure.id
                                })

                                if (structureToMoveTo) {

                                    if (structureToMoveTo.pos.getRangeTo(creep) > 1) {

                                        creep.advancedPathing({
                                            origin: creep.pos,
                                            goal: { pos: structureToMoveTo.pos, range: 1 },
                                            plainCost: false,
                                            swampCost: false,
                                            defaultCostMatrix: creep.memory.defaultCostMatrix,
                                            avoidStages: [],
                                            flee: false,
                                            cacheAmount: 10,
                                        })
                                    }
                                }
                            }
                        } else {
                            let controllerContainer = Game.getObjectById(creep.room.memory.controllerContainer)

                            if (controllerContainer != null && controllerContainer.store[RESOURCE_ENERGY] <= 1000) {

                                creep.advancedTransfer(controllerContainer)

                            } else {

                                let spawn = creep.pos.findClosestByRange(FIND_MY_SPAWNS)

                                creep.say("S")

                                if (spawn && creep.pos.getRangeTo(spawn) > 5) {

                                    creep.advancedPathing({
                                        origin: creep.pos,
                                        goal: { pos: spawn.pos, range: 5 },
                                        plainCost: false,
                                        swampCost: false,
                                        defaultCostMatrix: creep.memory.defaultCostMatrix,
                                        avoidStages: [],
                                        flee: false,
                                        cacheAmount: 10,
                                    })
                                }
                            }
                        }
                    }
                }
            } else {

                creep.say(roomFrom)

                creep.advancedPathing({
                    origin: creep.pos,
                    goal: { pos: new RoomPosition(25, 25, roomFrom), range: 1 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: creep.memory.defaultCostMatrix,
                    avoidStages: ["enemyRoom", "keeperRoom", "enemyReservation"],
                    flee: false,
                    cacheAmount: 10,
                })
            }
        } else {

            if (creep.room.name == remoteRoom) {

                let container = creep.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER && s.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity()
                })

                if (container) {

                    creep.say("🛄")

                    creep.advancedWithdraw(container)

                } else {

                    let droppedResources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                        filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= creep.store.getFreeCapacity() * 0.5
                    });

                    if (droppedResources) {

                        creep.say("💡")

                        creep.pickupDroppedEnergy(droppedResources)

                    } else {

                        let closestSource = creep.pos.findClosestByRange(FIND_SOURCES)

                        creep.say("🔦")

                        if (creep.pos.getRangeTo(closestSource) > 3) {

                            creep.advancedPathing({
                                origin: creep.pos,
                                goal: { pos: closestSource.pos, range: 1 },
                                plainCost: false,
                                swampCost: false,
                                defaultCostMatrix: creep.memory.defaultCostMatrix,
                                avoidStages: [],
                                flee: false,
                                cacheAmount: 10,
                            })
                        } else if (creep.pos.getRangeTo(closestSource) < 3) {

                            creep.advancedPathing({
                                origin: creep.pos,
                                goal: { pos: closestSource.pos, range: 3 },
                                plainCost: false,
                                swampCost: false,
                                defaultCostMatrix: creep.memory.defaultCostMatrix,
                                avoidStages: [],
                                flee: true,
                                cacheAmount: 10,
                            })
                        }
                    }
                }
            } else {

                creep.say(remoteRoom)

                creep.advancedPathing({
                    origin: creep.pos,
                    goal: { pos: new RoomPosition(25, 25, remoteRoom), range: 1 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: creep.memory.defaultCostMatrix,
                    avoidStages: ["enemyRoom", "keeperRoom", "enemyReservation"],
                    flee: false,
                    cacheAmount: 10,
                })
            }
        }

        creep.avoidHostiles()
    }
}