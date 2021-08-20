function constants(room) {

    /* costMatrixes() */
    roomGlobal()
    myResources()
        /* nuke() */

    if (!room.memory.remoteRooms) room.memory.remoteRooms = []

    function nuke() {

        let nuker = room.find(FIND_MY_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_NUKER
        })[0]

        if (nuker && room.name == "E25N2") {

            if (nuker.store[RESOURCE_ENERGY] == nuker.store.getCapacity(RESOURCE_ENERGY) && nuker.store[RESOURCE_GHODIUM] == nuker.store.getCapacity(RESOURCE_GHODIUM)) {

                nuker.launchNuke(new RoomPosition(18, 24, 'E32N8'));
            }
        }
    }

    function costMatrixes() {

        /* let terrainCM = new PathFinder.CostMatrix

        let terrain = Game.map.getRoomTerrain(room.name)

        for (var x = -1; x < 50; ++x) {
            for (var y = -1; y < 50; ++y) {

                switch (terrain.get(x, y)) {

                    case 0:

                        //cm.set(x, y, 4)
                        break

                    case TERRAIN_MASK_SWAMP:

                        //cm.set(x, y, 24)
                        break

                    case TERRAIN_MASK_WALL:

                        //cm.set(x, y, 255)
                        break
                }
            }
        }

        room.memory.terrainCM = cm.serialize() */

        let cm = new PathFinder.CostMatrix

        let roads = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_ROAD
        })

        for (let road of roads) {

            cm.set(road.pos.x, road.pos.y, 1)
        }

        let constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
            filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
        })

        for (let site of constructionSites) {

            cm.set(site.pos.x, site.pos.y, 255)
        }

        let structures = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
        })

        for (let structure of structures) {

            cm.set(structure.pos.x, structure.pos.y, 255)
        }

        /*         const anchorPoint = room.memory.anchorPoint

                if (anchorPoint) cm.set(anchorPoint.x, anchorPoint.y, 255) */

        let enableVisuals = false

        if (enableVisuals) {
            for (var x = -1; x < 50; ++x) {
                for (var y = -1; y < 50; ++y) {

                    let value = cm.get(x, y)

                    if (value) {

                        if (value == 1) {

                            room.visual.rect(x - 0.5, y - 0.5, 1, 1, { opacity: 0.2, stroke: "green", fill: "green" })
                                //room.visual.text((value).toFixed(0), x, y + 0.25, { font: 0.3 })

                        } else if (value == 4) {

                            room.visual.rect(x - 0.5, y - 0.5, 1, 1, { opacity: 0.2, stroke: "#ffff66", fill: "#ffff66" })
                                //room.visual.text((value).toFixed(0), x, y + 0.25, { font: 0.3 })

                        } else if (value == 24) {

                            room.visual.rect(x - 0.5, y - 0.5, 1, 1, { opacity: 0.2, stroke: "#0000ff", fill: "#0000ff" })
                                //room.visual.text((value).toFixed(0), x, y + 0.25, { font: 0.3 })

                        } else if (value >= 255) {

                            room.visual.rect(x - 0.5, y - 0.5, 1, 1, { opacity: 0.2, stroke: "red", fill: "red" })
                                //room.visual.text((value).toFixed(0), x, y + 0.25, { font: 0.3 })
                        } else {

                            room.visual.rect(x - 0.5, y - 0.5, 1, 1, { opacity: 0.2, stroke: "39A0ED", fill: "red" })
                                //room.visual.text((value).toFixed(0), x, y + 0.25, { font: 0.3 })
                        }
                    }
                }
            }
        }

        room.memory.defaultCostMatrix = cm.serialize()
    }

    function roomGlobal() {

        if (room.memory.stage == 8 && Memory.global.establishedRooms.indexOf(room.name) == -1) {

            Memory.global.establishedRooms.push(room.name)
        }
    }

    function myResources() {

        if (room.storage) {

            var storageEnergy = room.storage.store[RESOURCE_ENERGY]
        } else {

            var storageEnergy = 0
        }
        if (room.terminal) {

            var terminalEnergy = room.terminal.store[RESOURCE_ENERGY]

        } else {

            var terminalEnergy = 0
        }

        let index = Memory.global.needsEnergy.indexOf(room.name)

        if (room.controller.level <= 7 && room.storage && room.terminal && (storageEnergy + terminalEnergy) <= 150000) {

            if (index == -1) {

                Memory.global.needsEnergy.push(room.name)
            }
        } else if (Memory.global.needsEnergy.length > 0) {

            if (index >= 0) {

                Memory.global.needsEnergy.splice(index, 1);
            }
        }
    }
}

module.exports = constants