var roleBuilder = require('role.builder')
var roleUpgrader = require('role.upgrader')

module.exports = {
    run: function(creep) {

        const newCommune = Memory.global.newCommune

        const room = creep.room

        if (!newCommune) {

            roleBuilder.run(creep)
            return
        }

        if (creep.isEdge()) {

            const direction = creep.pos.getDirectionTo(25, 25)
            creep.move(direction);

        } else if (creep.room.name != newCommune) {

            creep.say("NC " + newCommune)

            creep.travel({
                origin: creep.pos,
                goal: { pos: new RoomPosition(25, 25, newCommune), range: 1 },
                plainCost: 1,
                swampCost: 3,
                defaultCostMatrix: creep.room.memory.defaultCostMatrix,
                avoidStages: ["enemyRoom", "keeperRoom", "allyRoom"],
                flee: false,
                cacheAmount: 10,
            })
        } else {

            let controller = creep.room.get("controller")

            let enemyAttackers = room.find(FIND_HOSTILE_CREEPS, {
                filter: enemyCreep => !allyList.includes(enemyCreep.owner.username) && enemyCreep.hasPartsOfTypes([ATTACK, RANGED_ATTACK]) && enemyCreep.owner.username != "Invader"
            })

            if ((controller.owner && !controller.my) || controller.reservation || creep.room.memory.stage >= 3 || creep.room.get("hostileCreeps").length > 0) {

                console.log("AQ")

                creep.room.memory.avoidClaiming = Game.time + 20000
                creep.room.memory.claimable = false
                Memory.global.newCommune = false
                Memory.global.communeEstablisher = false
                Memory.global.claimableRooms = removePropertyFromArray(Memory.global.claimableRooms, creep.room.name)
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

                        creep.buildSite(constructionSite)

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

                    if (storage && storage.store[RESOURCE_ENERGY] >= 10000) {

                        creep.say("S 10k")

                        creep.advancedWithdraw(storage)

                    } else {

                        let container = creep.searchSourceContainers()

                        if (container != null && container) {

                            creep.say("SC")

                            creep.advancedWithdraw(container)
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

                                        creep.travel({
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

                                                creep.travel({
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

                                                creep.travel({
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