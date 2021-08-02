function roomPlanner(room) {

    const anchorPoint = room.memory.anchorPoint

    if (!anchorPoint) return

    room.visual.rect(anchorPoint.x - 5.5, anchorPoint.y - 5.5, 11, 11, { fill: "transparent", stroke: "#45C476" })

    room.visual.rect(anchorPoint.x - 0.5, anchorPoint.y - 0.5, 1, 1, { fill: "transparent", stroke: "#45C476", strokeWidth: "0.15" })

    let base = {
        "road": { "pos": [{ "x": 5, "y": 0 }, { "x": 7, "y": 0 }, { "x": 8, "y": 0 }, { "x": 4, "y": 12 }, { "x": 7, "y": 12 }, { "x": 8, "y": 12 }, { "x": 12, "y": 8 }, { "x": 12, "y": 7 }, { "x": 12, "y": 4 }, { "x": 4, "y": 0 }, { "x": 5, "y": 12 }, { "x": 0, "y": 7 }, { "x": 0, "y": 5 }, { "x": 0, "y": 4 }, { "x": 0, "y": 8 }, { "x": 3, "y": 12 }, { "x": 2, "y": 11 }, { "x": 1, "y": 10 }, { "x": 0, "y": 9 }, { "x": 9, "y": 12 }, { "x": 10, "y": 11 }, { "x": 11, "y": 10 }, { "x": 12, "y": 9 }, { "x": 12, "y": 3 }, { "x": 11, "y": 2 }, { "x": 10, "y": 1 }, { "x": 9, "y": 0 }, { "x": 3, "y": 0 }, { "x": 2, "y": 1 }, { "x": 1, "y": 2 }, { "x": 0, "y": 3 }, { "x": 7, "y": 9 }, { "x": 6, "y": 10 }, { "x": 6, "y": 11 }, { "x": 5, "y": 9 }, { "x": 5, "y": 3 }, { "x": 6, "y": 2 }, { "x": 6, "y": 1 }, { "x": 5, "y": 4 }, { "x": 7, "y": 4 }, { "x": 5, "y": 8 }, { "x": 7, "y": 8 }, { "x": 7, "y": 3 }, { "x": 2, "y": 4 }, { "x": 4, "y": 2 }, { "x": 4, "y": 10 }, { "x": 3, "y": 9 }, { "x": 2, "y": 8 }, { "x": 8, "y": 10 }, { "x": 9, "y": 9 }, { "x": 10, "y": 8 }, { "x": 3, "y": 3 }, { "x": 4, "y": 6 }, { "x": 7, "y": 7 }, { "x": 8, "y": 6 }, { "x": 7, "y": 5 }, { "x": 6, "y": 12 }, { "x": 6, "y": 0 }, { "x": 0, "y": 6 }, { "x": 12, "y": 5 }, { "x": 12, "y": 6 }, { "x": 5, "y": 7 }, { "x": 5, "y": 5 }, { "x": 1, "y": 7 }, { "x": 1, "y": 5 }, { "x": 11, "y": 7 }, { "x": 11, "y": 5 }, { "x": 10, "y": 4 }, { "x": 9, "y": 4 }, { "x": 8, "y": 4 }, { "x": 9, "y": 5 }] },
        "storage": { "pos": [{ "x": 6, "y": 7 }] },
        "link": { "pos": [{ "x": 5, "y": 6 }] },
        "terminal": { "pos": [{ "x": 6, "y": 5 }] },
        "lab": { "pos": [{ "x": 8, "y": 1 }, { "x": 9, "y": 1 }, { "x": 9, "y": 2 }, { "x": 10, "y": 2 }, { "x": 10, "y": 3 }, { "x": 7, "y": 1 }, { "x": 8, "y": 2 }, { "x": 9, "y": 3 }, { "x": 7, "y": 2 }, { "x": 8, "y": 3 }] },
        "tower": { "pos": [{ "x": 4, "y": 7 }, { "x": 8, "y": 7 }, { "x": 4, "y": 5 }, { "x": 8, "y": 5 }, { "x": 6, "y": 4 }, { "x": 6, "y": 8 }] },
        "extension": { "pos": [{ "x": 9, "y": 11 }, { "x": 9, "y": 10 }, { "x": 10, "y": 10 }, { "x": 10, "y": 9 }, { "x": 11, "y": 9 }, { "x": 8, "y": 11 }, { "x": 7, "y": 11 }, { "x": 5, "y": 11 }, { "x": 4, "y": 11 }, { "x": 3, "y": 11 }, { "x": 3, "y": 10 }, { "x": 2, "y": 10 }, { "x": 2, "y": 9 }, { "x": 1, "y": 9 }, { "x": 1, "y": 8 }, { "x": 1, "y": 4 }, { "x": 1, "y": 3 }, { "x": 2, "y": 3 }, { "x": 2, "y": 2 }, { "x": 3, "y": 2 }, { "x": 3, "y": 1 }, { "x": 4, "y": 1 }, { "x": 5, "y": 1 }, { "x": 5, "y": 2 }, { "x": 11, "y": 8 }, { "x": 10, "y": 7 }, { "x": 3, "y": 4 }, { "x": 4, "y": 3 }, { "x": 3, "y": 8 }, { "x": 4, "y": 9 }, { "x": 8, "y": 9 }, { "x": 9, "y": 8 }, { "x": 8, "y": 8 }, { "x": 9, "y": 7 }, { "x": 4, "y": 8 }, { "x": 4, "y": 4 }, { "x": 3, "y": 5 }, { "x": 3, "y": 7 }, { "x": 2, "y": 5 }, { "x": 2, "y": 7 }, { "x": 1, "y": 6 }, { "x": 2, "y": 6 }, { "x": 11, "y": 6 }, { "x": 10, "y": 6 }, { "x": 10, "y": 5 }, { "x": 11, "y": 4 }, { "x": 11, "y": 3 }, { "x": 9, "y": 6 }] },
        "spawn": { "pos": [{ "x": 5, "y": 10 }, { "x": 7, "y": 10 }, { "x": 6, "y": 3 }] },
        "observer": { "pos": [] },
        "powerSpawn": { "pos": [{ "x": 6, "y": 9 }] },
        "factory": { "pos": [{ "x": 7, "y": 6 }] },
        "nuker": { "pos": [{ "x": 3, "y": 6 }] },
        "container": { "pos": [] },
        "constructedWall": { "pos": [] },
        "rampart": { "pos": [] }
    }

    let outerRamparts = {
        "rampart": { "pos": [{ "x": 4, "y": 1 }, { "x": 5, "y": 1 }, { "x": 6, "y": 1 }, { "x": 7, "y": 1 }, { "x": 8, "y": 1 }, { "x": 9, "y": 1 }, { "x": 10, "y": 1 }, { "x": 11, "y": 2 }, { "x": 12, "y": 3 }, { "x": 13, "y": 4 }, { "x": 13, "y": 5 }, { "x": 13, "y": 6 }, { "x": 13, "y": 7 }, { "x": 13, "y": 8 }, { "x": 13, "y": 9 }, { "x": 13, "y": 10 }, { "x": 12, "y": 11 }, { "x": 11, "y": 12 }, { "x": 10, "y": 13 }, { "x": 9, "y": 13 }, { "x": 8, "y": 13 }, { "x": 7, "y": 13 }, { "x": 6, "y": 13 }, { "x": 5, "y": 13 }, { "x": 4, "y": 13 }, { "x": 3, "y": 12 }, { "x": 2, "y": 11 }, { "x": 1, "y": 10 }, { "x": 1, "y": 9 }, { "x": 1, "y": 8 }, { "x": 1, "y": 7 }, { "x": 1, "y": 6 }, { "x": 1, "y": 5 }, { "x": 1, "y": 4 }, { "x": 2, "y": 3 }, { "x": 3, "y": 2 }, { "x": 2, "y": 4 }, { "x": 3, "y": 3 }, { "x": 4, "y": 2 }, { "x": 5, "y": 2 }, { "x": 6, "y": 2 }, { "x": 7, "y": 2 }, { "x": 8, "y": 2 }, { "x": 9, "y": 2 }, { "x": 10, "y": 2 }, { "x": 11, "y": 3 }, { "x": 12, "y": 4 }, { "x": 12, "y": 5 }, { "x": 12, "y": 6 }, { "x": 12, "y": 7 }, { "x": 12, "y": 10 }, { "x": 12, "y": 9 }, { "x": 12, "y": 8 }, { "x": 11, "y": 11 }, { "x": 10, "y": 12 }, { "x": 9, "y": 12 }, { "x": 8, "y": 12 }, { "x": 7, "y": 12 }, { "x": 6, "y": 12 }, { "x": 5, "y": 12 }, { "x": 4, "y": 12 }, { "x": 3, "y": 11 }, { "x": 2, "y": 10 }, { "x": 2, "y": 9 }, { "x": 2, "y": 8 }, { "x": 2, "y": 7 }, { "x": 2, "y": 6 }, { "x": 2, "y": 5 }, { "x": 3, "y": 4 }, { "x": 4, "y": 3 }, { "x": 10, "y": 3 }, { "x": 11, "y": 4 }, { "x": 11, "y": 10 }, { "x": 10, "y": 11 }, { "x": 4, "y": 11 }, { "x": 3, "y": 10 }, { "x": 3, "y": 8 }, { "x": 3, "y": 7 }, { "x": 3, "y": 6 }, { "x": 3, "y": 5 }, { "x": 4, "y": 4 }, { "x": 5, "y": 3 }, { "x": 6, "y": 3 }, { "x": 7, "y": 3 }, { "x": 8, "y": 3 }, { "x": 9, "y": 3 }, { "x": 10, "y": 4 }, { "x": 11, "y": 5 }, { "x": 11, "y": 6 }, { "x": 11, "y": 7 }, { "x": 11, "y": 8 }, { "x": 11, "y": 9 }, { "x": 10, "y": 10 }, { "x": 9, "y": 11 }, { "x": 8, "y": 11 }, { "x": 7, "y": 11 }, { "x": 6, "y": 11 }, { "x": 5, "y": 11 }, { "x": 4, "y": 10 }, { "x": 3, "y": 9 }, { "x": 5, "y": 10 }, { "x": 4, "y": 9 }, { "x": 4, "y": 5 }, { "x": 5, "y": 4 }, { "x": 9, "y": 4 }, { "x": 10, "y": 5 }, { "x": 9, "y": 10 }, { "x": 10, "y": 9 }, { "x": 5, "y": 9 }, { "x": 9, "y": 9 }, { "x": 9, "y": 5 }, { "x": 5, "y": 5 }] }
    }

    let innerRamparts = {
        "rampart": { "pos": [{ "x": 6, "y": 3 }, { "x": 4, "y": 5 }, { "x": 3, "y": 6 }, { "x": 4, "y": 7 }, { "x": 5, "y": 6 }, { "x": 6, "y": 7 }, { "x": 7, "y": 6 }, { "x": 6, "y": 5 }, { "x": 6, "y": 4 }, { "x": 8, "y": 5 }, { "x": 8, "y": 7 }, { "x": 6, "y": 8 }, { "x": 6, "y": 9 }, { "x": 5, "y": 10 }, { "x": 7, "y": 10 }, { "x": 8, "y": 3 }, { "x": 8, "y": 2 }, { "x": 7, "y": 2 }, { "x": 7, "y": 1 }, { "x": 8, "y": 1 }, { "x": 9, "y": 1 }, { "x": 9, "y": 2 }, { "x": 9, "y": 3 }, { "x": 10, "y": 3 }, { "x": 10, "y": 2 }] }
    }

    placeBase(base)
    placeOuterRamparts(outerRamparts)
    placeInnerRamparts(innerRamparts)


    function placeBase(collection) {
        for (let structureType in collection) {
            for (let pos of collection[structureType].pos) {

                pos.x += anchorPoint.x - 6
                pos.y += anchorPoint.y - 6

                if (room.getTerrain().get(pos.x, pos.y) != TERRAIN_MASK_WALL) {

                    if (structureType == "road" && room.controller.level <= 4) {


                    } else if (structureType == "link" && room.controller.level <= 6) {


                    } else {

                        room.createConstructionSite(pos.x, pos.y, structureType)
                    }


                    if (structureType == "road") {

                        room.visual.circle(pos.x, pos.y, {
                            fill: '#FCFEFF',
                            radius: 0.2,
                            strokeWidth: 0.125
                        })
                    } else if (structureType == "extension") {

                        room.visual.circle(pos.x, pos.y, {
                            fill: '#F4E637',
                            radius: 0.2,
                            strokeWidth: 0.125
                        })
                    } else if (structureType == "tower") {

                        room.visual.circle(pos.x, pos.y, {
                            fill: '#FE411E',
                            radius: 0.2,
                            strokeWidth: 0.125
                        })
                    } else if (structureType == "container") {

                        room.visual.circle(pos.x, pos.y, {
                            fill: 'transparent',
                            radius: 0.4,
                            stroke: '#747575',
                            strokeWidth: 0.125
                        })
                    } else if (structureType == "spawn") {

                        room.visual.circle(pos.x, pos.y, {
                            fill: '#FE8F00',
                            radius: 0.2,
                            strokeWidth: 0.125
                        })
                    } else if (structureType == "lab") {

                        room.visual.circle(pos.x, pos.y, {
                            fill: '#B6B7B8',
                            radius: 0.2,
                            strokeWidth: 0.125
                        })
                    } else {

                        room.visual.circle(pos.x, pos.y, {
                            fill: '#B03CBD',
                            radius: 0.2,
                            strokeWidth: 0.125
                        })
                    }
                }
            }
        }
    }

    function placeOuterRamparts(collection) {
        for (let structureType in collection) {
            for (let pos of collection[structureType].pos) {

                pos.x += anchorPoint.x - 7
                pos.y += anchorPoint.y - 7

                if (room.getTerrain().get(pos.x, pos.y) != TERRAIN_MASK_WALL) {

                    if (room.memory.stage >= 3 && room.storage && room.storage.store[RESOURCE_ENERGY] >= 45000) {

                        room.createConstructionSite(pos.x, pos.y, structureType)
                    }

                    room.visual.circle(pos.x, pos.y, {
                        fill: '#4def52',
                        radius: 0.2,
                        strokeWidth: 0.125
                    })
                }
            }
        }
    }

    function placeInnerRamparts(collection) {
        for (let structureType in collection) {
            for (let pos of collection[structureType].pos) {

                pos.x += anchorPoint.x - 6
                pos.y += anchorPoint.y - 6

                if (room.getTerrain().get(pos.x, pos.y) != TERRAIN_MASK_WALL) {

                    if (room.memory.stage >= 6 && room.storage && room.storage.store[RESOURCE_ENERGY] >= 45000) {

                        room.createConstructionSite(pos.x, pos.y, structureType)
                    }

                    room.visual.circle(pos.x, pos.y, {
                        fill: '#4def52',
                        radius: 0.2,
                        strokeWidth: 0.125
                    })
                }
            }
        }
    }
}

module.exports = roomPlanner