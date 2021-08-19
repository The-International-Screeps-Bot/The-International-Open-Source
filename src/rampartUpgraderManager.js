function rampartUpgraderManager(room, creepsWithRole) {

    const anchorPoint = room.memory.anchorPoint

    if (!anchorPoint) return

    let ramparts = room.get("myRamparts")

    for (let creep of creepsWithRole) {

        creep.isFull()
        const isFull = creep.memory.isFull

        if (isFull) {

            if (creep.memory.quota) creep.say(creep.memory.quota.toFixed(0) / 1000 + "k")

            if (creep.findRampartToRepair(ramparts)) creep.repairRamparts(creep.target)

        } else {

            let terminal = room.get("terminal")

            if (terminal && terminal.store[RESOURCE_ENERGY] >= 80000) {

                creep.say("T")

                creep.advancedWithdraw(terminal)

            } else {

                let storage = room.get("storage")

                if (storage && storage.store[RESOURCE_ENERGY] >= 30000) {

                    creep.say("S")

                    creep.advancedWithdraw(storage)

                } else {

                    let container = creep.searchSourceContainers()

                    if (container) {

                        creep.say("SC")

                        creep.advancedWithdraw(container)

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

        creep.avoidHostiles()
    }
}

module.exports = rampartUpgraderManager