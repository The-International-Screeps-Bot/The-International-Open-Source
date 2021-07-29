function links(room) {

    let controllerLink = Game.getObjectById(room.memory.controllerLink)
    let baseLink = Game.getObjectById(room.memory.baseLink)
    let sourceLink1 = Game.getObjectById(room.memory.sourceLink1)
    let sourceLink2 = Game.getObjectById(room.memory.sourceLink2)

    function findFullLink() {

        let collection = [sourceLink1, sourceLink2]

        for (let link of collection) {

            if (link && link != null && link.store[RESOURCE_ENERGY] >= 790) {

                return link
            }
        }

        return false
    }

    if (findFullLink()) {

        if (controllerLink != null) {

            if (controllerLink.store[RESOURCE_ENERGY] < 400 && room.controller.ticksToDowngrade <= 15000) {

                findFullLink().transferEnergy(controllerLink)
            } else if (room.storage && room.storage.store.getUsedCapacity() >= 175000 && controllerLink.store[RESOURCE_ENERGY] < 200) {

                findFullLink().transferEnergy(controllerLink)

            } else if (Memory.global.globalStage == 0 && room.storage && room.storage.store.getUsedCapacity() >= 30000 && controllerLink.store[RESOURCE_ENERGY] < 400) {

                findFullLink().transferEnergy(controllerLink)

            } else if (baseLink != null && baseLink.store[RESOURCE_ENERGY] < 700) {

                findFullLink().transferEnergy(baseLink)
            }
        } else if (baseLink != null && baseLink.store[RESOURCE_ENERGY] < 700) {

            findFullLink().transferEnergy(baseLink)
        }
    }
}

module.exports = links