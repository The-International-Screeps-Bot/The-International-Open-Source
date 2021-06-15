module.exports = {
    run: function(creep) {

        creep.isFull()

        if (creep.memory.isFull == true) {

            if (creep.memory.quota) {

                creep.say(creep.memory.quota.toFixed(0) / 1000 + "k")
            }

            creep.barricadesFindAndRepair()

        } else {

            let storage = creep.room.storage

            if (storage) {

                creep.say("S")

                let target = storage

                if (target.store[RESOURCE_ENERGY] >= 30000) {

                    creep.advancedWithdraw(target)
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

                        target = droppedResources

                        creep.pickupDroppedEnergy(target)
                    }
                }
            }
        }
    }
};