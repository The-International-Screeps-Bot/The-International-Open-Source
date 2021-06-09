var roleBuilder = require('role.builder');

module.exports = {
    run: function(creep) {

        creep.memory.target = Memory.global.newCommune

        let creepIsEdge = (creep.pos.x <= 0 || creep.pos.x >= 49 || creep.pos.y <= 0 || creep.pos.y >= 49)

        if (creepIsEdge) {

            const direction = creep.pos.getDirectionTo(25, 25)
            creep.move(direction);

        } else if (creep.room.name != creep.memory.target) {

            let goal = _.map([new RoomPosition(25, 25, creep.memory.target)], function(pos) {
                return { pos: pos, range: 1 }
            })

            creep.say("BC " + creep.memory.target)

            creep.onlySafeRoomPathing(creep.pos, goal)
        } else {

            creep.isFull()

            let constructionSite = creep.pos.findClosestByRange(FIND_CONSTRUCTION_SITES)

            if (creep.memory.isFull == true) {

                creep.say("🚧")

                creep.constructionBuild(constructionSite)
            } else {

                let terminal = creep.room.terminal

                if (terminal && terminal.store[RESOURCE_ENERGY] >= 50000) {

                    creep.say("T >= 50k")

                    creep.advancedWithdraw(terminal)
                } else {

                    let storage = creep.room.storage

                    if (storage) {

                        creep.say("S 10k")

                        if (storage.store[RESOURCE_ENERGY] >= 10000) {

                            creep.advancedWithdraw(storage)
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
                            } else {

                                let closestSource = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)

                                if (closestSource) {

                                    if (creep.pos.inRangeTo(closestSource, 1)) {

                                        if (creep.harvest(closestSource) == 0) {

                                            creep.findEnergyHarvested(closestSource)
                                        }
                                    } else {

                                        let goal = _.map([closestSource], function(target) {
                                            return { pos: target.pos, range: 1 }
                                        })

                                        creep.intraRoomPathing(creep.pos, goal)
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};