function roomPlanner(room) {

    if (Object.values(Game.constructionSites).length == 100) return

    let mySites = room.find(FIND_MY_CONSTRUCTION_SITES)

    if (mySites.length > 10) return

    //

    let placedSites = 0

    const anchorPoint = room.get("anchorPoint")

    room.visual.rect(anchorPoint.x - 5.5, anchorPoint.y - 5.5, 11, 11, { fill: "transparent", stroke: "#45C476" })

    room.visual.rect(anchorPoint.x - 0.5, anchorPoint.y - 0.5, 1, 1, { fill: "transparent", stroke: "#45C476", strokeWidth: "0.15" })

    // Bases labeled and used by RCL

    let bases = {
        8: {
            "road": { "pos": [{ "x": 5, "y": 0 }, { "x": 7, "y": 0 }, { "x": 8, "y": 0 }, { "x": 4, "y": 12 }, { "x": 7, "y": 12 }, { "x": 8, "y": 12 }, { "x": 12, "y": 8 }, { "x": 12, "y": 7 }, { "x": 12, "y": 4 }, { "x": 4, "y": 0 }, { "x": 5, "y": 12 }, { "x": 0, "y": 7 }, { "x": 0, "y": 5 }, { "x": 0, "y": 4 }, { "x": 0, "y": 8 }, { "x": 3, "y": 12 }, { "x": 2, "y": 11 }, { "x": 1, "y": 10 }, { "x": 0, "y": 9 }, { "x": 9, "y": 12 }, { "x": 10, "y": 11 }, { "x": 11, "y": 10 }, { "x": 12, "y": 9 }, { "x": 12, "y": 3 }, { "x": 11, "y": 2 }, { "x": 10, "y": 1 }, { "x": 9, "y": 0 }, { "x": 3, "y": 0 }, { "x": 2, "y": 1 }, { "x": 1, "y": 2 }, { "x": 0, "y": 3 }, { "x": 7, "y": 9 }, { "x": 6, "y": 10 }, { "x": 6, "y": 11 }, { "x": 5, "y": 9 }, { "x": 5, "y": 3 }, { "x": 6, "y": 2 }, { "x": 6, "y": 1 }, { "x": 5, "y": 4 }, { "x": 7, "y": 4 }, { "x": 5, "y": 8 }, { "x": 7, "y": 8 }, { "x": 2, "y": 4 }, { "x": 4, "y": 2 }, { "x": 4, "y": 10 }, { "x": 3, "y": 9 }, { "x": 2, "y": 8 }, { "x": 8, "y": 10 }, { "x": 9, "y": 9 }, { "x": 10, "y": 8 }, { "x": 3, "y": 3 }, { "x": 4, "y": 6 }, { "x": 7, "y": 7 }, { "x": 8, "y": 6 }, { "x": 7, "y": 5 }, { "x": 6, "y": 12 }, { "x": 6, "y": 0 }, { "x": 0, "y": 6 }, { "x": 12, "y": 5 }, { "x": 12, "y": 6 }, { "x": 5, "y": 7 }, { "x": 5, "y": 5 }, { "x": 1, "y": 7 }, { "x": 1, "y": 5 }, { "x": 11, "y": 7 }, { "x": 11, "y": 5 }, { "x": 10, "y": 4 }, { "x": 9, "y": 5 }, { "x": 9, "y": 3 }, { "x": 8, "y": 2 }, { "x": 7, "y": 3 }] },
            "storage": { "pos": [{ "x": 6, "y": 7 }] },
            "link": { "pos": [{ "x": 5, "y": 6 }] },
            "terminal": { "pos": [{ "x": 6, "y": 5 }] },
            "lab": { "pos": [{ "x": 8, "y": 1 }, { "x": 9, "y": 1 }, { "x": 9, "y": 2 }, { "x": 10, "y": 2 }, { "x": 10, "y": 3 }, { "x": 7, "y": 1 }, { "x": 8, "y": 3 }, { "x": 7, "y": 2 }, { "x": 9, "y": 4 }, { "x": 8, "y": 4 }] },
            "tower": { "pos": [{ "x": 4, "y": 7 }, { "x": 8, "y": 7 }, { "x": 4, "y": 5 }, { "x": 8, "y": 5 }, { "x": 6, "y": 4 }, { "x": 6, "y": 8 }] },
            "extension": { "pos": [{ "x": 9, "y": 11 }, { "x": 9, "y": 10 }, { "x": 10, "y": 10 }, { "x": 10, "y": 9 }, { "x": 11, "y": 9 }, { "x": 8, "y": 11 }, { "x": 7, "y": 11 }, { "x": 5, "y": 11 }, { "x": 4, "y": 11 }, { "x": 3, "y": 11 }, { "x": 3, "y": 10 }, { "x": 2, "y": 10 }, { "x": 2, "y": 9 }, { "x": 1, "y": 9 }, { "x": 1, "y": 8 }, { "x": 1, "y": 4 }, { "x": 1, "y": 3 }, { "x": 2, "y": 3 }, { "x": 2, "y": 2 }, { "x": 3, "y": 2 }, { "x": 3, "y": 1 }, { "x": 4, "y": 1 }, { "x": 5, "y": 1 }, { "x": 5, "y": 2 }, { "x": 11, "y": 8 }, { "x": 10, "y": 7 }, { "x": 3, "y": 4 }, { "x": 4, "y": 3 }, { "x": 3, "y": 8 }, { "x": 9, "y": 8 }, { "x": 9, "y": 7 }, { "x": 4, "y": 4 }, { "x": 3, "y": 5 }, { "x": 3, "y": 7 }, { "x": 2, "y": 5 }, { "x": 2, "y": 7 }, { "x": 1, "y": 6 }, { "x": 2, "y": 6 }, { "x": 11, "y": 6 }, { "x": 10, "y": 6 }, { "x": 10, "y": 5 }, { "x": 9, "y": 6 }, { "x": 7, "y": 10 }, { "x": 5, "y": 10 }, { "x": 8, "y": 9 }, { "x": 4, "y": 9 }, { "x": 11, "y": 3 }] },
            "spawn": { "pos": [{ "x": 6, "y": 3 }, { "x": 4, "y": 8 }, { "x": 8, "y": 8 }] },
            "observer": { "pos": [{ "x": 11, "y": 4 }] },
            "powerSpawn": { "pos": [{ "x": 6, "y": 9 }] },
            "factory": { "pos": [{ "x": 7, "y": 6 }] },
            "nuker": { "pos": [{ "x": 3, "y": 6 }] },
        },
        7: {
            "road": { "pos": [{ "x": 5, "y": 0 }, { "x": 7, "y": 0 }, { "x": 8, "y": 0 }, { "x": 4, "y": 12 }, { "x": 7, "y": 12 }, { "x": 8, "y": 12 }, { "x": 12, "y": 8 }, { "x": 12, "y": 7 }, { "x": 12, "y": 4 }, { "x": 4, "y": 0 }, { "x": 5, "y": 12 }, { "x": 0, "y": 7 }, { "x": 0, "y": 5 }, { "x": 0, "y": 4 }, { "x": 0, "y": 8 }, { "x": 3, "y": 12 }, { "x": 2, "y": 11 }, { "x": 1, "y": 10 }, { "x": 0, "y": 9 }, { "x": 9, "y": 12 }, { "x": 10, "y": 11 }, { "x": 11, "y": 10 }, { "x": 12, "y": 9 }, { "x": 12, "y": 3 }, { "x": 11, "y": 2 }, { "x": 10, "y": 1 }, { "x": 9, "y": 0 }, { "x": 3, "y": 0 }, { "x": 2, "y": 1 }, { "x": 1, "y": 2 }, { "x": 0, "y": 3 }, { "x": 7, "y": 9 }, { "x": 6, "y": 10 }, { "x": 6, "y": 11 }, { "x": 5, "y": 9 }, { "x": 5, "y": 3 }, { "x": 6, "y": 2 }, { "x": 6, "y": 1 }, { "x": 5, "y": 4 }, { "x": 7, "y": 4 }, { "x": 5, "y": 8 }, { "x": 7, "y": 8 }, { "x": 7, "y": 3 }, { "x": 2, "y": 4 }, { "x": 4, "y": 2 }, { "x": 4, "y": 10 }, { "x": 3, "y": 9 }, { "x": 2, "y": 8 }, { "x": 8, "y": 10 }, { "x": 9, "y": 9 }, { "x": 10, "y": 8 }, { "x": 3, "y": 3 }, { "x": 4, "y": 6 }, { "x": 7, "y": 7 }, { "x": 8, "y": 6 }, { "x": 7, "y": 5 }, { "x": 6, "y": 12 }, { "x": 6, "y": 0 }, { "x": 0, "y": 6 }, { "x": 12, "y": 5 }, { "x": 12, "y": 6 }, { "x": 5, "y": 7 }, { "x": 5, "y": 5 }, { "x": 1, "y": 7 }, { "x": 1, "y": 5 }, { "x": 11, "y": 7 }, { "x": 11, "y": 5 }, { "x": 10, "y": 4 }, { "x": 9, "y": 5 }, { "x": 8, "y": 2 }, { "x": 9, "y": 3 }] },
            "storage": { "pos": [{ "x": 6, "y": 7 }] },
            "link": { "pos": [{ "x": 5, "y": 6 }] },
            "terminal": { "pos": [{ "x": 6, "y": 5 }] },
            "lab": { "pos": [{ "x": 8, "y": 3 }, { "x": 9, "y": 2 }, { "x": 9, "y": 4 }, { "x": 8, "y": 4 }, { "x": 10, "y": 2 }, { "x": 10, "y": 3 }] },
            "tower": { "pos": [{ "x": 8, "y": 7 }, { "x": 4, "y": 5 }, { "x": 4, "y": 7 }] },
            "extension": { "pos": [{ "x": 10, "y": 7 }, { "x": 9, "y": 8 }, { "x": 9, "y": 7 }, { "x": 8, "y": 9 }, { "x": 10, "y": 9 }, { "x": 9, "y": 10 }, { "x": 10, "y": 10 }, { "x": 11, "y": 8 }, { "x": 11, "y": 9 }, { "x": 9, "y": 11 }, { "x": 9, "y": 6 }, { "x": 10, "y": 6 }, { "x": 10, "y": 5 }, { "x": 11, "y": 6 }, { "x": 8, "y": 11 }, { "x": 7, "y": 11 }, { "x": 7, "y": 10 }, { "x": 5, "y": 10 }, { "x": 5, "y": 11 }, { "x": 4, "y": 11 }, { "x": 3, "y": 11 }, { "x": 3, "y": 10 }, { "x": 2, "y": 9 }, { "x": 2, "y": 10 }, { "x": 1, "y": 9 }, { "x": 1, "y": 8 }, { "x": 4, "y": 9 }, { "x": 3, "y": 8 }, { "x": 3, "y": 7 }, { "x": 2, "y": 7 }, { "x": 2, "y": 6 }, { "x": 1, "y": 6 }, { "x": 2, "y": 5 }, { "x": 3, "y": 5 }, { "x": 3, "y": 4 }, { "x": 4, "y": 4 }, { "x": 1, "y": 4 }, { "x": 1, "y": 3 }, { "x": 2, "y": 3 }, { "x": 4, "y": 3 }, { "x": 2, "y": 2 }, { "x": 3, "y": 2 }, { "x": 3, "y": 1 }, { "x": 4, "y": 1 }, { "x": 5, "y": 1 }, { "x": 5, "y": 2 }, { "x": 11, "y": 3 }] },
            "spawn": { "pos": [{ "x": 8, "y": 8 }, { "x": 4, "y": 8 }] },
            "observer": { "pos": [] },
            "powerSpawn": { "pos": [] },
            "factory": { "pos": [{ "x": 7, "y": 6 }] },
            "nuker": { "pos": [] },
            "container": { "pos": [] },
            "constructedWall": { "pos": [] },
            "rampart": { "pos": [] }
        },
        6: {
            "road": { "pos": [{ "x": 5, "y": 0 }, { "x": 7, "y": 0 }, { "x": 8, "y": 0 }, { "x": 4, "y": 12 }, { "x": 7, "y": 12 }, { "x": 8, "y": 12 }, { "x": 12, "y": 8 }, { "x": 12, "y": 7 }, { "x": 12, "y": 4 }, { "x": 4, "y": 0 }, { "x": 5, "y": 12 }, { "x": 0, "y": 7 }, { "x": 0, "y": 5 }, { "x": 0, "y": 4 }, { "x": 0, "y": 8 }, { "x": 3, "y": 12 }, { "x": 2, "y": 11 }, { "x": 1, "y": 10 }, { "x": 0, "y": 9 }, { "x": 9, "y": 12 }, { "x": 10, "y": 11 }, { "x": 11, "y": 10 }, { "x": 12, "y": 9 }, { "x": 12, "y": 3 }, { "x": 11, "y": 2 }, { "x": 10, "y": 1 }, { "x": 9, "y": 0 }, { "x": 3, "y": 0 }, { "x": 2, "y": 1 }, { "x": 1, "y": 2 }, { "x": 0, "y": 3 }, { "x": 7, "y": 9 }, { "x": 6, "y": 10 }, { "x": 6, "y": 11 }, { "x": 5, "y": 9 }, { "x": 5, "y": 3 }, { "x": 6, "y": 2 }, { "x": 6, "y": 1 }, { "x": 5, "y": 4 }, { "x": 7, "y": 4 }, { "x": 5, "y": 8 }, { "x": 7, "y": 8 }, { "x": 7, "y": 3 }, { "x": 2, "y": 4 }, { "x": 4, "y": 2 }, { "x": 4, "y": 10 }, { "x": 3, "y": 9 }, { "x": 2, "y": 8 }, { "x": 8, "y": 10 }, { "x": 9, "y": 9 }, { "x": 10, "y": 8 }, { "x": 3, "y": 3 }, { "x": 4, "y": 6 }, { "x": 7, "y": 7 }, { "x": 8, "y": 6 }, { "x": 7, "y": 5 }, { "x": 6, "y": 12 }, { "x": 6, "y": 0 }, { "x": 0, "y": 6 }, { "x": 12, "y": 5 }, { "x": 12, "y": 6 }, { "x": 5, "y": 7 }, { "x": 5, "y": 5 }, { "x": 1, "y": 7 }, { "x": 1, "y": 5 }, { "x": 11, "y": 7 }, { "x": 11, "y": 5 }, { "x": 10, "y": 4 }, { "x": 9, "y": 5 }, { "x": 9, "y": 3 }, { "x": 8, "y": 2 }] },
            "storage": { "pos": [{ "x": 6, "y": 7 }] },
            "link": { "pos": [{ "x": 5, "y": 6 }] },
            "terminal": { "pos": [{ "x": 6, "y": 5 }] },
            "lab": { "pos": [{ "x": 8, "y": 3 }, { "x": 8, "y": 4 }, { "x": 9, "y": 4 }] },
            "tower": { "pos": [{ "x": 8, "y": 7 }, { "x": 4, "y": 7 }] },
            "extension": { "pos": [{ "x": 10, "y": 7 }, { "x": 9, "y": 8 }, { "x": 9, "y": 7 }, { "x": 8, "y": 9 }, { "x": 10, "y": 9 }, { "x": 9, "y": 10 }, { "x": 10, "y": 10 }, { "x": 11, "y": 8 }, { "x": 11, "y": 9 }, { "x": 9, "y": 11 }, { "x": 9, "y": 6 }, { "x": 10, "y": 6 }, { "x": 10, "y": 5 }, { "x": 11, "y": 6 }, { "x": 8, "y": 11 }, { "x": 7, "y": 11 }, { "x": 7, "y": 10 }, { "x": 5, "y": 10 }, { "x": 5, "y": 11 }, { "x": 4, "y": 11 }, { "x": 3, "y": 11 }, { "x": 3, "y": 10 }, { "x": 2, "y": 9 }, { "x": 2, "y": 10 }, { "x": 1, "y": 9 }, { "x": 1, "y": 8 }, { "x": 4, "y": 9 }, { "x": 3, "y": 8 }, { "x": 3, "y": 7 }, { "x": 2, "y": 7 }, { "x": 2, "y": 6 }, { "x": 1, "y": 6 }, { "x": 2, "y": 5 }, { "x": 3, "y": 5 }, { "x": 3, "y": 4 }, { "x": 4, "y": 4 }, { "x": 1, "y": 4 }, { "x": 1, "y": 3 }, { "x": 2, "y": 3 }, { "x": 4, "y": 3 }] },
            "spawn": { "pos": [{ "x": 8, "y": 8 }] },
            "observer": { "pos": [] },
            "powerSpawn": { "pos": [] },
            "factory": { "pos": [] },
            "nuker": { "pos": [] },
            "container": { "pos": [] },
            "constructedWall": { "pos": [] },
            "rampart": { "pos": [] }
        },
        5: {
            "road": { "pos": [{ "x": 5, "y": 0 }, { "x": 7, "y": 0 }, { "x": 8, "y": 0 }, { "x": 4, "y": 12 }, { "x": 7, "y": 12 }, { "x": 8, "y": 12 }, { "x": 12, "y": 8 }, { "x": 12, "y": 7 }, { "x": 12, "y": 4 }, { "x": 4, "y": 0 }, { "x": 5, "y": 12 }, { "x": 0, "y": 7 }, { "x": 0, "y": 5 }, { "x": 0, "y": 4 }, { "x": 0, "y": 8 }, { "x": 3, "y": 12 }, { "x": 2, "y": 11 }, { "x": 1, "y": 10 }, { "x": 0, "y": 9 }, { "x": 9, "y": 12 }, { "x": 10, "y": 11 }, { "x": 11, "y": 10 }, { "x": 12, "y": 9 }, { "x": 12, "y": 3 }, { "x": 11, "y": 2 }, { "x": 10, "y": 1 }, { "x": 9, "y": 0 }, { "x": 3, "y": 0 }, { "x": 2, "y": 1 }, { "x": 1, "y": 2 }, { "x": 0, "y": 3 }, { "x": 7, "y": 9 }, { "x": 6, "y": 10 }, { "x": 6, "y": 11 }, { "x": 5, "y": 9 }, { "x": 5, "y": 3 }, { "x": 6, "y": 2 }, { "x": 6, "y": 1 }, { "x": 5, "y": 4 }, { "x": 7, "y": 4 }, { "x": 5, "y": 8 }, { "x": 7, "y": 8 }, { "x": 7, "y": 3 }, { "x": 2, "y": 4 }, { "x": 4, "y": 2 }, { "x": 4, "y": 10 }, { "x": 3, "y": 9 }, { "x": 2, "y": 8 }, { "x": 8, "y": 10 }, { "x": 9, "y": 9 }, { "x": 10, "y": 8 }, { "x": 3, "y": 3 }, { "x": 4, "y": 6 }, { "x": 7, "y": 7 }, { "x": 8, "y": 6 }, { "x": 7, "y": 5 }, { "x": 6, "y": 12 }, { "x": 6, "y": 0 }, { "x": 0, "y": 6 }, { "x": 12, "y": 5 }, { "x": 12, "y": 6 }, { "x": 5, "y": 7 }, { "x": 5, "y": 5 }, { "x": 1, "y": 7 }, { "x": 1, "y": 5 }, { "x": 11, "y": 7 }, { "x": 11, "y": 5 }, { "x": 10, "y": 4 }, { "x": 9, "y": 5 }, { "x": 9, "y": 3 }, { "x": 8, "y": 2 }] },
            "storage": { "pos": [{ "x": 6, "y": 7 }] },
            "link": { "pos": [{ "x": 5, "y": 6 }] },
            "terminal": { "pos": [] },
            "lab": { "pos": [] },
            "tower": { "pos": [{ "x": 8, "y": 7 }, { "x": 4, "y": 7 }] },
            "extension": { "pos": [{ "x": 10, "y": 7 }, { "x": 9, "y": 8 }, { "x": 9, "y": 7 }, { "x": 8, "y": 9 }, { "x": 10, "y": 9 }, { "x": 9, "y": 10 }, { "x": 10, "y": 10 }, { "x": 11, "y": 8 }, { "x": 11, "y": 9 }, { "x": 9, "y": 11 }, { "x": 9, "y": 6 }, { "x": 10, "y": 6 }, { "x": 10, "y": 5 }, { "x": 11, "y": 6 }, { "x": 8, "y": 11 }, { "x": 7, "y": 11 }, { "x": 7, "y": 10 }, { "x": 5, "y": 10 }, { "x": 5, "y": 11 }, { "x": 4, "y": 11 }, { "x": 3, "y": 11 }, { "x": 3, "y": 10 }, { "x": 2, "y": 9 }, { "x": 2, "y": 10 }, { "x": 1, "y": 9 }, { "x": 1, "y": 8 }, { "x": 4, "y": 9 }, { "x": 3, "y": 8 }, { "x": 3, "y": 7 }, { "x": 2, "y": 7 }] },
            "spawn": { "pos": [{ "x": 8, "y": 8 }] },
            "observer": { "pos": [] },
            "powerSpawn": { "pos": [] },
            "factory": { "pos": [] },
            "nuker": { "pos": [] },
            "container": { "pos": [] },
            "constructedWall": { "pos": [] },
            "rampart": { "pos": [] }
        },
        4: {
            "road": { "pos": [{ "x": 4, "y": 12 }, { "x": 7, "y": 12 }, { "x": 8, "y": 12 }, { "x": 12, "y": 8 }, { "x": 12, "y": 7 }, { "x": 5, "y": 12 }, { "x": 9, "y": 12 }, { "x": 10, "y": 11 }, { "x": 11, "y": 10 }, { "x": 12, "y": 9 }, { "x": 7, "y": 9 }, { "x": 6, "y": 10 }, { "x": 6, "y": 11 }, { "x": 5, "y": 9 }, { "x": 5, "y": 8 }, { "x": 7, "y": 8 }, { "x": 4, "y": 10 }, { "x": 8, "y": 10 }, { "x": 9, "y": 9 }, { "x": 10, "y": 8 }, { "x": 7, "y": 7 }, { "x": 8, "y": 6 }, { "x": 6, "y": 12 }, { "x": 12, "y": 6 }, { "x": 5, "y": 7 }, { "x": 11, "y": 7 }, { "x": 11, "y": 5 }, { "x": 10, "y": 4 }, { "x": 9, "y": 5 }, { "x": 7, "y": 4 }, { "x": 7, "y": 3 }, { "x": 6, "y": 2 }, { "x": 5, "y": 3 }, { "x": 4, "y": 2 }, { "x": 3, "y": 3 }, { "x": 2, "y": 4 }, { "x": 1, "y": 5 }, { "x": 3, "y": 9 }, { "x": 2, "y": 8 }, { "x": 1, "y": 7 }, { "x": 4, "y": 6 }, { "x": 5, "y": 5 }, { "x": 5, "y": 4 }, { "x": 0, "y": 6 }, { "x": 9, "y": 3 }, { "x": 8, "y": 2 }, { "x": 7, "y": 5 }] },
            "storage": { "pos": [{ "x": 6, "y": 7 }] },
            "link": { "pos": [] },
            "terminal": { "pos": [] },
            "lab": { "pos": [] },
            "tower": { "pos": [{ "x": 8, "y": 7 }] },
            "extension": { "pos": [{ "x": 10, "y": 7 }, { "x": 9, "y": 8 }, { "x": 9, "y": 7 }, { "x": 8, "y": 9 }, { "x": 10, "y": 9 }, { "x": 9, "y": 10 }, { "x": 10, "y": 10 }, { "x": 11, "y": 8 }, { "x": 11, "y": 9 }, { "x": 9, "y": 11 }, { "x": 9, "y": 6 }, { "x": 10, "y": 6 }, { "x": 10, "y": 5 }, { "x": 11, "y": 6 }, { "x": 8, "y": 11 }, { "x": 7, "y": 11 }, { "x": 7, "y": 10 }, { "x": 5, "y": 10 }, { "x": 5, "y": 11 }, { "x": 4, "y": 11 }] },
            "spawn": { "pos": [{ "x": 8, "y": 8 }] },
            "observer": { "pos": [] },
            "powerSpawn": { "pos": [] },
            "factory": { "pos": [] },
            "nuker": { "pos": [] },
            "container": { "pos": [] },
            "constructedWall": { "pos": [] },
            "rampart": { "pos": [] }
        },
        3: {
            "road": { "pos": [{ "x": 7, "y": 9 }, { "x": 7, "y": 8 }, { "x": 8, "y": 10 }, { "x": 9, "y": 9 }, { "x": 10, "y": 8 }, { "x": 7, "y": 7 }, { "x": 8, "y": 6 }, { "x": 11, "y": 7 }] },
            "storage": { "pos": [] },
            "link": { "pos": [] },
            "terminal": { "pos": [] },
            "lab": { "pos": [] },
            "tower": { "pos": [{ "x": 8, "y": 7 }] },
            "extension": { "pos": [{ "x": 10, "y": 7 }, { "x": 9, "y": 8 }, { "x": 9, "y": 7 }, { "x": 8, "y": 9 }, { "x": 10, "y": 9 }, { "x": 9, "y": 10 }, { "x": 10, "y": 10 }, { "x": 11, "y": 8 }, { "x": 11, "y": 9 }, { "x": 9, "y": 11 }] },
            "spawn": { "pos": [{ "x": 8, "y": 8 }] },
            "observer": { "pos": [] },
            "powerSpawn": { "pos": [] },
            "factory": { "pos": [] },
            "nuker": { "pos": [] },
            "container": { "pos": [] },
            "constructedWall": { "pos": [] },
            "rampart": { "pos": [] }
        },
        2: {
            "road": { "pos": [{ "x": 7, "y": 9 }, { "x": 7, "y": 8 }, { "x": 8, "y": 10 }, { "x": 9, "y": 9 }, { "x": 10, "y": 8 }, { "x": 7, "y": 7 }, { "x": 11, "y": 7 }] },
            "storage": { "pos": [] },
            "link": { "pos": [] },
            "terminal": { "pos": [] },
            "lab": { "pos": [] },
            "tower": { "pos": [] },
            "extension": { "pos": [{ "x": 10, "y": 7 }, { "x": 9, "y": 8 }, { "x": 9, "y": 7 }, { "x": 8, "y": 9 }, { "x": 10, "y": 9 }] },
            "spawn": { "pos": [{ "x": 8, "y": 8 }] },
            "observer": { "pos": [] },
            "powerSpawn": { "pos": [] },
            "factory": { "pos": [] },
            "nuker": { "pos": [] },
            "container": { "pos": [] },
            "constructedWall": { "pos": [] },
            "rampart": { "pos": [] }
        },
        1: {
            "road": { "pos": [] },
            "storage": { "pos": [] },
            "link": { "pos": [] },
            "terminal": { "pos": [] },
            "lab": { "pos": [] },
            "tower": { "pos": [] },
            "extension": { "pos": [] },
            "spawn": { "pos": [{ "x": 8, "y": 8 }] },
            "observer": { "pos": [] },
            "powerSpawn": { "pos": [] },
            "factory": { "pos": [] },
            "nuker": { "pos": [] },
            "container": { "pos": [] },
            "constructedWall": { "pos": [] },
            "rampart": { "pos": [] }
        }
    }

    if (Game.time % 100 == 0) placeBase(bases)

    function placeBase(bases) {

        let collection

        for (let property in bases) {

            if (room.controller.level >= property) {

                collection = bases[property]
            }
        }

        if (!collection) return

        for (let structureType in collection) {

            if (structureType == STRUCTURE_ROAD && room.memory.stage < 4) continue

            if (structureType == STRUCTURE_LAB) continue
            if (structureType == STRUCTURE_NUKER) continue
            if (structureType == STRUCTURE_OBSERVER) continue

            for (let pos of collection[structureType].pos) {

                pos.x += anchorPoint.x - 6
                pos.y += anchorPoint.y - 6

                if (room.getTerrain().get(pos.x, pos.y) == TERRAIN_MASK_WALL) continue

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

                if (findBuildingsOnPos(FIND_STRUCTURES, structureType, pos) || findBuildingsOnPos(FIND_MY_CONSTRUCTION_SITES, structureType, pos)) continue

                if (placedSites < 10 && room.createConstructionSite(pos.x, pos.y, structureType) == 0) placedSites++
            }
        }
    }

    let ramparts = {
        6: {
            "rampart": { "pos": [{ "x": 3, "y": 12 }, { "x": 4, "y": 12 }, { "x": 5, "y": 12 }, { "x": 6, "y": 12 }, { "x": 7, "y": 12 }, { "x": 8, "y": 12 }, { "x": 8, "y": 11 }, { "x": 9, "y": 11 }, { "x": 9, "y": 10 }, { "x": 9, "y": 9 }, { "x": 9, "y": 7 }, { "x": 8, "y": 5 }, { "x": 8, "y": 4 }, { "x": 8, "y": 3 }, { "x": 7, "y": 3 }, { "x": 6, "y": 3 }, { "x": 5, "y": 3 }, { "x": 4, "y": 4 }, { "x": 3, "y": 5 }, { "x": 3, "y": 6 }, { "x": 4, "y": 7 }, { "x": 6, "y": 7 }, { "x": 7, "y": 6 }, { "x": 6, "y": 4 }, { "x": 4, "y": 8 }, { "x": 6, "y": 5 }, { "x": 3, "y": 7 }, { "x": 3, "y": 8 }, { "x": 3, "y": 9 }, { "x": 4, "y": 9 }, { "x": 4, "y": 10 }, { "x": 6, "y": 10 }, { "x": 7, "y": 10 }, { "x": 8, "y": 10 }, { "x": 8, "y": 9 }, { "x": 8, "y": 8 }, { "x": 6, "y": 9 }, { "x": 4, "y": 11 }, { "x": 3, "y": 11 }, { "x": 2, "y": 11 }, { "x": 2, "y": 10 }, { "x": 2, "y": 9 }, { "x": 3, "y": 10 }, { "x": 1, "y": 10 }, { "x": 0, "y": 9 }, { "x": 0, "y": 8 }, { "x": 1, "y": 8 }, { "x": 1, "y": 7 }, { "x": 0, "y": 7 }, { "x": 0, "y": 6 }, { "x": 0, "y": 5 }, { "x": 0, "y": 4 }, { "x": 0, "y": 3 }, { "x": 1, "y": 3 }, { "x": 1, "y": 2 }, { "x": 2, "y": 2 }, { "x": 2, "y": 1 }, { "x": 3, "y": 1 }, { "x": 3, "y": 0 }, { "x": 4, "y": 0 }, { "x": 5, "y": 0 }, { "x": 6, "y": 0 }, { "x": 8, "y": 0 }, { "x": 9, "y": 0 }, { "x": 7, "y": 0 }, { "x": 7, "y": 1 }, { "x": 8, "y": 1 }, { "x": 9, "y": 1 }, { "x": 10, "y": 1 }, { "x": 10, "y": 2 }, { "x": 11, "y": 2 }, { "x": 11, "y": 3 }, { "x": 12, "y": 3 }, { "x": 12, "y": 4 }, { "x": 12, "y": 5 }, { "x": 12, "y": 6 }, { "x": 12, "y": 7 }, { "x": 12, "y": 8 }, { "x": 12, "y": 9 }, { "x": 11, "y": 9 }, { "x": 11, "y": 10 }, { "x": 10, "y": 10 }, { "x": 10, "y": 11 }, { "x": 9, "y": 12 }, { "x": 10, "y": 9 }, { "x": 10, "y": 8 }, { "x": 11, "y": 8 }, { "x": 11, "y": 7 }, { "x": 11, "y": 6 }, { "x": 9, "y": 3 }, { "x": 9, "y": 4 }, { "x": 10, "y": 6 }, { "x": 11, "y": 4 }, { "x": 10, "y": 3 }, { "x": 9, "y": 5 }, { "x": 9, "y": 6 }, { "x": 8, "y": 7 }, { "x": 10, "y": 4 }, { "x": 10, "y": 5 }, { "x": 8, "y": 2 }, { "x": 9, "y": 2 }, { "x": 7, "y": 2 }, { "x": 6, "y": 2 }, { "x": 5, "y": 2 }, { "x": 4, "y": 2 }, { "x": 4, "y": 3 }, { "x": 3, "y": 3 }, { "x": 2, "y": 3 }, { "x": 1, "y": 4 }, { "x": 1, "y": 5 }, { "x": 1, "y": 6 }, { "x": 2, "y": 8 }, { "x": 2, "y": 7 }, { "x": 2, "y": 6 }, { "x": 2, "y": 5 }, { "x": 2, "y": 4 }, { "x": 3, "y": 4 }, { "x": 3, "y": 2 }, { "x": 4, "y": 1 }, { "x": 5, "y": 1 }, { "x": 6, "y": 1 }, { "x": 4, "y": 5 }, { "x": 5, "y": 6 }, { "x": 5, "y": 9 }, { "x": 5, "y": 10 }, { "x": 5, "y": 11 }, { "x": 6, "y": 11 }, { "x": 7, "y": 9 }, { "x": 7, "y": 11 }, { "x": 6, "y": 8 }, { "x": 9, "y": 8 }, { "x": 10, "y": 7 }, { "x": 11, "y": 5 }, { "x": 1, "y": 9 }] }
        },
        4: {
            "rampart": { "pos": [{ "x": 3, "y": 12 }, { "x": 4, "y": 12 }, { "x": 5, "y": 12 }, { "x": 6, "y": 12 }, { "x": 3, "y": 11 }, { "x": 2, "y": 11 }, { "x": 2, "y": 10 }, { "x": 1, "y": 10 }, { "x": 0, "y": 9 }, { "x": 0, "y": 8 }, { "x": 0, "y": 7 }, { "x": 0, "y": 6 }, { "x": 0, "y": 5 }, { "x": 0, "y": 4 }, { "x": 0, "y": 3 }, { "x": 1, "y": 3 }, { "x": 1, "y": 2 }, { "x": 2, "y": 2 }, { "x": 2, "y": 1 }, { "x": 3, "y": 1 }, { "x": 3, "y": 0 }, { "x": 4, "y": 0 }, { "x": 5, "y": 0 }, { "x": 6, "y": 0 }, { "x": 8, "y": 0 }, { "x": 9, "y": 0 }, { "x": 7, "y": 0 }, { "x": 9, "y": 1 }, { "x": 10, "y": 1 }, { "x": 10, "y": 2 }, { "x": 11, "y": 2 }, { "x": 11, "y": 3 }, { "x": 12, "y": 3 }, { "x": 12, "y": 4 }, { "x": 12, "y": 5 }, { "x": 12, "y": 6 }, { "x": 12, "y": 7 }, { "x": 12, "y": 8 }, { "x": 12, "y": 9 }, { "x": 11, "y": 10 }, { "x": 10, "y": 11 }, { "x": 9, "y": 12 }, { "x": 1, "y": 9 }, { "x": 7, "y": 12 }, { "x": 8, "y": 12 }, { "x": 9, "y": 11 }, { "x": 10, "y": 10 }, { "x": 11, "y": 9 }] }
        },
    }

    if (room.storage && room.memory.stage >= 4) {

        if (Game.time % 100 == 0) placeRamparts(ramparts)
    }

    function placeRamparts(ramparts) {

        if (!room.memory.stage || room.memory.stage < 4) return

        if (!room.storage || room.storage.store[RESOURCE_ENERGY] < 35000) return

        let collection

        for (let property in ramparts) {

            if (room.controller.level >= property) {

                collection = ramparts[property]
            }
        }

        if (!collection) return

        for (let structureType in collection) {
            for (let pos of collection[structureType].pos) {

                pos.x += anchorPoint.x - 6
                pos.y += anchorPoint.y - 6

                if (room.getTerrain().get(pos.x, pos.y) == TERRAIN_MASK_WALL) continue

                room.visual.circle(pos.x, pos.y, {
                    fill: '#4def52',
                    radius: 0.2,
                    strokeWidth: 0.125
                })

                if (findBuildingsOnPos(FIND_STRUCTURES, structureType, pos) || findBuildingsOnPos(FIND_MY_CONSTRUCTION_SITES, structureType, pos)) continue

                if (placedSites < 10 && room.createConstructionSite(pos.x, pos.y, structureType) == 0) placedSites++
            }
        }
    }

    function findBuildingsOnPos(constant, type, pos) {

        let building = room.find(constant, {
            filter: building => building.structureType == type && building.pos == pos
        })

        if (building.length > 0) return true

        return false
    }

    // Non bunker construction

    let sourceContainer1 = room.get("sourceContainer1")
    let sourceContainer2 = room.get("sourceContainer2")
    let controllerContainer = room.get("controllerContainer")

    let sourceLink1 = room.get("sourceLink1")
    let sourceLink2 = room.get("sourceLink2")
    let controllerLink = room.get("controllerLink")
    let baseLink = room.get("baseLink")

    if (room.memory.stage >= 2) {

        if (Game.time % 100 == 0) placeSourceContainers()
    }

    function placeSourceContainers() {

        let harvestPositions = [
            room.get("source1HarvestPositions"),
            room.get("source2HarvestPositions")
        ]

        let sourceContainers = [sourceContainer1, sourceContainer2]

        let i = 0

        for (let harvestPositionsObject of harvestPositions) {

            i++

            let closestHarvestPos = harvestPositionsObject.closest
            let sourceContainer = sourceContainers[i]

            if (!closestHarvestPos || sourceContainer) continue

            if (placedSites < 10 && room.createConstructionSite(closestHarvestPos.x, closestHarvestPos.y, STRUCTURE_CONTAINER) == 0) placedSites++
        }
    }

    if (room.memory.stage >= 4) placeSourceRoads()

    function placeSourceRoads() {

        let harvestPositions = [
            room.get("source1HarvestPositions"),
            room.get("source2HarvestPositions")
        ]

        let origin = room.get("anchorPoint")

        let roomPathDelay = 0

        for (let harvestPositionsObject of harvestPositions) {

            roomPathDelay++

            if (Game.time % (roomPathDelay + 101) != 0) return

            let goal = { pos: harvestPositionsObject.closest, range: 1 }

            if (origin && goal) {

                var path = PathFinder.search(origin, goal, {
                    plainCost: 4,
                    swampCost: 24,
                    maxRooms: 1,

                    roomCallback: function(roomName) {

                        let room = Game.rooms[roomName]

                        if (!room) return

                        let cm

                        cm = new PathFinder.CostMatrix

                        let roadConstructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                            filter: s => s.structureType == STRUCTURE_ROAD
                        })

                        for (let roadSite of roadConstructionSites) {

                            cm.set(roadSite.pos.x, roadSite.pos.y, 1)
                        }

                        let roads = room.find(FIND_STRUCTURES, {
                            filter: s => s.structureType == STRUCTURE_ROAD
                        })

                        for (let road of roads) {

                            cm.set(road.pos.x, road.pos.y, 1)
                        }

                        let constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                            filter: s => s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                        })

                        for (let site of constructionSites) {

                            cm.set(site.pos.x, site.pos.y, 255)
                        }

                        let structures = room.find(FIND_STRUCTURES, {
                            filter: s => s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                        })

                        for (let structure of structures) {

                            cm.set(structure.pos.x, structure.pos.y, 255)
                        }

                        return cm
                    }
                }).path

                room.visual.poly(path, { stroke: colors.neutralYellow, strokeWidth: .15, opacity: .2, lineStyle: 'normal' })

                for (let pos of path) {

                    if (placedSites < 10 && room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD) == 0) placedSites++
                }
            }
        }
    }

    function placeSourceLinks() {

        let harvestPositions = [
            room.get("source1HarvestPositions"),
            room.get("source2HarvestPositions")
        ]

        let sourceLinks = [sourceLink1, sourceLink2]

        let i = 0

        for (let harvestPositionsObject of harvestPositions) {

            i++

            let closestHarvestPos = harvestPositionsObject.closest
            let sourceLink = sourceLinks[i]

            if (!closestHarvestPos || sourceLink) continue

            /* if (placedSites < 10 && room.createConstructionSite(closestHarvestPos.x, closestHarvestPos.y, STRUCTURE_LINK) == 0) placedSites++ */
        }
    }

    placeControllerLink()

    function placeControllerLink() {

        if (Game.time % 100 != 0) return

        if (!controllerContainer) return

        if (placedSites < 10 && room.createConstructionSite(controllerContainer.x, controllerContainer.y, STRUCTURE_LINK) == 0) placedSites++
    }

    if (room.memory.stage >= 4 && room.memory.remoteRooms.length > 0) {

        let roomPathDelay = 0

        for (let roomMemory of room.memory.remoteRooms) {

            remoteRoom = Game.rooms[roomMemory.name]

            if (remoteRoom) placeRemotePaths(remoteRoom, roomPathDelay)
        }
    }

    function placeRemotePaths(remoteRoom, roomPathDelay) {

        sources = remoteRoom.find(FIND_SOURCES)

        for (let source of sources) {

            roomPathDelay++

            if (Game.time % (roomPathDelay + 103) != 0) return

            let origin = room.memory.anchorPoint

            let goal = { pos: source.pos, range: 1 }

            let avoidStages = ["enemyRoom", "keeperRoom", "enemyReservation"]

            let allowedRooms = {
                [room.name]: true
            }

            let route = Game.map.findRoute(room.name, goal.pos.roomName, {
                routeCallback(roomName) {

                    if (roomName == goal.pos.roomName) {

                        allowedRooms[roomName] = true
                        return 1

                    } else if (Memory.rooms[roomName] && !avoidStages.includes(Memory.rooms[roomName].stage)) {

                        allowedRooms[roomName] = true
                        return 1
                    }

                    allowedRooms[roomName] = false
                    return Infinity
                }
            })

            if (!route || route == ERR_NO_PATH || route.length < 1) return

            if (!origin || !goal) return

            var path = PathFinder.search(origin, goal, {
                plainCost: 4,
                swampCost: 24,
                maxOps: 100000,

                roomCallback: function(roomName) {

                    let room = Game.rooms[roomName]

                    if (!room) return false

                    if (!allowedRooms[roomName]) return false

                    let cm

                    cm = new PathFinder.CostMatrix

                    let roadConstructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                        filter: s => s.structureType == STRUCTURE_ROAD
                    })

                    for (let roadSite of roadConstructionSites) {

                        cm.set(roadSite.pos.x, roadSite.pos.y, 1)
                    }

                    let roads = room.find(FIND_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_ROAD
                    })

                    for (let road of roads) {

                        cm.set(road.pos.x, road.pos.y, 1)
                    }

                    let constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                        filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
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

                    return cm
                }
            }).path

            for (let pos of path) {

                let room = Game.rooms[pos.roomName]
                room.visual.rect(pos.x - 0.5, pos.y - 0.5, 1, 1, { fill: "transparent", stroke: "#45C476" })

                room.createConstructionSite(pos.x, pos.y, STRUCTURE_ROAD)

                if (pos.roomName != remoteRoom.name || pos != path[path.length - 1]) continue

                let containerConstructionSites = room.find(FIND_CONSTRUCTION_SITES, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER
                })

                let containers = room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER
                })

                if (source.pos.findInRange(containerConstructionSites, 1) > 0 || source.pos.findInRange(containers, 1) > 0) break

                room.visual.rect(pos.x - 0.5, pos.y - 0.5, 1, 1, { fill: "transparent", stroke: "red" })

                room.createConstructionSite(pos.x, pos.y, STRUCTURE_CONTAINER)
            }
        }
    }

    removeUneeded()

    function removeUneeded() {

        if (Game.time % 100 != 0) return

        if (baseLink && controllerLink && controllerContainer) controllerContainer.destroy()

        /* if (sourceContainer1 && sourceLink1) sourceContainer1.destroy()

        if (sourceContainer2 && sourceLink2) sourceContainer2.destroy() */

        let walls = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_WALL
        })

        for (let structure of walls) structure.destroy()

        let hostileStructures = room.find(FIND_HOSTILE_STRUCTURES, {
            filter: s => s.owner && !s.my
        })

        for (let structure of hostileStructures) structure.destroy()
    }
}

module.exports = roomPlanner