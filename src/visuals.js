module.exports = function visuals(room) {

    if (!Memory.global.roomVisuals) return

    let sourceContainer1 = room.get("sourceContainer1")
    let sourceContainer2 = room.get("sourceContainer2")
    let controllerContainer = room.get("controllerContainer")
    let baseContainer = room.get("baseContainer")

    if (sourceContainer1) {

        room.visual.circle(sourceContainer1.pos, {
            fill: 'transparent',
            radius: 0.8,
            stroke: '#2DF0C9',
            strokeWidth: 0.125
        })

        room.visual.text(sourceContainer1.store.getUsedCapacity(), sourceContainer1.pos.x, sourceContainer1.pos.y, { font: 0.5, backgroundColor: colors.neutralYellow, backgroundPadding: "0.1", align: 'center', opacity: "0.8" })
    }
    if (sourceContainer2) {

        room.visual.circle(sourceContainer2.pos, {
            fill: 'transparent',
            radius: 0.8,
            stroke: '#2DF0C9',
            strokeWidth: 0.125
        })

        room.visual.text(sourceContainer2.store.getUsedCapacity(), sourceContainer2.pos.x, sourceContainer2.pos.y, { font: 0.5, backgroundColor: colors.neutralYellow, backgroundPadding: "0.1", align: 'center', opacity: "0.8" })
    }
    if (controllerContainer) {

        room.visual.circle(controllerContainer.pos, {
            fill: 'transparent',
            radius: 0.8,
            stroke: '#39A0ED',
            strokeWidth: 0.125
        })

        room.visual.text(controllerContainer.store.getUsedCapacity(), controllerContainer.pos.x, controllerContainer.pos.y, { font: 0.5, backgroundColor: colors.neutralYellow, backgroundPadding: "0.1", align: 'center', opacity: "0.8" })
    }
    if (baseContainer) {

        room.visual.circle(controllerContainer.pos, {
            fill: 'transparent',
            radius: 0.8,
            stroke: '#39A0ED',
            strokeWidth: 0.125
        })

        room.visual.text(baseContainer.store.getUsedCapacity(), baseContainer.pos.x, baseContainer.pos.y, { font: 0.5, backgroundColor: colors.neutralYellow, backgroundPadding: "0.1", align: 'center', opacity: "0.8" })
    }

    let controller = room.get("controller")

    if (controller) {
        if (controller.my) {

            room.visual.text(controller.level, controller.pos.x, controller.pos.y + 0.25, { align: 'center', color: colors.communeGreen, opacity: "0.8" })

            if (controller.progressTotal) {

                room.visual.text("%" + (controller.progress / controller.progressTotal * 100).toFixed(2), controller.pos.x, controller.pos.y - 1, { align: 'center', color: colors.communeGreen, opacity: "0.8" })
            }
        } else if (controller.reservation) {

            let reservationColor = findReservationColor()

            function findReservationColor() {

                if (controller.reservation.username == me) {

                    let color = colors.communeGreen
                    return color
                }

                if (controller.reservation.username == "Invader") {

                    let color = colors.invaderOrange
                    return color
                }

                if (controller.reservation.username != me) {

                    let color = colors.enemyRed
                    return color
                }
            }

            room.visual.text(controller.reservation.ticksToEnd, controller.pos.x, controller.pos.y + 0.25, { align: 'center', color: reservationColor, opacity: "0.8" })
        }
    }

    let mySites = room.find(FIND_MY_CONSTRUCTION_SITES)

    for (let site of mySites) {

        room.visual.text("%" + (site.progress / site.progressTotal * 100).toFixed(0), site.pos.x, site.pos.y - 0.25, { font: 0.5, align: 'center', opacity: "0.8" })
    }

    for (let source of room.get("sources")) {

        room.visual.text(source.ticksToRegeneration || 0, source.pos.x, source.pos.y - 1, { color: colors.neutralYellow, align: 'center', opacity: "0.8" })

        room.visual.text(source.energy, source.pos.x, source.pos.y - 2, { color: colors.neutralYellow, align: 'center', opacity: "0.8" })
    }

    if (controller && !controller.my) return

    let storage = room.get("storage")

    if (storage) {

        room.visual.text((storage.store[RESOURCE_ENERGY] / 1000).toFixed(0) + "k", storage.pos.x, storage.pos.y, { font: 0.5, backgroundColor: colors.neutralYellow, backgroundPadding: "0.1", align: 'center', opacity: "0.8" })
    }

    let terminal = room.get("terminal")

    if (terminal) {

        room.visual.text((terminal.store[RESOURCE_ENERGY] / 1000).toFixed(0) + "k", terminal.pos.x, terminal.pos.y, { font: 0.5, backgroundColor: colors.neutralYellow, backgroundPadding: "0.1", align: 'center', opacity: "0.8" })

    }

    for (let tower of room.get("towers")) {

        room.visual.text(tower.store[RESOURCE_ENERGY], tower.pos.x, tower.pos.y, { font: 0.5, backgroundColor: colors.neutralYellow, backgroundPadding: "0.1", align: 'center', opacity: "0.8" })
    }

    for (let spawn of room.get("spawns")) {

        if (spawn.spawning) {

            room.visual.text(spawn.spawning.remainingTime, spawn.pos.x, spawn.pos.y - 1, { align: 'center', color: colors.communeGreen, opacity: "0.8" })

            room.visual.text(Game.creeps[spawn.spawning.name].memory.role, spawn.pos.x, spawn.pos.y, { align: 'center', color: colors.communeGreen })
        }
    }

    for (let link of room.get("links")) {

        room.visual.text(link.store[RESOURCE_ENERGY], link.pos.x, link.pos.y, { font: 0.5, backgroundColor: colors.neutralYellow, backgroundPadding: "0.1", align: 'center', opacity: "0.8" })
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

    let primaryLabs = room.get("primaryLabs")
    let secondaryLabs = room.get("secondaryLabs")
    let tertiaryLabs = room.get("tertiaryLabs")

    for (let lab of room.get("labs")) {

        if (primaryLabs.includes(lab)) {

            room.visual.circle(lab.pos, {
                fill: 'transparent',
                radius: 0.8,
                stroke: '#39A0ED',
                strokeWidth: 0.125
            })
        } else if (secondaryLabs.includes(lab)) {

            room.visual.circle(lab.pos, {
                fill: 'transparent',
                radius: 0.8,
                stroke: '#2DF0C9',
                strokeWidth: 0.125
            })
        } else if (tertiaryLabs.includes(lab)) {

            room.visual.circle(lab.pos, {
                fill: 'transparent',
                radius: 0.8,
                stroke: '#2D0092',
                strokeWidth: 0.125
            })
        }

        let chemicalColors = {
            // Minerals
            H: "#b4b4b4",
            O: "#b4b4b4",
            U: "#50d7f9",
            K: "#a071ff",
            L: "#00f4a2",
            Z: "#fdd388",
            C: "##c70000",
            // Bases
            OH: "#b4b4b4",
            ZK: "#b4b4b4",
            UL: "#b4b4b4",
            G: "#fff",
            // T1 Boosts
            GH: "#fff",
            GO: "#fff",
            UH: "#50d7f9",
            UO: "#50d7f9",
            KH: "#a071ff",
            KO: "#a071ff",
            LH: "#00f4a2",
            LO: "#00f4a2",
            ZH: "#fdd388",
            ZO: "#fdd388",
            // T2 Boosts
            GH2O: "#fff",
            GHO2: "#fff",
            UH2O: "#50d7f9",
            UHO2: "#50d7f9",
            KH2O: "#a071ff",
            KHO2: "#a071ff",
            LHO2: "#00f4a2",
            LHO2: "#00f4a2",
            ZH2O: "#fdd388",
            ZHO2: "#fdd388",
            // T3 Boosts
            XGH2O: "#fff",
            XGHO2: "#fff",
            XUH2O: "#50d7f9",
            XUHO2: "#50d7f9",
            XKH2O: "#a071ff",
            XKHO2: "#a071ff",
            XLHO2: "#00f4a2",
            XLHO2: "#00f4a2",
            XZH2O: "#fdd388",
            XZHO2: "#fdd388",
        }

        // Stop if lab doesn't have a resource to show

        function findChemical() {

            for (let resourceType in chemicalColors) {

                if (!lab.store.getUsedCapacity(resourceType)) continue

                return resourceType
            }
        }

        let chemical = findChemical()
        if (!chemical) continue

        room.visual.text(chemical, lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: chemicalColors[chemical], backgroundPadding: "0.1" })
    }

    let mineral = room.get("mineral")

    if (mineral) {

        room.visual.text((mineral.mineralAmount / 1000).toFixed(0) + "k" + ", " + (mineral.ticksToRegeneration / 1000).toFixed(0) + "k", mineral.pos.x, mineral.pos.y - 1, { align: 'center', color: colors.neutralYellow, opacity: "0.8" })

        let densityDisplay

        if (mineral.density == 1) {

            densityDisplay = "Low"

        } else if (mineral.density == 2) {

            densityDisplay = "Moderate"

        } else if (mineral.density == 3) {

            densityDisplay = "High"

        } else if (mineral.density == 4) {

            densityDisplay = "Ultra"
        }

        room.visual.text(densityDisplay, mineral.pos.x, mineral.pos.y - 2, { align: 'center', color: colors.neutralYellow, opacity: "0.8" })
    }
}