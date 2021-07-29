function importantStructures(room) {

    let myCreeps = room.find(FIND_MY_CREEPS)

    let creeps = {
        myCreeps: myCreeps,
        /* allyCreeps: allyCreeps,
        hostileCreeps: hostileCreeps,
        invaderCreeps: invaderCreeps, */
    }

    let powerCreeps = {
        myPowerCreeps: "",
        allyPowerCreeps: "",
        hostilePowerCreeps: "",
    }

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

    let controller = room.controller

    let storage = room.storage

    let terminal = room.terminal

    let mineral = room.find(FIND_MINERALS)[0]

    let structures = {
        spawns: spawns,
        links: links,
        labs: labs,
        towers: towers,
        containers: containers,
        storage: storage,
        terminal: terminal,
        factory: factory,
        powerSpawn: powerSpawn,
    }

    let baseLink

    let controllerContainer
    let controllerLink

    let sourceContainer1
    let sourceLink1

    let sourceContainer2
    let sourceLink2

    let specialStructures = {
        baseLink: baseLink,
        controllerContainer: controllerContainer,
        controllerLink: controllerLink,
        sourceContainer1: sourceContainer1,
        sourceLink1: sourceLink1,
        sourceContainer2: sourceContainer2,
        sourceLink2: sourceLink2,
    }

    let costMatrixes = {}

    return {
        creeps: creeps,
        structures: structures,
        specialStructures: specialStructures,
        costMatrixes,
    }
}

module.exports = importantStructures