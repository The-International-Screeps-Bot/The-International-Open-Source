module.exports = function run(creep) {

    var storage = Game.spawns['Spawn1']
    var storageEnergy = storage.store[RESOURCE_ENERGY]
        // Check capacity
    console.log(storage.store[RESOURCE_ENERGY])
    if (storageEnergy < (storage.store.getCapacity(RESOURCE_ENERGY))) {
        console.log("Storage not full!")
    }

    // If energy creep is holding is lower than maximum storage then proceed
    if (creep.store[RESOURCE_ENERGY] < creep.store.getCapacity()) {
        // Find closest energy source
        const target = creep.pos.findClosestByRange(FIND_SOURCES_ACTIVE)
            // if true
        if (target) {
            // If not in range move to energy source
            if (creep.harvest(target) == ERR_NOT_IN_RANGE) {
                creep.moveTo(target)
            }
        }
    } else {
        if (creep.transfer(storage, RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
            creep.moveTo(storage)
        }
    }
}