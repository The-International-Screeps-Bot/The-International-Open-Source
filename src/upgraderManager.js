function upgradeManager(room, creepsWithRole) {

    if (creepsWithRole.length == 0) return

    require("upgraderFunctions")

    const controller = room.get("controller")

    const controllerContainer = room.get("controllerContainer")

    const controllerLink = room.get("controllerLink")
    const baseLink = room.get("baseLink")

    for (let creep of creepsWithRole) {

        if (creep.avoidEnemys()) continue

        // try to stationary upgrade with controllerContainer

        if (creep.upgradeWithControllerContianer(controller, controllerContainer)) continue

        // try to stationary upgrade with controllerLink

        if (creep.upgradeWithControllerLink(controller, controllerLink)) continue

        // Check if creep can upgrade controller

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