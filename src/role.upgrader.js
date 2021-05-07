module.exports = {
    run: function(creep) {

        var controllerLink = Game.getObjectById(creep.room.memory.controllerLink)

        var controllerContainer = Game.getObjectById(creep.room.memory.controllerContainer)

        if (controllerContainer || controllerLink) {

            creep.memory.isFull = "constant"

        } else {

            creep.isFull()
        }
        if (creep.memory.isFull == true || creep.memory.isFull == "constant") {

            creep.say("🔋")

            let target = creep.room.controller

            creep.controllerUpgrade(target)

            if (creep.store.getUsedCapacity() <= creep.myParts("work")) {

                creep.say("W")

                if (controllerLink && (creep.room.memory.stage >= 7 || (creep.room.terminal && creep.room.terminal.store[RESOURCE_ENERGY] >= 80000))) {
                    if (controllerLink.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                        creep.say("🔋 CL")

                        let target = controllerLink

                        creep.energyWithdraw(target)
                    } else if (!creep.pos.isNearTo(controllerLink)) {

                        let origin = creep.pos

                        let goal = _.map([controllerLink], function(target) {
                            return { pos: target.pos, range: 1 }
                        })

                        creep.intraRoomPathing(origin, goal)

                    }
                } else if (controllerContainer) {
                    if (controllerContainer.store[RESOURCE_ENERGY] >= creep.store.getCapacity()) {

                        creep.say("🔋 CC")

                        let target = controllerContainer

                        creep.energyWithdraw(target)
                    } else if (!creep.pos.isNearTo(controllerContainer)) {

                        let origin = creep.pos

                        let goal = _.map([controllerContainer], function(target) {
                            return { pos: target.pos, range: 1 }
                        })

                        creep.intraRoomPathing(origin, goal)
                    }
                }
            }
        } else {

            creep.searchSourceContainers()

            if (creep.container != null && creep.container) {

                creep.say("SC")

                let target = creep.container

                creep.energyWithdraw(target)
            } else {

                let droppedResources = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
                    filter: (s) => s.resourceType == RESOURCE_ENERGY && s.energy >= creep.store.getCapacity() * 0.5
                });

                if (droppedResources) {

                    creep.say("💡")

                    target = droppedResources

                    creep.pickupDroppedEnergy(target)
                }
            }
        }
    }
};