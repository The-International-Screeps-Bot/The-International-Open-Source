const creepOpts = require("./creepOpts")

function importantStructures(room) {

    let allCreeps = room.find(FIND_CREEPS)

    let myCreeps = room.find(FIND_MY_CREEPS)

    let creeps = {
        allCreeps: allCreeps,

        myCreeps: myCreeps,
        /* allyCreeps: allyCreeps,
        hostileCreeps: hostileCreeps,
        invaderCreeps: invaderCreeps, */
    }

    let allPowerCreeps = room.find(FIND_POWER_CREEPS)

    let powerCreeps = {
        allCreeps: allPowerCreeps,

        myCreeps: "",
        allyCreeps: "",
        hostileCreeps: "",
    }

    let allSites = room.find(FIND_CONSTRUCTION_SITES)

    let mySites = room.find(FIND_MY_CONSTRUCTION_SITES)

    let constructionSites = {
        mySites: mySites,
    }

    let allStructures = room.find(FIND_STRUCTURES)

    let spawns = room.find(FIND_MY_SPAWNS)

    let links = room.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType == STRUCTURE_LINK
    })

    let labs = room.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType == STRUCTURE_LAB
    })

    let towers = room.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType == STRUCTURE_TOWER
    })

    let containers = room.find(FIND_STRUCTURES, {
        filter: s => s.structureType == STRUCTURE_CONTAINER
    })

    let factory = room.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType == STRUCTURE_FACTORY
    })[0]

    let powerSpawn = room.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType == STRUCTURE_POWER_SPAWN
    })[0]

    let storage = room.storage

    let terminal = room.terminal

    let controller = room.controller

    let mineral = room.find(FIND_MINERALS)[0]

    let sources = room.find(FIND_SOURCES)

    let structures = {
        allStructures: allStructures,

        spawns: spawns,
        links: links,
        labs: labs,
        towers: towers,
        containers: containers,
        storage: storage,
        terminal: terminal,
        factory: factory,
        powerSpawn: powerSpawn,

        controller: controller,
        mineral: mineral,
        sources: sources,
    }

    let baseLink
    let controllerLink
    let sourceLink1
    let sourceLink2

    for (let link of links) {

        if (storage && link.pos.getRangeTo(storage) <= 2) {

            baseLink = link
            continue
        }
        if (link.pos.getRangeTo(controller) <= 2) {

            controllerLink = link
            continue
        }

        if (link.pos.getRangeTo(sources[0]) <= 2) {

            sourceLink1 = link
            continue
        }
        if (link.pos.getRangeTo(sources[1]) <= 2) {

            sourceLink2 = link
            continue
        }
    }

    let controllerContainer

    let sourceContainer1

    let sourceContainer2

    let primaryLabs = []
    let secondaryLabs = []
    let tertiaryLabs = []

    for (let lab of labs) {

        var nearbyLab = lab.pos.findInRange(labs, 2)

        if (controller.level == 7) {
            if (nearbyLab.length == labs.length && primaryLabs.length < 2) {

                lab.room.visual.circle(lab.pos, {
                    fill: 'transparent',
                    radius: 0.8,
                    stroke: '#39A0ED',
                    strokeWidth: 0.125
                });
                primaryLabs.push(lab)

            } else {

                secondaryLabs.push(lab)

            }
        } else if (controller.level == 8) {
            if (nearbyLab.length == labs.length && primaryLabs.length < 2) {

                primaryLabs.push(lab)

            } else {

                secondaryLabs.push(lab)

            }
        }
    }

    let specialStructures = {
        baseLink: baseLink,
        controllerContainer: controllerContainer,
        controllerLink: controllerLink,
        sourceContainer1: sourceContainer1,
        sourceLink1: sourceLink1,
        sourceContainer2: sourceContainer2,
        sourceLink2: sourceLink2,
        container: {

        },
        links: {
            baseLink: baseLink,
            controllerLink: controllerLink,
            sourceLink1: sourceLink1,
            sourceLink2: sourceLink2,
        },
        labs: {
            primaryLabs: primaryLabs,
            secondaryLabs: secondaryLabs,
            tertiaryLabs: "tertiaryLabs",
        }
    }

    let costMatrixes = {}

    return {
        creeps: creeps,
        powerCreeps: powerCreeps,
        constructionSites: constructionSites,
        structures: structures,
        specialStructures: specialStructures,
        costMatrixes,
    }
}

module.exports = importantStructures