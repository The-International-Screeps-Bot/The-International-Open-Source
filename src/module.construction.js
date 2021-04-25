module.exports = {
    run: function construction() {
        _.forEach(Game.rooms, function(room) {

            //destroySite()
            //destroyRoad()
            //destroyStructure()
            
            function destroySite() {

                let roomConstructionSite = room.find(FIND_CONSTRUCTION_SITES)

                if (room) {

                    for (let cSite of roomConstructionSite) {

                        cSite.remove()
                    }
                }
            }

            function destroyRoad() {

                let roads = room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_ROAD
                })

                if (room.name == "E31N14") {

                    for (let road of roads) {

                        road.destroy()
                    }
                }
            }

            function destroyStructure() {

                let roads = room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_WALL || s.structureType == STRUCTURE_RAMPART
                })

                if (room) {

                    for (let road of roads) {

                        road.destroy()
                    }
                }
            }

            if (room.controller && room.controller.my) {

                doDistanceTransform()

                function doDistanceTransform() {

                    let ticks = 0
                    let totalCpu = 0
                    let totalTime = 0

                    let roomName = room.name
                    let time = (new Date()).getMilliseconds()
                    let cpu = Game.cpu.getUsed
                    
                    const cm = new PathFinder.CostMatrix()
                    
                    let anchorPoint = room.memory.anchorPoint
                    var anchorPoints = []
    
                    if (!anchorPoint) {    
                    
                        var dt = distanceTransform(walkablePixelsForRoom(roomName));
                        displayCostMatrix(roomName, cm, anchorPoints);
                        filterAnchorPoints(anchorPoints)
                    }
                    
                    cm._bits = dt
                    
                    roomPlanner(roomName, cm, anchorPoint)
                    
                    time = (new Date()).getMilliseconds() - time
                    cpu = Game.cpu.getUsed() - cpu
                    ticks++
                    totalCpu += cpu
                    totalTime += time
                    console.log(`dt for ${roomName} took ${time}ms (avg ${totalTime/ticks}) ${cpu}cpu (avg ${totalCpu/ticks})`)

                    /**
                        @param {Number[2500]} array - one entry per square in the room
                        @param {Number} oob - value used for pixels outside image bounds
                        @return {Number[2500]}
                
                        the oob parameter is used so that if an object pixel is at the image boundary
                        you can avoid having that reduce the pixel's value in the final output. Set
                        it to a high value (e.g., 255) for this. Set oob to 0 to treat out of bounds
                        as background pixels.
                    */
                        function distanceTransform(array, oob = 255) {
                            // Variables to represent the 3x3 neighborhood of a pixel.
                            var A, B, C;
                            var D, E, F;
                            var G, H, I;
    
                            var n, value;
                            for (n = 0; n < 2500; n++) {
                                if (array[n] !== 0) {
                                    A = array[n - 51];
                                    B = array[n - 1];
                                    D = array[n - 50];
                                    G = array[n - 49];
                                    if (n % 50 == 0) { A = oob;
                                        B = oob; }
                                    if (n % 50 == 49) { G = oob; }
                                    if (~~(n / 50) == 0) { A = oob;
                                        D = oob;
                                        G = oob; }
    
                                    array[n] = (Math.min(A, B, D, G, 254) + 1);
                                }
                            }
    
                            for (n = 2499; n >= 0; n--) {;
                                C = array[n + 49];;
                                E = array[n];
                                F = array[n + 50];;
                                H = array[n + 1];
                                I = array[n + 51];
                                if (n % 50 == 0) { C = oob; }
                                if (n % 50 == 49) { H = oob;
                                    I = oob; }
                                if (~~(n / 50) == 49) { C = oob;
                                    F = oob;
                                    I = oob; }
    
                                value = Math.min(C + 1, E, F + 1, H + 1, I + 1);
                                array[n] = (value);
                            }
    
                            return array;
                        }
    
                        /**
                            @param {string} roomName
                            @return {Number[2500]}
                        */
                        function walkablePixelsForRoom(roomName) {
                            var array = new Uint8Array(2500);
                            for (var x = 0; x < 50; ++x) {
                                for (var y = 0; y < 50; ++y) {
                                    if (Game.map.getRoomTerrain(roomName).get(x, y) == '0' || Game.map.getRoomTerrain(roomName).get(x, y) == '2') {
                                        array[x * 50 + y] = 1;
                                    } else {
                                        array[x * 50 + y] = 0;
                                    }
                                }
                            }
                            return array;
                        }
    
                        function displayCostMatrix(roomName, costMatrix) {
                            var vis = Game.rooms[roomName].visual;
    
                            const array = costMatrix._bits;
    
                            //var max = _.max(array);
    
                            for (var x = 0; x < 50; ++x) {
                                for (var y = 0; y < 50; ++y) {
                                    var value = array[x * 50 + y];
                                    if (value > 0) {
                                        /*
                                        vis.circle(x, y, {radius:array[x*50+y] / 10, fill: "green"})
                                        vis.text((array[x*50+y]).toFixed(0), x, y, {font: 0.3})
                                        */
                                    }
                                    if (value >= 7) {
    
                                        let exits = room.find(FIND_EXIT)
                                        let tooClose = false
    
                                        for (let exit of exits) {
                                            if (exit.getRangeTo(x, y) < 10) {
    
                                                tooClose = true
                                                break
                                            }
                                        }
                                        if (tooClose == false) {
    
    
                                            vis.circle(x, y, { radius: array[x * 50 + y] / 10, fill: "green" })
                                            vis.text((array[x * 50 + y]).toFixed(0), x, y, { font: 0.3 })
    
                                            anchorPoints.push(new RoomPosition(x, y, room.name))
                                        }
                                    }
                                }
                            }
                        }
    
                        function filterAnchorPoints(anchorPoints) {
    
                            let startPoint = room.controller.pos
    
                            room.memory.anchorPoint = startPoint.findClosestByRange(anchorPoints)
                        }

                    function roomPlanner(roomName, costMatrix, anchorPoint) {

                        var vis = Game.rooms[roomName].visual;

                        if (anchorPoint && anchorPoint != null) {

                            vis.rect(anchorPoint.x - 6.5, anchorPoint.y - 6.5, 13, 13, { fill: "transparent", stroke: "#45C476" })

                            vis.rect(anchorPoint.x - 0.5, anchorPoint.y - 0.5, 1, 1, { fill: "transparent", stroke: "#45C476", strokeWidth: "0.15" })

                            //console.log(anchorPoint.x + "," + anchorPoint.y)

                            let base = {
                                "road": {
                                    "pos": [{ "x": 1, "y": 2 }, { "x": 2, "y": 1 }, { "x": 3, "y": 1 }, { "x": 4, "y": 1 }, { "x": 5, "y": 1 }, { "x": 6, "y": 1 }, { "x": 7, "y": 2 }, { "x": 8, "y": 1 }, { "x": 13, "y": 2 }, { "x": 1, "y": 5 }, { "x": 1, "y": 6 }, { "x": 13, "y": 6 }, { "x": 13, "y": 5 }, { "x": 13, "y": 4 }, { "x": 13, "y": 3 }, { "x": 7, "y": 7 }, { "x": 7, "y": 6 }, { "x": 7, "y": 5 }, { "x": 7, "y": 4 }, { "x": 7, "y": 3 }, { "x": 1, "y": 7 }, { "x": 13, "y": 7 }, { "x": 9, "y": 1 }, { "x": 10, "y": 1 }, { "x": 11, "y": 1 }, { "x": 12, "y": 1 }, { "x": 1, "y": 4 }, { "x": 1, "y": 3 }, { "x": 8, "y": 8 }, { "x": 9, "y": 8 }, { "x": 10, "y": 8 }, { "x": 11, "y": 8 }, { "x": 12, "y": 8 }, { "x": 13, "y": 9 }, { "x": 13, "y": 10 }, { "x": 13, "y": 11 }, { "x": 11, "y": 12 }, { "x": 10, "y": 12 }, { "x": 9, "y": 12 }, { "x": 8, "y": 12 }, { "x": 6, "y": 12 }, { "x": 5, "y": 12 }, { "x": 4, "y": 12 }, { "x": 3, "y": 12 }, { "x": 1, "y": 10 }, { "x": 1, "y": 9 }, { "x": 1, "y": 11 }, { "x": 2, "y": 12 }, { "x": 12, "y": 12 }, { "x": 9, "y": 9 }, { "x": 9, "y": 10 }, { "x": 9, "y": 11 }, { "x": 5, "y": 8 }, { "x": 6, "y": 8 }, { "x": 4, "y": 9 }, { "x": 3, "y": 10 }, { "x": 7, "y": 8 }, { "x": 7, "y": 11 }, { "x": 2, "y": 8 }]
                                },
                                "storage": {
                                    "pos": [{ "x": 8, "y": 9 }]
                                },
                                "link": {
                                    "pos": [{ "x": 7, "y": 9 }]
                                },
                                "terminal": {
                                    "pos": [{ "x": 6, "y": 9 }]
                                },
                                "lab": {
                                    "pos": [{ "x": 5, "y": 9 }, { "x": 5, "y": 10 }, { "x": 4, "y": 10 }, { "x": 4, "y": 11 }, { "x": 3, "y": 11 }, { "x": 2, "y": 10 }, { "x": 2, "y": 9 }, { "x": 3, "y": 9 }, { "x": 3, "y": 8 }, { "x": 4, "y": 8 }]
                                },
                                "tower": {
                                    "pos": [{ "x": 10, "y": 6 }, { "x": 10, "y": 3 }, { "x": 4, "y": 3 }, { "x": 4, "y": 6 }, { "x": 12, "y": 11 }, { "x": 2, "y": 11 }]
                                },
                                "extension": {
                                    "pos": [{ "x": 8, "y": 3 }, { "x": 8, "y": 2 }, { "x": 12, "y": 3 }, { "x": 12, "y": 2 }, { "x": 11, "y": 4 }, { "x": 10, "y": 4 }, { "x": 9, "y": 4 }, { "x": 8, "y": 4 }, { "x": 8, "y": 5 }, { "x": 12, "y": 4 }, { "x": 12, "y": 5 }, { "x": 9, "y": 2 }, { "x": 11, "y": 2 }, { "x": 9, "y": 5 }, { "x": 10, "y": 5 }, { "x": 11, "y": 5 }, { "x": 8, "y": 6 }, { "x": 12, "y": 6 }, { "x": 8, "y": 7 }, { "x": 9, "y": 7 }, { "x": 12, "y": 7 }, { "x": 11, "y": 7 }, { "x": 6, "y": 6 }, { "x": 6, "y": 5 }, { "x": 5, "y": 5 }, { "x": 4, "y": 5 }, { "x": 3, "y": 5 }, { "x": 2, "y": 5 }, { "x": 2, "y": 4 }, { "x": 3, "y": 4 }, { "x": 4, "y": 4 }, { "x": 5, "y": 4 }, { "x": 6, "y": 4 }, { "x": 6, "y": 3 }, { "x": 6, "y": 2 }, { "x": 5, "y": 2 }, { "x": 2, "y": 3 }, { "x": 2, "y": 2 }, { "x": 3, "y": 2 }, { "x": 2, "y": 6 }, { "x": 2, "y": 7 }, { "x": 3, "y": 7 }, { "x": 6, "y": 7 }, { "x": 5, "y": 7 }, { "x": 12, "y": 9 }, { "x": 12, "y": 10 }, { "x": 10, "y": 11 }, { "x": 11, "y": 11 }]
                                },
                                "spawn": {
                                    "pos": [{ "x": 11, "y": 9 }, { "x": 10, "y": 10 }, { "x": 8, "y": 10 }]
                                },
                                "observer": {
                                    "pos": [{ "x": 5, "y": 11 }]
                                },
                                "powerSpawn": {
                                    "pos": [{ "x": 6, "y": 11 }]
                                },
                                "factory": {
                                    "pos": [{ "x": 8, "y": 11 }]
                                },
                                "nuker": {
                                    "pos": [{ "x": 6, "y": 10 }]
                                }
                                /*,
                                                        "container": {
                                                            "pos": [{ "x": 10, "y": 9 }, { "x": 10, "y": 7 }, { "x": 10, "y": 2 }, { "x": 4, "y": 2 }, { "x": 4, "y": 7 }]
                                                        }*/
                            }

                            let barriers = {
                                "constructedWall": {
                                    "pos": [{ "x": 1, "y": 2 }, { "x": 2, "y": 1 }, { "x": 4, "y": 1 }, { "x": 6, "y": 1 }, { "x": 8, "y": 1 }, { "x": 10, "y": 1 }, { "x": 12, "y": 1 }, { "x": 1, "y": 12 }, { "x": 1, "y": 10 }, { "x": 1, "y": 8 }, { "x": 1, "y": 6 }, { "x": 1, "y": 4 }, { "x": 14, "y": 1 }, { "x": 16, "y": 1 }, { "x": 18, "y": 1 }, { "x": 19, "y": 2 }, { "x": 19, "y": 4 }, { "x": 19, "y": 6 }, { "x": 19, "y": 8 }, { "x": 19, "y": 12 }, { "x": 19, "y": 10 }, { "x": 1, "y": 16 }, { "x": 1, "y": 14 }, { "x": 1, "y": 18 }, { "x": 2, "y": 19 }, { "x": 4, "y": 19 }, { "x": 6, "y": 19 }, { "x": 8, "y": 19 }, { "x": 10, "y": 19 }, { "x": 12, "y": 19 }, { "x": 14, "y": 19 }, { "x": 16, "y": 19 }, { "x": 18, "y": 19 }, { "x": 19, "y": 18 }, { "x": 19, "y": 16 }, { "x": 19, "y": 14 }, { "x": 18, "y": 17 }, { "x": 17, "y": 18 }, { "x": 18, "y": 15 }, { "x": 18, "y": 13 }, { "x": 18, "y": 11 }, { "x": 18, "y": 9 }, { "x": 18, "y": 7 }, { "x": 18, "y": 5 }, { "x": 18, "y": 3 }, { "x": 17, "y": 2 }, { "x": 15, "y": 2 }, { "x": 13, "y": 2 }, { "x": 11, "y": 2 }, { "x": 9, "y": 2 }, { "x": 7, "y": 2 }, { "x": 5, "y": 2 }, { "x": 3, "y": 2 }, { "x": 2, "y": 3 }, { "x": 2, "y": 5 }, { "x": 2, "y": 7 }, { "x": 2, "y": 9 }, { "x": 2, "y": 11 }, { "x": 2, "y": 13 }, { "x": 2, "y": 15 }, { "x": 2, "y": 17 }, { "x": 3, "y": 18 }, { "x": 5, "y": 18 }, { "x": 7, "y": 18 }, { "x": 9, "y": 18 }, { "x": 11, "y": 18 }, { "x": 13, "y": 18 }, { "x": 15, "y": 18 }]
                                },
                                "rampart": {
                                    "pos": [{ "x": 13, "y": 1 }, { "x": 1, "y": 13 }, { "x": 1, "y": 11 }, { "x": 1, "y": 9 }, { "x": 1, "y": 7 }, { "x": 1, "y": 5 }, { "x": 1, "y": 3 }, { "x": 1, "y": 1 }, { "x": 3, "y": 1 }, { "x": 5, "y": 1 }, { "x": 7, "y": 1 }, { "x": 9, "y": 1 }, { "x": 11, "y": 1 }, { "x": 19, "y": 1 }, { "x": 17, "y": 1 }, { "x": 15, "y": 1 }, { "x": 1, "y": 15 }, { "x": 1, "y": 17 }, { "x": 1, "y": 19 }, { "x": 3, "y": 19 }, { "x": 5, "y": 19 }, { "x": 7, "y": 19 }, { "x": 9, "y": 19 }, { "x": 11, "y": 19 }, { "x": 13, "y": 19 }, { "x": 19, "y": 3 }, { "x": 19, "y": 5 }, { "x": 19, "y": 7 }, { "x": 19, "y": 9 }, { "x": 19, "y": 11 }, { "x": 19, "y": 13 }, { "x": 19, "y": 15 }, { "x": 19, "y": 17 }, { "x": 19, "y": 19 }, { "x": 17, "y": 19 }, { "x": 15, "y": 19 }, { "x": 18, "y": 18 }, { "x": 18, "y": 16 }, { "x": 16, "y": 18 }, { "x": 14, "y": 18 }, { "x": 12, "y": 18 }, { "x": 10, "y": 18 }, { "x": 8, "y": 18 }, { "x": 6, "y": 18 }, { "x": 4, "y": 18 }, { "x": 2, "y": 18 }, { "x": 18, "y": 14 }, { "x": 18, "y": 12 }, { "x": 18, "y": 10 }, { "x": 18, "y": 8 }, { "x": 18, "y": 6 }, { "x": 18, "y": 4 }, { "x": 18, "y": 2 }, { "x": 2, "y": 16 }, { "x": 2, "y": 14 }, { "x": 2, "y": 12 }, { "x": 2, "y": 10 }, { "x": 2, "y": 8 }, { "x": 2, "y": 6 }, { "x": 2, "y": 4 }, { "x": 2, "y": 2 }, { "x": 4, "y": 2 }, { "x": 6, "y": 2 }, { "x": 8, "y": 2 }, { "x": 10, "y": 2 }, { "x": 12, "y": 2 }, { "x": 14, "y": 2 }, { "x": 16, "y": 2 }]
                                }
                            }

                            _.forEach(Object.keys(base), function(structureType) {
                                _.forEach(base[structureType].pos, function(pos) {

                                    pos.x += anchorPoint.x - 7
                                    pos.y += anchorPoint.y - 7

                                    //console.log(pos.x + "," + pos.y)
                                    //console.log(structureType)
                                    
                                    if (structureType == "road" && room.controller.level <= 4) {
                                        
                                        
                                    }
                                    else if (structureType == "link" && room.controller.level <= 6) {
                                        
                                        
                                    }
                                    else {
                                        
                                        room.createConstructionSite(pos.x, pos.y, structureType);
                                    }
                                    
                                    /*
                                    if (structureType == "road") {
                                        
                                        room.visual.circle(pos.x, pos.y, {
                                            fill: 'transparent',
                                            radius: 0.4,
                                            stroke: '#FCFEFF',
                                            strokeWidth: 0.125
                                        })
                                    }
                                    else if (structureType == "extension") {
                                        
                                        room.visual.circle(pos.x, pos.y, {
                                            fill: 'transparent',
                                            radius: 0.4,
                                            stroke: '#F4E637',
                                            strokeWidth: 0.125
                                        })
                                    }
                                    else if (structureType == "tower") {
                                        
                                        room.visual.circle(pos.x, pos.y, {
                                            fill: 'transparent',
                                            radius: 0.4,
                                            stroke: '#FE411E',
                                            strokeWidth: 0.125
                                        })
                                    }
                                    else if (structureType == "container") {
                                        
                                        room.visual.circle(pos.x, pos.y, {
                                            fill: 'transparent',
                                            radius: 0.4,
                                            stroke: '#747575',
                                            strokeWidth: 0.125
                                        })
                                    }
                                    else if (structureType == "spawn") {
                                        
                                        room.visual.circle(pos.x, pos.y, {
                                            fill: 'transparent',
                                            radius: 0.4,
                                            stroke: '#FE8F00',
                                            strokeWidth: 0.125
                                        })
                                    }
                                    else if (structureType == "lab") {
                                        
                                        room.visual.circle(pos.x, pos.y, {
                                            fill: 'transparent',
                                            radius: 0.4,
                                            stroke: '#B6B7B8',
                                            strokeWidth: 0.125
                                        })
                                    }
                                    else {
                                        
                                        room.visual.circle(pos.x, pos.y, {
                                            fill: 'transparent',
                                            radius: 0.4,
                                            stroke: '#B03CBD',
                                            strokeWidth: 0.125
                                        })
                                    }
                                    */
                                })
                            })
                            _.forEach(Object.keys(barriers), function(structureType) {
                                _.forEach(barriers[structureType].pos, function(pos) {

                                    pos.x += anchorPoint.x - 10
                                    pos.y += anchorPoint.y - 10

                                    //console.log(pos.x + "," + pos.y)
                                    //console.log(structureType)

                                    if (room.controller.level >= 2 && room.controller.level <= 5) {

                                        if (structureType != "rampart") {

                                            room.createConstructionSite(pos.x, pos.y, structureType);
                                        }
                                    } else if (room.controller.level >= 6 && room.storage.store[RESOURCE_ENERGY] >= 20000) {

                                        room.createConstructionSite(pos.x, pos.y, structureType);
                                    }
                                    /*
                                    if (structureType == "rampart") {
                                        
                                        room.visual.circle(pos.x, pos.y, {
                                            fill: 'transparent',
                                            radius: 0.4,
                                            stroke: '#FCFEFF',
                                            strokeWidth: 0.125
                                        })
                                    }
                                    else {
                                        
                                        room.visual.circle(pos.x, pos.y, {
                                            fill: 'transparent',
                                            radius: 0.4,
                                            stroke: '#B03CBD',
                                            strokeWidth: 0.125
                                        })
                                    }
                                    */
                                })
                            })
                        }
                    }
                }
                
                if (room.controller.level >= 5) {
                
                    sourcePath()
                    controllerPath()
                    mineralPath()
                    //towerPath()
                    remotePath()
                
                }

                function sourcePath() {

                    let sources = room.find(FIND_SOURCES)

                    for (let inactiveSource of sources) {

                        let origin = room.find(FIND_MY_SPAWNS)[0]

                        let goal = _.map([inactiveSource], function(source) {
                            return { pos: source.pos, range: 1 }
                        })

                        //console.log(JSON.stringify(goal))
                        if (origin && goal) {

                            var path = PathFinder.search(origin.pos, goal, {
                                plainCost: 2,

                                roomCallback: function(roomName) {

                                    let room = Game.rooms[roomName]

                                    if (!room) return

                                    let costs = new PathFinder.CostMatrix

                                    room.find(FIND_STRUCTURES).forEach(function(struct) {
                                        if (struct.structureType === STRUCTURE_ROAD) {

                                            costs.set(struct.pos.x, struct.pos.y, 1)

                                        } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                            costs.set(struct.pos.x, struct.pos.y, 0xff)

                                        }
                                    })
                                    room.find(FIND_CONSTRUCTION_SITES).forEach(function(struct) {
                                    if (struct.structureType === STRUCTURE_ROAD) {

                                        costs.set(struct.pos.x, struct.pos.y, 1)

                                    } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                        costs.set(struct.pos.x, struct.pos.y, 0xff)

                                    }
                                })

                                    return costs

                                }
                            }).path

                            new RoomVisual(room.name).poly(path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
                            
                            for (let i = 0; i < path.length; i++) {
                                
                                let value = path[i - 1]
                                
                                if (value) {
                                
                                    room.createConstructionSite(value.x, value.y, STRUCTURE_ROAD)
                                }
                            }
                        }
                    }
                }

                function controllerPath() {

                    let origin = room.find(FIND_MY_SPAWNS)[0]

                    let goal = _.map([room.controller], function(controller) {
                        return { pos: controller.pos, range: 2 }
                    })

                    if (origin && goal) {

                        var path = PathFinder.search(origin.pos, goal, {
                            plainCost: 2,

                            roomCallback: function(roomName) {

                                let room = Game.rooms[roomName]

                                if (!room) return

                                let costs = new PathFinder.CostMatrix

                                room.find(FIND_STRUCTURES).forEach(function(struct) {
                                    if (struct.structureType === STRUCTURE_ROAD) {

                                        costs.set(struct.pos.x, struct.pos.y, 1)

                                    } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                        costs.set(struct.pos.x, struct.pos.y, 0xff)

                                    }
                                })
                                room.find(FIND_CONSTRUCTION_SITES).forEach(function(struct) {
                                    if (struct.structureType === STRUCTURE_ROAD) {

                                        costs.set(struct.pos.x, struct.pos.y, 1)

                                    } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                        costs.set(struct.pos.x, struct.pos.y, 0xff)

                                    }
                                })

                                return costs

                            }
                        }).path

                        new RoomVisual(room.name).poly(path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
                            
                            for (let i = 0; i < path.length; i++) {
                                
                                let value = path[i]
                                
                                if (value) {
                                
                                    room.createConstructionSite(value.x, value.y, STRUCTURE_ROAD)
                                }
                            }
                    }
                }

                function mineralPath() {

                    let origin = room.find(FIND_MY_SPAWNS)[0]

                    let goal = _.map(room.find(FIND_MINERALS), function(mineral) {
                        return { pos: mineral.pos, range: 1 }
                    })

                    if (origin && goal) {

                        var path = PathFinder.search(origin.pos, goal, {
                            plainCost: 2,

                            roomCallback: function(roomName) {

                                let room = Game.rooms[roomName]

                                if (!room) return

                                let costs = new PathFinder.CostMatrix

                                room.find(FIND_STRUCTURES).forEach(function(struct) {
                                    if (struct.structureType === STRUCTURE_ROAD) {

                                        costs.set(struct.pos.x, struct.pos.y, 1)

                                    } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                        costs.set(struct.pos.x, struct.pos.y, 0xff)

                                    }
                                })
                                room.find(FIND_CONSTRUCTION_SITES).forEach(function(struct) {
                                    if (struct.structureType === STRUCTURE_ROAD) {

                                        costs.set(struct.pos.x, struct.pos.y, 1)

                                    } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {

                                        costs.set(struct.pos.x, struct.pos.y, 0xff)

                                    }
                                })

                                return costs

                            }
                        }).path

                        new RoomVisual(room.name).poly(path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
                            
                            for (let i = 0; i < path.length; i++) {
                                
                                let value = path[i - 1]
                                
                                if (value) {
                                
                                    room.createConstructionSite(value.x, value.y, STRUCTURE_ROAD)
                                }
                            }
                    }
                }

                function towerPath() {


                }

                function remotePath() {

                    let remoteRooms = room.memory.remoteRooms

                    for (let object of remoteRooms) {

                        remoteRoom = Game.rooms[object.name]

                        if (remoteRoom) {
                            
                            sources = remoteRoom.find(FIND_SOURCES)
                            
                            for (let inactiveSource of sources) {

                                let origin = room.find(FIND_MY_SPAWNS)[0]
        
                                let goal = _.map([inactiveSource], function(source) {
                                    return { pos: source.pos, range: 1 }
                                })
        
                                //console.log(JSON.stringify(goal))
                                if (origin && goal) {
    
                                    var path = PathFinder.search(origin.pos, goal, {
                                        plainCost: 2,
                                        
                                        roomCallback: function(roomName) {
    
                                            let room = Game.rooms[roomName]
                                            
                                            if (room) {
                                            
                                            let costs = new PathFinder.CostMatrix
    
                                            room.find(FIND_STRUCTURES).forEach(function(struct) {
                                                if (struct.structureType === STRUCTURE_ROAD) {
    
                                                    costs.set(struct.pos.x, struct.pos.y, 1)
    
                                                } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {
    
                                                    costs.set(struct.pos.x, struct.pos.y, 0xff)
    
                                                }
                                            })
                                            room.find(FIND_CONSTRUCTION_SITES).forEach(function(struct) {
                                                if (struct.structureType === STRUCTURE_ROAD) {
            
                                                    costs.set(struct.pos.x, struct.pos.y, 1)
            
                                                } else if (struct.structureType !== STRUCTURE_CONTAINER && (struct.structureType !== STRUCTURE_RAMPART || !struct.my)) {
            
                                                    costs.set(struct.pos.x, struct.pos.y, 0xff)
            
                                                }
                                            })
    
                                            return costs
                                            }
                                        }
                                    }).path
    
                                    //console.log(JSON.stringify(path))
                                    
                                    //new RoomVisual(room.name).poly(path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })
                                
                                    for (let i = 0; i < path.length; i++) {
                                        
                                        let value = path[i - 1]
                                        
                                        if (value) {
                                        
                                            Game.rooms[value.roomName].createConstructionSite(value.x, value.y, STRUCTURE_ROAD)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
    }
};