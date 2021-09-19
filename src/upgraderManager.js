function upgradeManager(room, creepsWithRole) {

    if (creepsWithRole.length == 0) return

    require("upgraderFunctions")

    const controller = room.get("controller")

    const controllerLink = room.get("controllerLink")
    const baseLink = room.get("baseLink")
    const controllerContainer = room.get("controllerContainer")

    for (let creep of creepsWithRole) {

        if (creep.avoidHostiles()) continue

        // Check creep can use stationary upgrading methods

        if (controllerContainer) {

            creep.advancedUpgrade(controller)

            // If controller container is empty move away so it can be refilled

            if (controllerContainer.store.getUsedCapacity(RESOURCE_ENERGY) < creep.store.getCapacity()) {

                creep.say("F")

                // Make sure the creep is in range of 2 from controllerContainer

                let rangeFromControllerContainer = creep.pos.getRangeTo(controllerContainer)

                if (rangeFromControllerContainer > 2) {

                    creep.travel({
                        origin: creep.pos,
                        goal: { pos: controllerContainer.pos, range: 2 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: false,
                        cacheAmount: false,
                    })

                    continue
                }

                if (rangeFromControllerContainer < 2) {

                    creep.travel({
                        origin: creep.pos,
                        goal: { pos: controllerContainer.pos, range: 2 },
                        plainCost: false,
                        swampCost: false,
                        defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                        avoidStages: [],
                        flee: true,
                        cacheAmount: false,
                    })

                    continue
                }

                continue
            }

            // If almost empty get more energy

            if (creep.store.getUsedCapacity() <= creep.findParts("work") || creep.pos.getRangeTo(controller) > 3) {

                creep.advancedWithdraw(controllerContainer, RESOURCE_ENERGY, (creep.store.getCapacity() - creep.store.getUsedCapacity()))
            }

            continue
        }

        if (controllerLink && baseLink) {

            creep.say("CL")

            creep.advancedUpgrade(controller)

            // If creep needs energy to upgrade move to controllerLink

            if (creep.store.getUsedCapacity() <= creep.findParts("work")) {

                creep.advancedWithdraw(controllerLink, RESOURCE_ENERGY, (creep.store.getCapacity() - creep.store.getUsedCapacity()))
            }

            continue
        }

        creep.isFull()

        if (creep.memory.isFull) {

            creep.advancedUpgrade(controller)

            if (creep.pos.getRangeTo(controller) > 3) {

                creep.travel({
                    origin: creep.pos,
                    goal: { pos: controller.pos, range: 1 },
                    plainCost: false,
                    swampCost: false,
                    defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                    avoidStages: [],
                    flee: false,
                    cacheAmount: false,
                })
            }

            continue
        }

        // If creep does not have energy

        let container = creep.searchSourceContainers()

        if (container) {

            creep.say("SC")

            creep.advancedWithdraw(container)

        } else {

            let droppedEnergy = creep.findDroppedEnergyOfAmount(creep.store.getFreeCapacity())

            if (droppedEnergy) {

                creep.say("💡")

                creep.pickupDroppedEnergy(droppedEnergy)
            }
        }
    }
}

module.exports = upgradeManager