var roleUpgrader = require('role.upgrader');

module.exports = {
    run: function(creep) {

        const targetSite = findObjectWithId(creep.room.memory.targetSite)

        if (!targetSite) return

        if (!targetSite) {

            roleUpgrader.run(creep);

        } else {

            creep.isFull()

            if (creep.memory.isFull == true) {

                creep.say("🚧")

                creep.constructionBuild(targetSite)
            } else {

                let terminal = creep.room.terminal

                if (terminal && terminal.store[RESOURCE_ENERGY] >= 30000) {

                    creep.say("T")

                    creep.advancedWithdraw(terminal)
                } else {

                    let storage = creep.room.storage

                    if (storage) {

                        creep.say("S")

                        let target = storage

                        if (target.store[RESOURCE_ENERGY] >= 35000) {

                            creep.advancedWithdraw(target)
                        }
                    } else {

                        creep.searchSourceContainers()

                        if (creep.container != null && creep.container) {

                            creep.say("SC")

                            creep.advancedWithdraw(creep.container)
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
            }
        }

        creep.avoidHostiles()
    }
};