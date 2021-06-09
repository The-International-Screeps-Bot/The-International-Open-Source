module.exports = {
    run: function(creep) {

        var controllerLink = Game.getObjectById(creep.room.memory.controllerLink)

        var controllerContainer = Game.getObjectById(creep.room.memory.controllerContainer)

        creep.isFull()

        if (controllerContainer != null || (controllerLink != null && creep.room.memory.stage >= 6)) {

            creep.memory.isFull = "constant"

        }

        if (creep.memory.isFull == true || creep.memory.isFull == "constant") {

            creep.say("🔋")

            let target = creep.room.controller

            creep.controllerUpgrade(target)

            if (creep.store.getUsedCapacity() <= creep.myParts("work")) {

                if (controllerLink && (controllerContainer == null || controllerLink.store[RESOURCE_ENERGY] >= creep.store.getCapacity())) {
                    if (controllerLink.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                        creep.advancedWithdraw(controllerLink, RESOURCE_ENERGY, (creep.store.getCapacity() - creep.store.getUsedCapacity()))

                    }
                } else if (controllerContainer) {
                    if (controllerContainer.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                        creep.advancedWithdraw(controllerContainer, RESOURCE_ENERGY, (creep.store.getCapacity() - creep.store.getUsedCapacity()))

                    }
                }
            }
        } else {

            creep.searchSourceContainers()

            if (creep.container != null && creep.container) {

                creep.say("SC")

                let target = creep.container

                creep.advancedWithdraw(target)
            } else {

                let droppedResources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                    filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= creep.store.getCapacity() * 0.5
                });

                if (droppedResources) {

                    creep.say("💡")

                    creep.pickupDroppedEnergy(droppedResources)
                }
            }
        }
    }
};