module.exports = {
    run: function(creep) {

        let lowTower = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_TOWER && s.store.getUsedCapacity(RESOURCE_ENERGY) < 500
        })

        let essentialStructure = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: (s) => (s.structureType == STRUCTURE_EXTENSION ||
                    s.structureType == STRUCTURE_SPAWN ||
                    s.structureType == STRUCTURE_TOWER && s.energy < 710) &&
                s.energy < s.energyCapacity
        })

        let ruinWithResources = creep.pos.findClosestByRange(FIND_RUINS, {
            filter: ruin => ruin.store.getUsedCapacity() >= creep.store.getFreeCapacity()
        })

        let storage = creep.room.storage
        let terminal = creep.room.terminal

        let sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
        let sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)
        let controllerContainer = Game.getObjectById(creep.room.memory.controllerContainer)

        let mineralContainer = Game.getObjectById(creep.room.memory.mineralContainer)

        let droppedEnergy = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
            filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= creep.store.getCapacity() * 0.5
        })

        let tombstone = creep.pos.findClosestByRange(FIND_TOMBSTONES, {
            filter: (s) => s.store[RESOURCE_ENERGY] >= creep.store.getCapacity() * 0.5
        })

        let powerSpawn = creep.room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_POWER_SPAWN
        })[0]

        const anchorPoint = creep.room.get("anchorPoint")

        creep.isFull()

        let task = creep.memory.task

        if (!task && anchorPoint) {

            creep.say("AP")

            if (creep.pos.getRangeTo(anchorPoint) > 1) {

                creep.travel({
                    origin: creep.pos,
                    goal: { pos: anchorPoint, range: 1 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: creep.memory.defaultCostMatrix,
                    avoidStages: [],
                    flee: false,
                    cacheAmount: 10,
                })
            }
        } else if (task == "deliverFromStorage" && (storage || terminal)) {

            if ((storage && storage.store[RESOURCE_ENERGY] < creep.store.getCapacity()) && (terminal && terminal.store[RESOURCE_ENERGY] < creep.store.getCapacity())) creep.memory.task = undefined

            creep.say("DFS")

            if (!creep.memory.isFull) {

                if (storage && storage.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity()) {

                    creep.advancedWithdraw(storage)

                } else if (terminal && terminal.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity()) {

                    creep.advancedWithdraw(terminal)
                }
            } else {

                if (lowTower) {

                    creep.room.visual.text("⚡", lowTower.pos.x, lowTower.pos.y + 0.25, { align: 'center' })

                    creep.advancedTransfer(lowTower)

                } else {

                    if (essentialStructure) {

                        creep.room.visual.text("☀️", essentialStructure.pos.x, essentialStructure.pos.y + 0.25, { align: 'center' })

                        essentialStructuresTransfer(essentialStructure)

                    } else {

                        if (creep.advancedTransfer(storage) == 0) {

                            creep.memory.task = undefined
                        }
                    }
                }
            }
        } else if (task == "deliverToControllerContainer" && controllerContainer != null) {

            creep.say("DTCC")

            if (!creep.memory.isFull) {

                if (storage && storage.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity()) {

                    creep.advancedWithdraw(storage)

                } else if (terminal && terminal.store[RESOURCE_ENERGY] >= creep.store.getFreeCapacity()) {

                    creep.advancedWithdraw(terminal)
                } else {

                    creep.memory.task = undefined
                }
            } else {

                if (creep.advancedTransfer(controllerContainer) == 0) {

                    creep.memory.task = undefined
                }
            }
        } else if (task == "sourceContainer1Full" && sourceContainer1 != null) {

            creep.say("SC1F")

            if (!creep.memory.isFull) {

                if (creep.advancedWithdraw(sourceContainer1) == 0) {

                    if (lowTower) {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: lowTower.pos, range: 1 },
                            plainCost: false,
                            swampCost: false,
                            defaultCostMatrix: creep.memory.defaultCostMatrix,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 10,
                        })
                    } else {
                        if (essentialStructure) {

                            creep.travel({
                                origin: creep.pos,
                                goal: { pos: essentialStructure.pos, range: 1 },
                                plainCost: false,
                                swampCost: false,
                                defaultCostMatrix: creep.memory.defaultCostMatrix,
                                avoidStages: [],
                                flee: false,
                                cacheAmount: 10,
                            })
                        } else {
                            if (storage) {

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
                }
            } else {

                creep.memory.task = "deliverToBest"
            }
        } else if (task == "sourceContainer2Full" && sourceContainer2 != null) {

            creep.say("SC2F")

            if (!creep.memory.isFull) {

                if (creep.advancedWithdraw(sourceContainer2) == 0) {

                    if (lowTower) {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: lowTower.pos, range: 1 },
                            plainCost: false,
                            swampCost: false,
                            defaultCostMatrix: creep.memory.defaultCostMatrix,
                            avoidStages: [],
                            flee: false,
                            cacheAmount: 10,
                        })
                    } else {
                        if (essentialStructure) {

                            creep.travel({
                                origin: creep.pos,
                                goal: { pos: essentialStructure.pos, range: 1 },
                                plainCost: false,
                                swampCost: false,
                                defaultCostMatrix: creep.memory.defaultCostMatrix,
                                avoidStages: [],
                                flee: false,
                                cacheAmount: 10,
                            })
                        } else {
                            if (storage) {

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
                }
            } else {

                creep.memory.task = "deliverToBest"
            }
        } else if (task == "tombstone") {

            creep.say("DE")

            if (!tombstone) {

                creep.memory.task = undefined
            }
            if (creep.memory.isFull) {

                creep.memory.task = "deliverToBest"
            }

            if (creep.advancedWithdraw(tombstone, RESOURCE_ENERGY) == 0) {

                creep.memory.task = "deliverToBest"
            }
        } else if (task == "droppedEnergy") {

            creep.say("TS")

            if (!droppedEnergy) {

                creep.memory.task = undefined
            }
            if (creep.memory.isFull) {

                creep.memory.task = "deliverToBest"
            }

            if (creep.pickupDroppedEnergy(droppedEnergy) == 0) {

                creep.memory.task = "deliverToBest"
            }
        } else if (task == "mineralContainerFull" && mineralContainer != null) {

            creep.say("MCF")

            let mineralType = creep.room.find(FIND_MINERALS)[0].mineralType

            if (creep.memory.isFull == false) {

                creep.advancedWithdraw(mineralContainer, mineralType)
            } else {

                if (terminal && terminal.store.getUsedCapacity() <= (terminal.store.getCapacity() - creep.store.getUsedCapacity())) {

                    if (creep.advancedTransfer(terminal, mineralType) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (storage && storage.store.getUsedCapacity() <= (storage.store.getCapacity() - creep.store.getUsedCapacity())) {

                    if (creep.advancedTransfer(storage, mineralType) == 0) {

                        creep.memory.task = undefined
                    }
                }
            }
        } else if (task == "fillPowerSpawnEnergy" && powerSpawn) {

            creep.say("FPSE")

            creep.hasResource()

            if (creep.memory.isFull == false) {

                if (terminal && terminal.store[RESOURCE_ENERGY] >= powerSpawn.store.getCapacity(RESOURCE_ENERGY)) {

                    creep.advancedWithdraw(terminal, RESOURCE_ENERGY, powerSpawn.store.getFreeCapacity(RESOURCE_ENERGY))

                } else if (storage && storage.store[RESOURCE_ENERGY] >= powerSpawn.store.getCapacity(RESOURCE_ENERGY)) {

                    creep.advancedWithdraw(storage, RESOURCE_ENERGY, powerSpawn.store.getFreeCapacity(RESOURCE_ENERGY))
                }
            } else {

                if (creep.advancedTransfer(powerSpawn, RESOURCE_ENERGY) == 0) {

                    creep.memory.task = undefined
                }
            }
        } else if (task == "fillPowerSpawnPower" && powerSpawn) {

            creep.say("FPSP")

            creep.hasResource()

            if (creep.memory.isFull == false) {

                if (terminal && terminal.store[RESOURCE_POWER] >= powerSpawn.store.getCapacity(RESOURCE_POWER)) {

                    creep.advancedWithdraw(terminal, RESOURCE_POWER, powerSpawn.store.getFreeCapacity(RESOURCE_POWER))

                } else if (storage && storage.store[RESOURCE_POWER] >= powerSpawn.store.getCapacity(RESOURCE_POWER)) {

                    creep.advancedWithdraw(storage, RESOURCE_POWER, powerSpawn.store.getFreeCapacity(RESOURCE_POWER))
                }
            } else {

                if (creep.advancedTransfer(powerSpawn, RESOURCE_POWER) == 0) {

                    creep.memory.task = undefined
                }
            }
        } else if (task == "deliverToStorage" && storage) {

            creep.say("DTS")

            creep.hasResource()

            if (creep.memory.isFull && storage) {

                for (let resourceType in creep.store) {

                    creep.advancedTransfer(storage, resourceType)
                }
            } else {

                creep.say("🚬")

                creep.memory.task = undefined
            }
        } else if (task == "deliverToBest") {

            creep.say("DTB")

            if (!creep.memory.isFull) creep.memory.task = undefined

            if (lowTower) {

                if (creep.advancedTransfer(lowTower) == 0) {

                    creep.memory.task = undefined
                }
            } else if (essentialStructure) {

                creep.room.visual.text("☀️", essentialStructure.pos.x, essentialStructure.pos.y + 0.25, { align: 'center' })

                essentialStructuresTransfer(essentialStructure)

            } else if (storage && storage.store[RESOURCE_ENERGY] <= 30000) {

                if (creep.advancedTransfer(storage) == 0) {

                    creep.memory.task = undefined
                }
            } else if (controllerContainer != null && controllerContainer.store.getFreeCapacity() >= creep.store.getUsedCapacity()) {

                if (creep.advancedTransfer(controllerContainer) == 0) {

                    creep.memory.task = undefined
                }
            } else if (storage && storage.store.getFreeCapacity() >= creep.store.getUsedCapacity()) {

                if (creep.advancedTransfer(storage) == 0) {

                    creep.memory.task = undefined
                }
            } else {

                creep.memory.task = undefined
            }
        } else if (task == "collectFromRuin") {

            creep.say("CFR")

            if (creep.memory.isFull) {

                if (terminal && terminal.store.getFreeCapacity() >= 10000) {

                    for (let resourceType in creep.store) {

                        creep.advancedTransfer(terminal, resourceType)
                    }
                } else if (storage && storage.store.getFreeCapacity() >= 50000) {

                    for (let resourceType in creep.store) {

                        creep.advancedTransfer(storage, resourceType)
                    }
                }
            } else if (ruinWithResources) {

                for (let resourceType in ruinWithResources.store) {

                    creep.advancedWithdraw(ruinWithResources, resourceType)
                }
            } else {

                creep.memory.task = undefined
            }
        }


        function essentialStructuresTransfer(essentialStructure) {

            if (creep.advancedTransfer(essentialStructure) == 0) {

                essentialStructuresAlt = creep.room.find(FIND_MY_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_EXTENSION ||
                            s.structureType == STRUCTURE_SPAWN ||
                            s.structureType == STRUCTURE_TOWER && s.energy < 710) &&
                        s.energy < s.energyCapacity && s.id != essentialStructure.id
                })

                let essentialStructureAlt = creep.pos.findClosestByRange(essentialStructuresAlt)

                if (essentialStructuresAlt.length >= 1 && creep.store[RESOURCE_ENERGY] > essentialStructureAlt.store.getFreeCapacity()) {

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
                } else if (storage) {

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

        if (creep.room.controller && creep.room.controller.level < 4) creep.avoidHostiles()
    }
};