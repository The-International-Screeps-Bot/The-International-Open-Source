let allyList = require("allyList")

var roleBuilder = require('role.builder')
var roleUpgrader = require('role.upgrader')

module.exports = {
    run: function(creep) {

        const newCommune = Memory.global.newCommune

        if (!newCommune) roleBuilder.run(creep)

        if (creep.isEdge()) {

            const direction = creep.pos.getDirectionTo(25, 25)
            creep.move(direction);

        } else if (creep.room.name != newCommune) {

            creep.say("NC " + newCommune)

            creep.advancedPathing({
                origin: creep.pos,
                goal: { pos: new RoomPosition(25, 25, newCommune), range: 1 },
                plainCost: 3,
                swampCost: 8,
                defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                avoidStages: ["enemyRoom", "keeperRoom", "allyRoom"],
                flee: false,
                cacheAmount: 10,
            })
        } else {

            let hostileStructure = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES, {
                filter: (c) => {
                    return (!allyList.includes(c.owner.username.toLowerCase()) && c.structureType == STRUCTURE_INVADER_CORE)
                }
            })

            if ((hostileStructure || creep.room.controller.reservation || (creep.room.controller.owner && !creep.room.controller.my)) && Memory.global.newCommunes.includes(creep.room.name)) {

                Memory.global.newCommunes = Memory.global.newCommunes.slice(1, Memory.global.newCommunes.length)
            }

            creep.isFull()

            if (creep.memory.isFull) {

                const controller = creep.room.controller

                if (controller.ticksToDowngrade <= 5000) {

                    roleUpgrader.run(creep)

                } else {

                    let constructionSites = creep.room.find(FIND_MY_CONSTRUCTION_SITES)

                    if (constructionSites.length > 0) {

                        let constructionSite = creep.pos.findClosestByRange(constructionSites)

                        creep.say("🚧")

                        creep.constructionBuild(constructionSite)

                    } else {

                        roleUpgrader.run(creep)
                    }
                }
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

                                let closestSource = creep.pos.findClosestByPath(FIND_SOURCES_ACTIVE)

                                if (closestSource) {

                                    if (creep.pos.getRangeTo(closestSource) <= 1) {

                                        creep.advancedHarvest(closestSource)
                                    } else {

                                        creep.advancedPathing({
                                            origin: creep.pos,
                                            goal: { pos: closestSource.pos, range: 1 },
                                            plainCost: 3,
                                            swampCost: 8,
                                            defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                                            avoidStages: [],
                                            flee: false,
                                            cacheAmount: 10,
                                        })
                                    }
                                } else {

                                    creep.say("🚬")

                                    const anchorPoint = creep.room.memory.anchorPoint

                                    if (anchorPoint) {

                                        if (creep.pos.getRangeTo(anchorPoint.x, anchorPoint.y) != 6) {

                                            creep.say("AIR" + creep.pos.getRangeTo(anchorPoint.x, anchorPoint.y))

                                            if (creep.pos.getRangeTo(anchorPoint.x, anchorPoint.y) > 6) {

                                                creep.advancedPathing({
                                                    origin: creep.pos,
                                                    goal: { pos: anchorPoint, range: 6 },
                                                    plainCost: false,
                                                    swampCost: false,
                                                    defaultCostMatrix: false,
                                                    avoidStages: [],
                                                    flee: false,
                                                    cacheAmount: 10,
                                                })
                                            } else {

                                                creep.advancedPathing({
                                                    origin: creep.pos,
                                                    goal: { pos: anchorPoint, range: 6 },
                                                    plainCost: false,
                                                    swampCost: false,
                                                    defaultCostMatrix: false,
                                                    avoidStages: [],
                                                    flee: true,
                                                    cacheAmount: 10,
                                                })
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }

            creep.avoidHostiles()
        }
    }
}