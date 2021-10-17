module.exports = function links(room) {

    let controllerLink = room.get("controllerLink")
    let baseLink = room.get("baseLink")
    let sourceLink1 = room.get("sourceLink1")
    let sourceLink2 = room.get("sourceLink2")

    let fullSourceLink = findFullSourceLink()

    function findFullSourceLink() {

        let sourceLinks = [sourceLink1, sourceLink2]

        for (let link of sourceLinks) {

            // if the link doesn't exist continue

            if (!link) continue

            // if the link has less than link's capacity - 10 continue

            if (link.store.getUsedCapacity(RESOURCE_ENERGY) < link.store.getCapacity() - 10) continue

            return link
        }
    }

    if (fullSourceLink) {

        if (controllerLink) {

            if (controllerLink.store[RESOURCE_ENERGY] < 400 && room.controller.ticksToDowngrade <= 15000) {

                fullSourceLink.transferEnergy(controllerLink)

            } else if (room.storage && room.storage.store.getUsedCapacity() >= 175000 && controllerLink.store[RESOURCE_ENERGY] < 200) {

                fullSourceLink.transferEnergy(controllerLink)

            } else if (Memory.global.globalStage = 0 && room.storage && room.storage.store.getUsedCapacity() >= 30000 && controllerLink.store[RESOURCE_ENERGY] < 400) {

                fullSourceLink.transferEnergy(controllerLink)

            } else if (baseLink && baseLink.store[RESOURCE_ENERGY] < 700) {

                fullSourceLink.transferEnergy(baseLink)
            }
        } else if (baseLink && baseLink.store[RESOURCE_ENERGY] < 700) {

            fullSourceLink.transferEnergy(baseLink)
        }
    }
}