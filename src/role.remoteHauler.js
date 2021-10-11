module.exports = {
    run: function(creep) {

        const remoteRoom = creep.memory.remoteRoom

        if (!remoteRoom) return false

        const roomFrom = creep.memory.roomFrom

        const room = creep.room

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

                            essentialStructuresTransfer(essentialStructure)

                            function essentialStructuresTransfer(essentialStructure) {

                                let storage = creep.room.get("storage")

                                room.visual.text("☀️", essentialStructure.pos.x, essentialStructure.pos.y + 0.25, { align: 'center' })

                                if (creep.advancedTransfer(essentialStructure) == 0) {

                                    essentialStructuresAlt = room.find(FIND_MY_STRUCTURES, {
                                        filter: s => (s.structureType == STRUCTURE_EXTENSION ||
                                                s.structureType == STRUCTURE_SPAWN ||
                                                s.structureType == STRUCTURE_TOWER && s.store.getUsedCapacity() < 710) &&
                                            s.store.getUsedCapacity() < s.store.getCapacity() && s.id != essentialStructure.id
                                    })

                                    let essentialStructureAlt = creep.pos.findClosestByRange(essentialStructuresAlt)

                                    if (essentialStructuresAlt.length > 0 && creep.store[RESOURCE_ENERGY] > essentialStructureAlt.store.getFreeCapacity()) {

                                        if (creep.pos.getRangeTo(essentialStructureAlt) > 1) {

                                            creep.travel({
                                                origin: creep.pos,
                                                goal: { pos: essentialStructureAlt.pos, range: 1 },
                                                plainCost: false,
                                                swampCost: false,
                                                defaultCostMatrix: creep.memory.defaultCostMatrix,
                                                avoidStages: [],
                                                flee: false,
                                                cacheAmount: 10,
                                            })
                                        }
                                    } else if (storage && storage.store.getFreeCapacity() >= creep.store.getUsedCapacity()) {

                                        creep.travel({
                                            origin: creep.pos,
                                            goal: { pos: storage.pos, range: 1 },
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

                            let controllerContainer = creep.room.get("controllerContainer")

                            if (controllerContainer && controllerContainer.store.getFreeCapacity() >= creep.store.getUsedCapacity()) {

                                creep.say("CC")

                                creep.advancedTransfer(controllerContainer)

                            } else {

                                let controller = creep.room.controller

                                creep.say("C")

                                creep.travel({
                                    origin: creep.pos,
                                    goal: { pos: controller.pos, range: 5 },
                                    plainCost: false,
                                    swampCost: false,
                                    defaultCostMatrix: creep.memory.defaultCostMatrix,
                                    avoidStages: [],
                                    flee: false,
                                    cacheAmount: 10,
                                })

                                let controllerContainer = creep.room.get("controllerContainer")

                                if (!controllerContainer) {

                                    creep.drop(RESOURCE_ENERGY)
                                }
                            }
                        }
                    }
                }
            } else {

                creep.say(roomFrom)

                creep.travel({
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

                            creep.travel({
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

                            creep.travel({
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

                creep.travel({
                    origin: creep.pos,
                    goal: { pos: new RoomPosition(25, 25, remoteRoom), range: 1 },
                    plainCost: 1,
                    swampCost: 1,
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