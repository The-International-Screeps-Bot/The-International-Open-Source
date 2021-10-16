let roomVariables = require("roomVariables")

module.exports = {
    run: function(creep) {

        let { specialStructures } = roomVariables(creep.room)

        var controllerLink = specialStructures.links.controllerLink

        var controllerContainer = specialStructures.containers.controllerContainer

        creep.isFull()

        if (controllerContainer || (controllerLink && creep.room.memory.stage >= 6)) {

            creep.memory.upgrading = "constant"
        }
        if (creep.memory.isFull || creep.memory.upgrading == "constant") {

            creep.say("🔋")

            creep.advancedUpgrade(creep.room.controller)

            if (controllerLink || controllerContainer) {

                if (controllerLink && controllerLink.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {
                    if (creep.store.getUsedCapacity() <= creep.findParts("work")) {

                        creep.advancedWithdraw(controllerLink, RESOURCE_ENERGY, (creep.store.getCapacity() - creep.store.getUsedCapacity()))
                    }
                } else if (controllerContainer && controllerContainer.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {
                    if (creep.store.getUsedCapacity() <= creep.findParts("work")) {

                        creep.advancedWithdraw(controllerContainer, RESOURCE_ENERGY, (creep.store.getCapacity() - creep.store.getUsedCapacity()))
                    }
                } else {

                    creep.say("NE")

                    let fleeTarget = controllerContainer.pos || controllerLink.pos

                    if (creep.pos.getRangeTo(fleeTarget) < 2) {

                        creep.travel({
                            origin: creep.pos,
                            goal: { pos: fleeTarget, range: 2 },
                            plainCost: 1,
                            swampCost: 5,
                            defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                            avoidStages: [],
                            flee: true,
                            cacheAmount: 10,
                        })
                    }
                }
            }
        } else {

            let container = creep.searchSourceContainers()

            if (container && container) {

                creep.say("SC")

                let target = container

                creep.advancedWithdraw(target)
            } else {

                let droppedEnergy = creep.findDroppedEnergyOfAmount(creep.store.getFreeCapacity())

                if (droppedEnergy) {

                    creep.say("💡")

                    creep.pickupDroppedEnergy(droppedEnergy)
                }
            }
        }

        creep.avoidEnemys()
    }
};