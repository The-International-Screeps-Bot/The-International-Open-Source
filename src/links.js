function links(room, specialLinks) {

    let controllerLink = specialLinks.controllerLink
    let baseLink = specialLinks.baseLink
    let sourceLink1 = specialLinks.sourceLink1
    let sourceLink2 = specialLinks.sourceLink2

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

            } else if (Memory.global.globalStage = 0 && room.storage && room.storage.store.getUsedCapacity() >= 30000 && controllerLink.store[RESOURCE_ENERGY] < 400) {

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