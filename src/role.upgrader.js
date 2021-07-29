module.exports = {
    run: function(creep) {

        var controllerLink = Game.getObjectById(creep.room.memory.controllerLink)

        var controllerContainer = Game.getObjectById(creep.room.memory.controllerContainer)

        creep.isFull()

        if (controllerContainer != null || (controllerLink != null && creep.room.memory.stage >= 6)) {

            creep.memory.isFull = "constant"
        }
        if (creep.memory.isFull || creep.memory.isFull == "constant") {

            creep.say("🔋")

            creep.controllerUpgrade(creep.room.controller)

            if (controllerLink != null && controllerLink.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {
                if (creep.store.getUsedCapacity() <= creep.myParts("work")) {

                    creep.advancedWithdraw(controllerLink, RESOURCE_ENERGY, (creep.store.getCapacity() - creep.store.getUsedCapacity()))
                }
            } else if (controllerContainer != null && controllerContainer.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {
                if (creep.store.getUsedCapacity() <= creep.myParts("work")) {

                    creep.advancedWithdraw(controllerContainer, RESOURCE_ENERGY, (creep.store.getCapacity() - creep.store.getUsedCapacity()))
                }
            } else {

                creep.say("NE")

                let goal = { pos: creep.room.controller.pos, range: 2 }

                creep.creepFlee(creep.pos, goal)
            }

            /* if (controllerLink != null && (controllerContainer == null || controllerLink.store[RESOURCE_ENERGY] >= creep.store.getCapacity())) {
                if (controllerLink.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                    creep.advancedWithdraw(controllerLink, RESOURCE_ENERGY, (creep.store.getCapacity() - creep.store.getUsedCapacity()))

                }
            } else if (controllerContainer && controllerContainer.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                creep.advancedWithdraw(controllerContainer, RESOURCE_ENERGY, (creep.store.getCapacity() - creep.store.getUsedCapacity()))

            } else {

                creep.say("NE")

                let goal = _.map([target], function(target) {
                    return { pos: target.pos, range: 2 }
                })

                creep.creepFlee(creep.pos, goal)
            } */
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

        creep.avoidHostiles()
    }
};