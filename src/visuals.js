function visuals(room) {

    if (!Memory.global.roomVisuals) return

    let primaryLabs = room.get("primaryLabs")
    let secondaryLabs = room.get("secondaryLabs")
    let tertiaryLabs = room.get("tertiaryLabs")

    for (let lab of room.get("labs")) {

        if (primaryLabs && primaryLabs.includes(lab)) {

            room.visual.circle(lab.pos, {
                fill: 'transparent',
                radius: 0.8,
                stroke: '#39A0ED',
                strokeWidth: 0.125
            })
        } else if (secondaryLabs && secondaryLabs.includes(lab)) {

            room.visual.circle(lab.pos, {
                fill: 'transparent',
                radius: 0.8,
                stroke: '#2DF0C9',
                strokeWidth: 0.125
            })
        } else if (tertiaryLabs && tertiaryLabs.includes(lab)) {

            room.visual.circle(lab.pos, {
                fill: 'transparent',
                radius: 0.8,
                stroke: '#2D0092',
                strokeWidth: 0.125
            })
        }

        if (lab.store[RESOURCE_HYDROGEN]) {

            room.visual.text("H", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_OXYGEN]) {

            room.visual.text("O", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_UTRIUM]) {

            room.visual.text("U", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#50d7f9", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_KEANIUM]) {

            room.visual.text("K", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#a071ff", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_LEMERGIUM]) {

            room.visual.text("L", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#00f4a2", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_ZYNTHIUM]) {

            room.visual.text("Z", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#fdd388", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_CATALYST]) {

            room.visual.text("X", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
        }
        //Base
        else if (lab.store[RESOURCE_HYDROXIDE]) {

            room.visual.text("OH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_ZYNTHIUM_KEANITE]) {

            room.visual.text("ZK", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_UTRIUM_LEMERGITE]) {

            room.visual.text("UL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_GHODIUM]) {

            room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });

        }
        //Tier 1
        else if (lab.store[RESOURCE_UTRIUM_HYDRIDE]) {

            room.visual.text("OH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_UTRIUM_OXIDE]) {

            room.visual.text("ZK", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_KEANIUM_HYDRIDE]) {

            room.visual.text("UL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_KEANIUM_OXIDE]) {

            room.visual.text("UL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_LEMERGIUM_HYDRIDE]) {

            room.visual.text("LH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#00f4a2", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_LEMERGIUM_OXIDE]) {

            room.visual.text("LO", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#00f4a2", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_ZYNTHIUM_HYDRIDE]) {

            room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_ZYNTHIUM_OXIDE]) {

            room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_GHODIUM_HYDRIDE]) {

            room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_GHODIUM_OXIDE]) {

            room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });

        }
        //Tier 2
        else if (lab.store[RESOURCE_UTRIUM_ACID]) {

            room.visual.text("OH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_UTRIUM_ALKALIDE]) {

            room.visual.text("ZK", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_KEANIUM_ACID]) {

            room.visual.text("UL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_KEANIUM_ALKALIDE]) {

            room.visual.text("UL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_LEMERGIUM_ACID]) {

            room.visual.text("LH", lab.pos.x, lab.pos.y, { font: 0.3, color: "black", backgroundColor: "#00f4a2", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_LEMERGIUM_ALKALIDE]) {

            room.visual.text("LO", lab.pos.x, lab.pos.y, { font: 0.3, color: "black", backgroundColor: "#00f4a2", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_ZYNTHIUM_ACID]) {

            room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_ZYNTHIUM_ALKALIDE]) {

            room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_GHODIUM_ACID]) {

            room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_GHODIUM_ALKALIDE]) {

            room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });

        }
        //Tier 3
        else if (lab.store[RESOURCE_CATALYZED_UTRIUM_ACID]) {

            room.visual.text("XOH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_CATALYZED_UTRIUM_ALKALIDE]) {

            room.visual.text("XZK", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_CATALYZED_KEANIUM_ACID]) {

            room.visual.text("XUL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_CATALYZED_KEANIUM_ALKALIDE]) {

            room.visual.text("XUL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_CATALYZED_LEMERGIUM_ACID]) {

            room.visual.text("XLH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#00f4a2", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE]) {

            room.visual.text("XLO", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#00f4a2", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_CATALYZED_ZYNTHIUM_ACID]) {

            room.visual.text("XG", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE]) {

            room.visual.text("XG", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_CATALYZED_GHODIUM_ACID]) {

            room.visual.text("XG", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });

        } else if (lab.store[RESOURCE_CATALYZED_GHODIUM_ALKALIDE]) {

            room.visual.text("XG", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });

        }
    }
    for (let container of room.get("containers")) {

        room.visual.text(container.store.getUsedCapacity(), container.pos.x, container.pos.y, { font: 0.5, backgroundColor: "#b4b4b4", backgroundPadding: "0.1", align: 'center', opacity: "0.8" })
    }

    let sourceContainer1 = room.get("sourceContainer1")
    let sourceContainer2 = room.get("sourceContainer2")
    let controllerContainer = room.get("controllerContainer")

    if (sourceContainer1) {

        room.visual.circle(sourceContainer1.pos, {
            fill: 'transparent',
            radius: 0.8,
            stroke: '#2DF0C9',
            strokeWidth: 0.125
        })
    }
    if (sourceContainer2) {

        room.visual.circle(sourceContainer2.pos, {
            fill: 'transparent',
            radius: 0.8,
            stroke: '#2DF0C9',
            strokeWidth: 0.125
        })
    }
    if (controllerContainer) {

        room.visual.circle(controllerContainer.pos, {
            fill: 'transparent',
            radius: 0.8,
            stroke: '#39A0ED',
            strokeWidth: 0.125
        })
    }

    for (let link of room.get("links")) {

        room.visual.text(link.store[RESOURCE_ENERGY], link.pos.x, link.pos.y, { font: 0.5, backgroundColor: "#FFD180", backgroundPadding: "0.1", align: 'center', opacity: "0.8" })
    }

    let controllerLink = room.get("controllerLink")
    let baseLink = room.get("baseLink")
    let sourceLink1 = room.get("sourceLink1")
    let sourceLink2 = room.get("sourceLink2")

    if (sourceLink1) {

        room.visual.circle(sourceLink1.pos, {
            fill: 'transparent',
            radius: 0.8,
            stroke: '#2DF0C9',
            strokeWidth: 0.125
        })

        room.visual.text(1, sourceLink1.pos.x, sourceLink1.pos.y - 0.25, { align: 'center', opacity: "0.8" })
    }
    if (sourceLink2) {

        room.visual.circle(sourceLink2.pos, {
            fill: 'transparent',
            radius: 0.8,
            stroke: '#2DF0C9',
            strokeWidth: 0.125
        })

        room.visual.text(2, sourceLink2.pos.x, sourceLink2.pos.y - 0.25, { align: 'center', opacity: "0.8" })
    }
    if (controllerLink) {

        room.visual.circle(controllerLink.pos, {
            fill: 'transparent',
            radius: 0.8,
            stroke: '#39A0ED',
            strokeWidth: 0.125
        })
    }
    if (baseLink) {

        room.visual.circle(baseLink.pos, {
            fill: 'transparent',
            radius: 0.8,
            stroke: '#39A0ED',
            strokeWidth: 0.125
        })
    }

    let controller = room.get("controller")

    if (controller) {
        if (controller.my) {

            room.visual.text(controller.level, controller.pos.x, controller.pos.y + 0.25, { align: 'center', opacity: "0.8" });

            if (controller.progressTotal) {

                room.visual.text("%" + (controller.progress / controller.progressTotal * 100).toFixed(2), controller.pos.x, controller.pos.y - 1, { align: 'center', opacity: "0.8" });
            }
        } else if (controller.reservation) {

            room.visual.text(controller.reservation.ticksToEnd, controller.pos.x, controller.pos.y + 0.25, { align: 'center', opacity: "0.8" });
        }
    }

    let storage = room.get("storage")

    if (storage) {

        room.visual.text((storage.store[RESOURCE_ENERGY] / 1000).toFixed(0) + "k", storage.pos.x, storage.pos.y, { font: 0.5, backgroundColor: "#FFD180", backgroundPadding: "0.1", align: 'center', opacity: "0.8" });
    }

    let terminal = room.get("terminal")

    if (terminal) {

        room.visual.text((terminal.store[RESOURCE_ENERGY] / 1000).toFixed(0) + "k", terminal.pos.x, terminal.pos.y, { font: 0.5, backgroundColor: "#FFD180", backgroundPadding: "0.1", align: 'center', opacity: "0.8" });

    }

    let mineral = room.get("mineral")

    if (mineral) {

        room.visual.text((mineral.mineralAmount / 1000).toFixed(0) + "k" + ", " + (mineral.ticksToRegeneration / 1000).toFixed(0) + "k", mineral.pos.x, mineral.pos.y - 1, { align: 'center', opacity: "0.8" });

        if (mineral.density == 1) {

            room.visual.text("Low", mineral.pos.x, mineral.pos.y - 2, { align: 'center', opacity: "0.8" });

        } else if (mineral.density == 2) {

            room.visual.text("Moderate", mineral.pos.x, mineral.pos.y - 2, { align: 'center', opacity: "0.8" });

        } else if (mineral.density == 3) {

            room.visual.text("High", mineral.pos.x, mineral.pos.y - 2, { align: 'center', opacity: "0.8" });

        } else if (mineral.density == 4) {

            room.visual.text("Ultra", mineral.pos.x, mineral.pos.y - 2, { align: 'center', opacity: "0.8" });
        }
    }

    for (let site of room.get("mySites")) {

        room.visual.text("%" + (site.progress / site.progressTotal * 100).toFixed(0), site.pos.x, site.pos.y - 0.25, { font: 0.5, align: 'center', opacity: "0.8" });

    }
    for (let tower of room.get("towers")) {

        room.visual.text(tower.store[RESOURCE_ENERGY], tower.pos.x, tower.pos.y, { font: 0.5, backgroundColor: "#FFD180", backgroundPadding: "0.1", align: 'center', opacity: "0.8" });
    }
    for (let spawn of room.get("spawns")) {

        if (spawn.spawning) {

            room.visual.text(spawn.spawning.remainingTime, spawn.pos.x, spawn.pos.y - 1, { align: 'center', opacity: "0.8" })

            room.visual.text(Game.creeps[spawn.spawning.name].memory.role, spawn.pos.x, spawn.pos.y, { align: 'center' })
        }
    }
    for (let source of room.get("sources")) {

        room.visual.text(source.ticksToRegeneration || 0, source.pos.x, source.pos.y - 1, { color: "#FFD180", align: 'center', opacity: "0.8" })

        room.visual.text(source.energy, source.pos.x, source.pos.y - 2, { color: "#FFD180", align: 'center', opacity: "0.8" });
    }
}

module.exports = visuals