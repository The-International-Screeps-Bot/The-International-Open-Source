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

        let sourceContainer1 = Game.getObjectById(creep.room.memory.sourceContainer1)
        let sourceContainer2 = Game.getObjectById(creep.room.memory.sourceContainer2)
        let controllerContainer = Game.getObjectById(creep.room.memory.controllerContainer)

        let controllerLink = Game.getObjectById(creep.room.memory.controllerLink)

        let task = creep.memory.task

        if (task == "deliverFromStorage" && storage) {

            creep.isFull()

            if (creep.memory.isFull == false) {

                creep.energyWithdraw(storage)
            } else {

                if (lowTower) {

                    if (creep.energyTransfer(lowTower) == 0) {

                        creep.memory.task = undefined
                    }
                } else {

                    if (essentialStructure) {

                        if (creep.energyTransfer(essentialStructure) == 0) {

                            creep.memory.task = undefined
                        }
                    } else {

                        if (creep.energyTransfer(storage) == 0) {

                            creep.memory.task = undefined
                        }
                    }
                }
            }
        } else if (task == "deliverToControllerContainer" && controllerContainer != null && storage) {

            creep.isFull()

            if (creep.memory.isFull == false) {

                creep.energyWithdraw(storage)

            } else {

                if (creep.energyTransfer(controllerContainer) == 0) {

                    creep.memory.task = undefined
                }
            }
        } else if (task == "sourceContainer1Full" && sourceContainer1 != null) {

            creep.isFull()

            if (creep.memory.isFull == false) {

                creep.energyWithdraw(sourceContainer1)
            } else {

                if (lowTower) {

                    if (creep.energyTransfer(lowTower) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (essentialStructure) {

                    if (creep.energyTransfer(essentialStructure) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (storage && storage.store[RESOURCE_ENERGY] <= 30000) {

                    if (creep.energyTransfer(storage) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (controllerContainer != null && controllerContainer.store[RESOURCE_ENERGY] <= 1000) {

                    if (creep.energyTransfer(controllerContainer) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (storage) {

                    if (creep.energyTransfer(storage) == 0) {

                        creep.memory.task = undefined
                    }
                }
            }
        } else if (task == "sourceContainer2Full" && sourceContainer2 != null) {

            creep.isFull()

            if (creep.memory.isFull == false) {

                creep.energyWithdraw(sourceContainer2)
            } else {

                if (lowTower) {

                    if (creep.energyTransfer(lowTower) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (essentialStructure) {

                    if (creep.energyTransfer(essentialStructure) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (storage && storage.store[RESOURCE_ENERGY] <= 30000) {

                    if (creep.energyTransfer(storage) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (controllerContainer != null && controllerContainer.store[RESOURCE_ENERGY] <= 1000) {

                    if (creep.energyTransfer(controllerContainer) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (storage) {

                    if (creep.energyTransfer(storage) == 0) {

                        creep.memory.task = undefined
                    }
                }
            }
        } else if (task == "droppedEnergy") {

            creep.isFull()

            if (creep.memory.isFull == false) {

                let droppedEnergy = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                    filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= creep.store.getCapacity()
                })

                if (droppedEnergy) {

                    creep.pickupDroppedEnergy(droppedEnergy)
                }
            } else {

                if (lowTower) {

                    if (creep.energyTransfer(lowTower) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (essentialStructure) {

                    if (creep.energyTransfer(essentialStructure) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (storage && storage.store[RESOURCE_ENERGY] <= 30000) {

                    if (creep.energyTransfer(storage) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (controllerContainer != null && controllerContainer.store[RESOURCE_ENERGY] <= 1000) {

                    if (creep.energyTransfer(controllerContainer) == 0) {

                        creep.memory.task = undefined
                    }
                } else if (storage) {

                    if (creep.energyTransfer(storage) == 0) {

                        creep.memory.task = undefined
                    }
                }
            }
        } else {

            creep.hasResource()

            if (creep.memory.isFull && storage) {

                creep.energyTransfer(storage)
            }
        }
    }
};