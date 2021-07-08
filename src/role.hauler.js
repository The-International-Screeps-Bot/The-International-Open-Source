module.exports = {
    run: function(creep) {

        let lowTower = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: (s) => (s.structureType == STRUCTURE_TOWER) && s.energy < 500
        })

        let essentialStructure = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
            filter: (s) => (s.structureType == STRUCTURE_EXTENSION ||
                    s.structureType == STRUCTURE_SPAWN ||
                    s.structureType == STRUCTURE_TOWER && s.energy < 710) &&
                s.energy < s.energyCapacity
        })

        let storage = creep.room.storage
        let terminal = creep.room.terminal

        let sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
        let sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)
        let controllerContainer = Game.getObjectById(creep.room.memory.controllerContainer)

        let mineralContainer = Game.getObjectById(creep.room.memory.mineralContainer)

        let controllerLink = Game.getObjectById(creep.room.memory.controllerLink)

        let droppedEnergy = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
            filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= creep.store.getCapacity()
        })

        let powerSpawn = creep.room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_POWER_SPAWN
        })[0]

        let task = creep.memory.task

        if (task == "deliverFromStorage" && storage) {

            creep.say("DFS")

            creep.isFull()

            if (creep.memory.isFull == false) {

                creep.advancedWithdraw(storage)
            } else {

                if (lowTower) {

                    creep.room.visual.text("⚡", lowTower.pos.x, lowTower.pos.y + 0.25, { align: 'center' })

                    creep.advancedTransfer(lowTower)

                } else {

                    if (essentialStructure) {

                        creep.room.visual.text("☀️", essentialStructure.pos.x, essentialStructure.pos.y + 0.25, { align: 'center' })

                        creep.advancedTransfer(essentialStructure)

                    } else {

                        if (creep.advancedTransfer(storage) == 0) {

                            creep.memory.task = undefined
                        }
                    }
                }
            }
        } else if (task == "deliverToControllerContainer" && controllerContainer != null && storage) {

            creep.say("DTCC")

            creep.isFull()

            if (creep.memory.isFull == false) {

                creep.advancedWithdraw(storage)

            } else {

                if (creep.advancedTransfer(controllerContainer) == 0) {

                    creep.memory.task = undefined
                }
            }
        } else if (task == "sourceContainer1Full" && sourceContainer1 != null) {

            creep.say("SC1F")

            creep.isFull()

            if (creep.memory.isFull == false) {

                creep.advancedWithdraw(sourceContainer1)
            } else {

                if (lowTower) {

                    if (creep.advancedTransfer(lowTower) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (essentialStructure) {

                    if (creep.advancedTransfer(essentialStructure) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (storage && storage.store[RESOURCE_ENERGY] <= 30000) {

                    if (creep.advancedTransfer(storage) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (controllerContainer != null && controllerContainer.store[RESOURCE_ENERGY] <= 1000) {

                    if (creep.advancedTransfer(controllerContainer) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (storage) {

                    if (creep.advancedTransfer(storage) == 0) {

                        creep.memory.task = undefined
                    }
                } else {

                    task = "noDeliveryPossible"
                }
            }
        } else if (task == "sourceContainer2Full" && sourceContainer2 != null) {

            creep.say("SC2F")

            creep.isFull()

            if (creep.memory.isFull == false) {

                creep.advancedWithdraw(sourceContainer2)
            } else {

                if (lowTower) {

                    if (creep.advancedTransfer(lowTower) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (essentialStructure) {

                    if (creep.advancedTransfer(essentialStructure) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (storage && storage.store[RESOURCE_ENERGY] <= 30000) {

                    if (creep.advancedTransfer(storage) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (controllerContainer != null && controllerContainer.store[RESOURCE_ENERGY] <= 1000) {

                    if (creep.advancedTransfer(controllerContainer) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (storage) {

                    if (creep.advancedTransfer(storage) == 0) {

                        creep.memory.task = undefined
                    }
                } else {

                    task = "noDeliveryPossible"
                }
            }
        } else if (task == "droppedEnergy") {

            creep.say("DE")

            if (!droppedEnergy && !creep.memory.isFull) {

                creep.memory.task = undefined
            }

            creep.isFull()

            if (creep.memory.isFull == false) {

                creep.pickupDroppedEnergy(droppedEnergy)

            } else {

                if (lowTower) {

                    if (creep.advancedTransfer(lowTower) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (essentialStructure) {

                    if (creep.advancedTransfer(essentialStructure) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (storage && storage.store[RESOURCE_ENERGY] <= 30000) {

                    if (creep.advancedTransfer(storage) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (controllerContainer != null && controllerContainer.store[RESOURCE_ENERGY] <= 1000) {

                    if (creep.advancedTransfer(controllerContainer) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (storage) {

                    if (creep.advancedTransfer(storage) == 0) {

                        creep.memory.task = undefined
                    }
                } else {

                    task = "noDeliveryPossible"
                }
            }
        } else if (task == "fillPowerSpawn" && powerSpawn) {

            creep.say("FPS")

            if (powerSpawn.store.getUsedCapacity(RESOURCE_ENERGY) != powerSpawn.store.getCapacity(RESOURCE_ENERGY)) {

                var resource = { type: RESOURCE_ENERGY, amount: powerSpawn.store.getCapacity(RESOURCE_ENERGY) - powerSpawn.store.getUsedCapacity(RESOURCE_ENERGY) }
            } else {

                var resource = { type: RESOURCE_POWER, amount: powerSpawn.store.getCapacity(RESOURCE_POWER) - powerSpawn.store.getUsedCapacity(RESOURCE_POWER) }
            }

            creep.hasResource()

            if (creep.memory.isFull == false) {

                if (terminal && terminal.store[resource.type] >= resource.amount) {

                    creep.advancedWithdraw(terminal, resource.type, resource.amount)

                } else if (storage && storage.store[resource.type] >= resource.amount) {

                    creep.advancedWithdraw(storage, resource.type, resource.amount)
                }
            } else {

                if (creep.store.getUsedCapacity(resource.type) == creep.store.getUsedCapacity()) {

                    if (creep.advancedTransfer(powerSpawn, resource.type) == 0) {

                        creep.memory.task = undefined
                    }
                } else {

                    creep.memory.task = "deliverToStorage"
                }
            }
        } else if (task == "mineralContainerFull" && mineralContainer != null) {

            creep.say("MCF")

            creep.isFull()

            if (creep.memory.isFull == false) {

                creep.advancedWithdraw(mineralContainer)
            } else {

                if (terminal && terminal.getUsedCapacity() <= terminal.store.getCapacity()) {

                    if (creep.advancedTransfer(terminal) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (storage && storage.getUsedCapacity() <= storage.store.getCapacity()) {

                    if (creep.advancedTransfer(storage) == 0) {

                        creep.memory.task = undefined
                    }
                } else {

                    task = "noDeliveryPossible"
                }
            }
        } else if ((!task || task == "deliverToStorage") && storage) {

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
        } else if ((!task || task == "noDeliveryPossible") && storage) {

            creep.say("NDP")

            if (creep.memory.isFull) {

                let spawn = creep.room.find(FIND_MY_SPAWNS)[0]

                if (creep.pos.getRangeTo(spawn) >= 4) {

                    let goal = _.map([spawn], function(target) {
                        return { pos: target.pos, range: 1 }
                    })

                    creep.intraRoomPathing(creep.pos, goal)
                }
            }
        }

        creep.avoidHostiles()
    }
};