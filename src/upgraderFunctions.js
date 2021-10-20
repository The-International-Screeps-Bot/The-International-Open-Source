Creep.prototype.upgradeWithControllerContianer = function(controller, controllerContainer) {

    let creep = this

    // Stop if there is no controllerContainer

    if (!controllerContainer) return

    creep.advancedUpgrade(controller)

    // If controller container is empty move away so it can be refilled

    if (controllerContainer.store.getUsedCapacity(RESOURCE_ENERGY) < creep.store.getCapacity()) {

        creep.say("F")

        let distance = creep.pos.getRangeTo(controllerContainer)

        // Stop if creep is at range of 2

        if (distance == 2) return true

        // Move towards if range is more than 2

        if (distance > 2) {

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

            return true
        }

        // Move away if range is less than 2

        if (distance < 2) {

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

            return true
        }
    }

    // If almost empty get more energy

    if (creep.store.getUsedCapacity() <= creep.findParts("work") || creep.pos.getRangeTo(controller) > 3) {

        creep.advancedWithdraw(controllerContainer, RESOURCE_ENERGY, (creep.store.getCapacity() - creep.store.getUsedCapacity()))
    }

    return true
}

Creep.prototype.upgradeWithControllerLink = function(controller, controllerLink) {

    let creep = this

    if (!controllerLink || !baseLink) return

    creep.say("CL")

    creep.advancedUpgrade(controller)

    // If creep needs energy to upgrade move to controllerLink

    if (creep.store.getUsedCapacity() <= creep.findParts("work")) {

        creep.advancedWithdraw(controllerLink, RESOURCE_ENERGY, (creep.store.getCapacity() - creep.store.getUsedCapacity()))
    }

    return true
}