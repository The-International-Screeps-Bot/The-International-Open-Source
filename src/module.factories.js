module.exports = {
    run: function factories() {
        _.forEach(Game.rooms, function(room) {
            if (room.controller && room.controller.my && room.controller.level >= 1) {

                let factory = room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_FACTORY
                })

                if (factory) {
                    if (factory.store.getUsedCapacity() != factory.store.getCapacity() && factory.cooldown == 0) {
                        if (factory.store[RESOURCE_BATTERY] > 0) {

                            factory.produce(RESOURCE_ENERGY)
                        }
                    }
                }
            }
        })
    }
}