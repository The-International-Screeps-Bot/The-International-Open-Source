module.exports = {
    run: function links() {
        _.forEach(Game.rooms, function(room) {
            if (room && room.controller && room.controller.my && room.controller.level >= 6) {

                let controllerLink = Game.getObjectById(room.memory.controllerLink)
                let baseLink = Game.getObjectById(room.memory.baseLink)
                let sourceLink1 = Game.getObjectById(room.memory.sourceLink1)
                let sourceLink2 = Game.getObjectById(room.memory.sourceLink2)

                /*
                    if (sourceLink1 != null) {

                        if (controllerLink != null) {

                            if (room.controller.ticksToDowngrade <= 15000)
                        }
                    }
                */


                if (sourceLink1 != null && controllerLink != null && sourceLink1.store[RESOURCE_ENERGY] >= 790) {

                    if (Memory.global.globalStage > 0 && room.storage && room.storage.store[RESOURCE_ENERGY] >= 200000 && controllerLink.store[RESOURCE_ENERGY] <= 200) {

                        sourceLink1.transferEnergy(controllerLink)

                    } else if (Memory.global.globalStage == 0 && room.storage && room.storage.store[RESOURCE_ENERGY] >= 30000 && controllerLink.store[RESOURCE_ENERGY] <= 400) {

                        sourceLink1.transferEnergy(controllerLink)

                    } else if (sourceLink1 != null && baseLink != null && baseLink.store[RESOURCE_ENERGY] <= 700) {

                        sourceLink1.transferEnergy(baseLink)
                    }
                }
                if (sourceLink2 != null && controllerLink != null && sourceLink2.store[RESOURCE_ENERGY] >= 790) {

                    if (Memory.global.globalStage > 0 && room.storage && room.storage.store[RESOURCE_ENERGY] >= 200000 && controllerLink.store[RESOURCE_ENERGY] <= 200) {

                        sourceLink2.transferEnergy(controllerLink)

                    } else if (Memory.global.globalStage == 0 && room.storage && room.storage.store[RESOURCE_ENERGY] >= 30000 && controllerLink.store[RESOURCE_ENERGY] <= 400) {

                        sourceLink2.transferEnergy(controllerLink)

                    } else if (sourceLink2 != null && baseLink != null && baseLink.store[RESOURCE_ENERGY] <= 700) {

                        sourceLink2.transferEnergy(baseLink)
                    }
                }
            }
        })
    }
};