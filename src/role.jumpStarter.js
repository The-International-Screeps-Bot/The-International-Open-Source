module.exports = {
    run: function(creep) {

        creep.isFull()

        if (creep.memory.isFull == true) {

            let closestSource = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)

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
        } else {

            let lowTower = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                filter: (s) => (s.structureType == STRUCTURE_TOWER) && s.energy < 500
            })

            if (lowTower) {

                creep.advancedTransfer(lowTower)

            } else {

                let essentialStructure = creep.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_EXTENSION ||
                            s.structureType == STRUCTURE_SPAWN ||
                            s.structureType == STRUCTURE_TOWER && s.energy < 710) &&
                        s.energy < s.energyCapacity
                })

                if (essentialStructure) {

                    creep.advancedTransfer(essentialStructure)

                } else {

                    let storage = creep.room.storage

                    creep.advancedTransfer(storage)
                }
            }
        }

        creep.avoidHostiles()
    }
};