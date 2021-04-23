module.exports = {
    run: function links() {
        _.forEach(Game.rooms, function(room) {
            if (room && room.controller && room.controller.my && room.controller.level >= 6) {

                var fullStorage = room.storage.store[RESOURCE_ENERGY] >= 250000

                var controllerLink = Game.getObjectById(room.memory.controllerLink)
                var baseLink = Game.getObjectById(room.memory.baseLink)
                var sourceLink1 = Game.getObjectById(room.memory.sourceLink1)
                var sourceLink2 = Game.getObjectById(room.memory.sourceLink2)

                if (sourceLink1 && controllerLink && sourceLink1.store[RESOURCE_ENERGY] >= 790 && controllerLink.store[RESOURCE_ENERGY] <= 400 && (fullStorage || (Memory.global.globalStage == 0 && room.storage.store[RESOURCE_ENERGY] >= 5000))) {

                    sourceLink1.transferEnergy(controllerLink);

                } else if (sourceLink1 && baseLink && sourceLink1.store[RESOURCE_ENERGY] >= 790 && baseLink.store[RESOURCE_ENERGY] <= 400) {

                    sourceLink1.transferEnergy(baseLink);

                }
                if (sourceLink2 && controllerLink && sourceLink2.store[RESOURCE_ENERGY] >= 790 && controllerLink.store[RESOURCE_ENERGY] <= 400 && (fullStorage || (Memory.global.globalStage == 0 && room.storage.store[RESOURCE_ENERGY] >= 5000))) {

                    sourceLink2.transferEnergy(controllerLink);

                } else if (sourceLink2 && baseLink && sourceLink2.store[RESOURCE_ENERGY] >= 790 && baseLink.store[RESOURCE_ENERGY] <= 400) {

                    sourceLink2.transferEnergy(baseLink);

                }
            }
        })
    }
};