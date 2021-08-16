function structures() {

    function findStructuresOfType(constant, type) {

        return room.find(constant, {
            filter: structure => structure.structureType == type
        })
    }

    let allStructures = room.find(FIND_STRUCTURES)

    let spawns = room.find(FIND_MY_SPAWNS)

    let links = findBuildingConstantOfType(FIND_MY_STRUCTURES, STRUCTURE_LINK)

    let labs = findBuildingConstantOfType(FIND_MY_STRUCTURES, STRUCTURE_LAB)

    let towers = findBuildingConstantOfType(FIND_MY_STRUCTURES, STRUCTURE_TOWER)

    let containers = findBuildingConstantOfType(FIND_STRUCTURES, STRUCTURE_CONTAINER)

    let factory = findBuildingConstantOfType(FIND_MY_STRUCTURES, STRUCTURE_FACTORY)[0]

    let powerSpawn = findBuildingConstantOfType(FIND_MY_STRUCTURES, STRUCTURE_POWER_SPAWN)[0]

    let storage = room.storage

    let terminal = room.terminal

    let controller = room.controller

    let mineral = room.find(FIND_MINERALS)[0]

    let sources = room.find(FIND_SOURCES)

    return {
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
}

function constructionSites() {

    function findSitesOfType(constant, type) {

        return room.find(constant, {
            filter: site => site.structureType == type
        })
    }

    let allSites = room.find(FIND_CONSTRUCTION_SITES)

    let mySites = room.find(FIND_MY_CONSTRUCTION_SITES)

    return {
        allSites: allSites,
        mySites: mySites,
    }
}

module.exports = {
    structures: structures(),
    constructionSites: constructionSites(),
}