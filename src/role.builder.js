var roleUpgrader = require('role.upgrader');

module.exports = {
    run: function(creep) {

        let constructionSite = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES);

        if (!constructionSite) {

            roleUpgrader.run(creep);

        } else {

            creep.isFull()

            if (creep.memory.isFull == true) {

                creep.say("🚧")

                target = constructionSite

                creep.constructionBuild(target)
            } else {

                let terminal = creep.room.terminal

                if (terminal && terminal.store[RESOURCE_ENERGY] >= 50000) {

                    creep.say("T >= 50k")

                    let target = terminal

                    creep.advancedWithdraw(target)
                } else {

                    let storage = creep.room.storage

                    if (storage) {

                        creep.say("S 10k")

                        let target = storage

                        if (target.store[RESOURCE_ENERGY] >= 10000) {

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
        }
    }
};