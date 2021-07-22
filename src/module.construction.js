module.exports = {
    run: function construction() {
        _.forEach(Game.rooms, function(room) {

            //destroySite()

            //removeAllSites()

            //destroyStructure()

            //resetRoom()

            function destroySite() {

                let roomConstructionSite = room.find(FIND_MY_CONSTRUCTION_SITES)

                if (room) {

                    for (let cSite of roomConstructionSite) {

                        cSite.remove()
                    }
                }
            }

            function removeAllSites() {

                for (let value in Game.constructionSites) {

                    let cSite = Game.constructionSites[value]

                    cSite.remove()
                }
            }

            function destroyStructure() {

                let roads = room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_EXTENSION || s.structureType == STRUCTURE_TOWER || s.structureType == STRUCTURE_TERMINAL
                })

                let barricades = room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_WALL
                })

                if (room.name == "E25N11") {

                    for (let structure of roads) {

                        structure.destroy()
                    }
                }
            }

            function resetRoom() {

                let structures = room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType != STRUCTURE_SPAWN
                })

                if (room.name == "E25N11") {

                    for (let structure of structures) {

                        structure.destroy()
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
                        /*
                        let time = (new Date()).getMilliseconds()
                        let cpu = Game.cpu.getUsed()
                        time = (new Date()).getMilliseconds() - time
                        cpu = Game.cpu.getUsed() - cpu
                        ticks++
                        totalCpu += cpu
                        totalTime += time
                        */

                    var anchorPoints = []
                    let anchorPoint = room.memory.anchorPoint
                    let cm = new PathFinder.CostMatrix()

                    if (anchorPoint == null) {

                        var dt = distanceTransform(walkablePixelsForRoom(roomName))
                        cm._bits = dt
                        displayCostMatrix(roomName, cm, anchorPoints)
                        filterAnchorPoints(anchorPoints)
                    }

                    roomPlanner(roomName, anchorPoint)

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
                                if (n % 50 == 0) {
                                    A = oob;
                                    B = oob;
                                }
                                if (n % 50 == 49) { G = oob; }
                                if (~~(n / 50) == 0) {
                                    A = oob;
                                    D = oob;
                                    G = oob;
                                }

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
                            if (n % 50 == 49) {
                                H = oob;
                                I = oob;
                            }
                            if (~~(n / 50) == 49) {
                                C = oob;
                                F = oob;
                                I = oob;
                            }

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

                                    vis.circle(x, y, { radius: array[x * 50 + y] / 10, fill: "green" })
                                    vis.text((array[x * 50 + y]).toFixed(0), x, y, { font: 0.3 })

                                }
                                if (value >= 6) {

                                    let exits = room.find(FIND_EXIT)
                                    let tooClose = false

                                    for (let exit of exits) {
                                        if (exit.getRangeTo(x, y) < 11) {

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

                    function roomPlanner(roomName, anchorPoint) {

                        var vis = Game.rooms[roomName].visual;

                        if (anchorPoint && anchorPoint != null) {

                            vis.rect(anchorPoint.x - 5.5, anchorPoint.y - 5.5, 11, 11, { fill: "transparent", stroke: "#45C476" })

                            vis.rect(anchorPoint.x - 0.5, anchorPoint.y - 0.5, 1, 1, { fill: "transparent", stroke: "#45C476", strokeWidth: "0.15" })

                            //console.log(anchorPoint.x + "," + anchorPoint.y)

                            let base = {
                                "spawn": { "pos": [{ "x": 6, "y": 8 }, { "x": 7, "y": 8 }, { "x": 6, "y": 9 }] },
                                "extension": { "pos": [{ "x": 1, "y": 2 }, { "x": 1, "y": 3 }, { "x": 2, "y": 3 }, { "x": 2, "y": 1 }, { "x": 3, "y": 2 }, { "x": 4, "y": 2 }, { "x": 5, "y": 1 }, { "x": 1, "y": 1 }, { "x": 5, "y": 3 }, { "x": 6, "y": 2 }, { "x": 6, "y": 3 }, { "x": 6, "y": 1 }, { "x": 1, "y": 5 }, { "x": 1, "y": 4 }, { "x": 2, "y": 4 }, { "x": 2, "y": 6 }, { "x": 3, "y": 6 }, { "x": 3, "y": 5 }, { "x": 4, "y": 5 }, { "x": 4, "y": 6 }, { "x": 5, "y": 6 }, { "x": 5, "y": 4 }, { "x": 6, "y": 4 }, { "x": 6, "y": 5 }, { "x": 8, "y": 10 }, { "x": 7, "y": 10 }, { "x": 6, "y": 10 }, { "x": 4, "y": 1 }, { "x": 8, "y": 9 }, { "x": 10, "y": 11 }, { "x": 11, "y": 11 }, { "x": 11, "y": 10 }, { "x": 11, "y": 9 }, { "x": 10, "y": 9 }, { "x": 9, "y": 10 }, { "x": 4, "y": 11 }, { "x": 4, "y": 10 }, { "x": 2, "y": 11 }, { "x": 2, "y": 10 }, { "x": 2, "y": 9 }, { "x": 3, "y": 9 }] },
                                "tower": { "pos": [{ "x": 8, "y": 1 }, { "x": 1, "y": 7 }, { "x": 11, "y": 7 }, { "x": 3, "y": 1 }, { "x": 3, "y": 11 }, { "x": 9, "y": 11 }] },
                                "road": { "pos": [{ "x": 0, "y": 8 }, { "x": 0, "y": 5 }, { "x": 0, "y": 4 }, { "x": 0, "y": 3 }, { "x": 0, "y": 2 }, { "x": 0, "y": 1 }, { "x": 1, "y": 0 }, { "x": 2, "y": 0 }, { "x": 3, "y": 0 }, { "x": 4, "y": 0 }, { "x": 5, "y": 0 }, { "x": 7, "y": 0 }, { "x": 8, "y": 0 }, { "x": 9, "y": 0 }, { "x": 0, "y": 9 }, { "x": 10, "y": 0 }, { "x": 0, "y": 10 }, { "x": 0, "y": 7 }, { "x": 0, "y": 6 }, { "x": 6, "y": 0 }, { "x": 0, "y": 11 }, { "x": 1, "y": 12 }, { "x": 2, "y": 12 }, { "x": 3, "y": 12 }, { "x": 4, "y": 12 }, { "x": 5, "y": 12 }, { "x": 6, "y": 12 }, { "x": 7, "y": 12 }, { "x": 8, "y": 12 }, { "x": 9, "y": 12 }, { "x": 10, "y": 12 }, { "x": 12, "y": 10 }, { "x": 12, "y": 9 }, { "x": 12, "y": 8 }, { "x": 12, "y": 7 }, { "x": 12, "y": 6 }, { "x": 12, "y": 5 }, { "x": 12, "y": 4 }, { "x": 12, "y": 3 }, { "x": 12, "y": 2 }, { "x": 12, "y": 1 }, { "x": 11, "y": 12 }, { "x": 12, "y": 11 }, { "x": 11, "y": 0 }, { "x": 2, "y": 5 }, { "x": 3, "y": 4 }, { "x": 2, "y": 2 }, { "x": 4, "y": 3 }, { "x": 3, "y": 3 }, { "x": 4, "y": 4 }, { "x": 5, "y": 2 }, { "x": 5, "y": 5 }, { "x": 6, "y": 6 }, { "x": 9, "y": 2 }, { "x": 10, "y": 3 }, { "x": 11, "y": 4 }, { "x": 7, "y": 5 }, { "x": 7, "y": 4 }, { "x": 7, "y": 2 }, { "x": 7, "y": 3 }, { "x": 7, "y": 1 }, { "x": 2, "y": 7 }, { "x": 3, "y": 7 }, { "x": 7, "y": 7 }, { "x": 10, "y": 7 }, { "x": 11, "y": 6 }, { "x": 8, "y": 8 }, { "x": 7, "y": 9 }, { "x": 9, "y": 6 }, { "x": 6, "y": 7 }, { "x": 1, "y": 6 }, { "x": 5, "y": 9 }, { "x": 5, "y": 10 }, { "x": 5, "y": 11 }, { "x": 5, "y": 8 }, { "x": 4, "y": 7 }, { "x": 5, "y": 7 }, { "x": 8, "y": 7 }, { "x": 9, "y": 7 }, { "x": 7, "y": 6 }, { "x": 9, "y": 9 }, { "x": 4, "y": 9 }, { "x": 3, "y": 10 }, { "x": 10, "y": 10 }, { "x": 11, "y": 8 }, { "x": 2, "y": 8 }] },
                                "storage": { "pos": [{ "x": 8, "y": 6 }] },
                                "link": { "pos": [{ "x": 10, "y": 5 }] },
                                "terminal": { "pos": [{ "x": 10, "y": 6 }] },
                                "lab": { "pos": [{ "x": 9, "y": 1 }, { "x": 10, "y": 1 }, { "x": 10, "y": 2 }, { "x": 11, "y": 2 }, { "x": 11, "y": 3 }, { "x": 8, "y": 2 }, { "x": 8, "y": 3 }, { "x": 9, "y": 3 }, { "x": 9, "y": 4 }, { "x": 10, "y": 4 }] },
                                "observer": { "pos": [{ "x": 11, "y": 1 }] },
                                "powerSpawn": { "pos": [{ "x": 1, "y": 8 }] },
                                "factory": { "pos": [{ "x": 8, "y": 5 }] },
                                "nuker": { "pos": [{ "x": 8, "y": 4 }] },
                                "container": { "pos": [] },
                                "constructedWall": { "pos": [] },
                                "rampart": { "pos": [] }
                            }


                            let barriers = {
                                "rampart": { "pos": [{ "x": 1, "y": 17 }, { "x": 17, "y": 1 }, { "x": 2, "y": 1 }, { "x": 3, "y": 1 }, { "x": 4, "y": 1 }, { "x": 5, "y": 1 }, { "x": 6, "y": 1 }, { "x": 7, "y": 1 }, { "x": 8, "y": 1 }, { "x": 9, "y": 1 }, { "x": 10, "y": 1 }, { "x": 11, "y": 1 }, { "x": 12, "y": 1 }, { "x": 13, "y": 1 }, { "x": 14, "y": 1 }, { "x": 15, "y": 1 }, { "x": 16, "y": 1 }, { "x": 1, "y": 2 }, { "x": 1, "y": 3 }, { "x": 1, "y": 4 }, { "x": 1, "y": 5 }, { "x": 1, "y": 6 }, { "x": 1, "y": 7 }, { "x": 1, "y": 8 }, { "x": 1, "y": 9 }, { "x": 1, "y": 10 }, { "x": 1, "y": 11 }, { "x": 1, "y": 12 }, { "x": 1, "y": 13 }, { "x": 1, "y": 14 }, { "x": 1, "y": 15 }, { "x": 1, "y": 16 }, { "x": 1, "y": 18 }, { "x": 18, "y": 1 }, { "x": 19, "y": 2 }, { "x": 19, "y": 3 }, { "x": 19, "y": 4 }, { "x": 19, "y": 5 }, { "x": 19, "y": 6 }, { "x": 19, "y": 7 }, { "x": 19, "y": 8 }, { "x": 19, "y": 9 }, { "x": 19, "y": 10 }, { "x": 19, "y": 11 }, { "x": 19, "y": 12 }, { "x": 19, "y": 13 }, { "x": 19, "y": 14 }, { "x": 19, "y": 15 }, { "x": 19, "y": 16 }, { "x": 19, "y": 17 }, { "x": 19, "y": 18 }, { "x": 18, "y": 19 }, { "x": 17, "y": 19 }, { "x": 16, "y": 19 }, { "x": 15, "y": 19 }, { "x": 14, "y": 19 }, { "x": 13, "y": 19 }, { "x": 12, "y": 19 }, { "x": 11, "y": 19 }, { "x": 10, "y": 19 }, { "x": 9, "y": 19 }, { "x": 8, "y": 19 }, { "x": 7, "y": 19 }, { "x": 6, "y": 19 }, { "x": 5, "y": 19 }, { "x": 4, "y": 19 }, { "x": 3, "y": 19 }, { "x": 2, "y": 19 }, { "x": 2, "y": 2 }, { "x": 18, "y": 2 }, { "x": 18, "y": 18 }, { "x": 2, "y": 18 }, { "x": 7, "y": 5 }, { "x": 7, "y": 15 }, { "x": 5, "y": 12 }, { "x": 5, "y": 11 }, { "x": 13, "y": 15 }, { "x": 15, "y": 11 }, { "x": 14, "y": 10 }, { "x": 14, "y": 9 }, { "x": 12, "y": 10 }, { "x": 12, "y": 9 }, { "x": 12, "y": 8 }, { "x": 12, "y": 7 }, { "x": 13, "y": 7 }, { "x": 14, "y": 8 }, { "x": 13, "y": 8 }, { "x": 12, "y": 6 }, { "x": 13, "y": 5 }, { "x": 14, "y": 5 }, { "x": 14, "y": 6 }, { "x": 15, "y": 6 }, { "x": 15, "y": 7 }, { "x": 12, "y": 5 }, { "x": 11, "y": 12 }, { "x": 10, "y": 12 }, { "x": 10, "y": 13 }] },
                            }


                            _.forEach(Object.keys(base), function(structureType) {
                                _.forEach(base[structureType].pos, function(pos) {

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
                                })
                            })

                            _.forEach(Object.keys(barriers), function(structureType) {
                                _.forEach(barriers[structureType].pos, function(pos) {

                                    pos.x += anchorPoint.x - 10
                                    pos.y += anchorPoint.y - 10

                                    if (room.getTerrain().get(pos.x, pos.y) != TERRAIN_MASK_WALL) {

                                        if (room.memory.stage >= 4 && room.storage && room.storage.store[RESOURCE_ENERGY] >= 30000) {

                                            room.createConstructionSite(pos.x, pos.y, structureType)
                                        }

                                        if (structureType == "rampart") {

                                            room.visual.circle(pos.x, pos.y, {
                                                fill: '#4def52',
                                                radius: 0.2,
                                                strokeWidth: 0.125
                                            })
                                        } else {

                                            room.visual.circle(pos.x, pos.y, {
                                                fill: '#FCFEFF',
                                                radius: 0.2,
                                                strokeWidth: 0.125
                                            })
                                        }
                                    }
                                })
                            })
                        }
                    }
                }

                let baseLink = Game.getObjectById(room.memory.baseLink)
                let controllerContainer = Game.getObjectById(room.memory.controllerContainer)
                let controllerLink = Game.getObjectById(room.memory.controllerLink)
                let mineralContainer = Game.getObjectById(room.memory.mineralContainer)

                let source1 = Game.getObjectById(room.memory.source1)
                let sourceContainer1 = Game.getObjectById(room.memory.sourceContainer1)
                let sourceLink1 = Game.getObjectById(room.memory.sourceLink1)

                let source2 = Game.getObjectById(room.memory.source2)
                let sourceContainer2 = Game.getObjectById(room.memory.sourceContainer2)
                let sourceLink2 = Game.getObjectById(room.memory.sourceLink2)

                let roomConstructionSites = room.find(FIND_MY_CONSTRUCTION_SITES)

                if (roomConstructionSites.length < 5) {

                    source1Path()
                    source2Path()
                    controllerPath()

                    if (room.memory.stage >= 6) {

                        mineralPath()
                    }

                    if (room.memory.remoteRooms.length > 0) {

                        remotePath()
                    }

                    if (room.memory.stage >= 6) {

                        placeExtractor()
                    }
                }

                removeUneeded()

                function source1Path() {

                    let origin = room.find(FIND_MY_SPAWNS)[0]

                    let goal = _.map([source1], function(source) {
                        return { pos: source.pos, range: 1 }
                    })

                    if (origin && goal) {

                        var path = PathFinder.search(origin.pos, goal, {
                            plainCost: 3,
                            swampCost: 8,
                            maxRooms: 1,

                            roomCallback: function(roomName) {

                                let room = Game.rooms[roomName]

                                if (!room) return

                                let cm

                                cm = new PathFinder.CostMatrix

                                let constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                                    filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                                })

                                for (let site of constructionSites) {

                                    cm.set(site.pos.x, site.pos.y, 255)
                                }

                                let roadConstructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                                    filter: s => s.structureType == STRUCTURE_ROAD
                                })

                                for (let roadSite of roadConstructionSites) {

                                    cm.set(roadSite.pos.x, roadSite.pos.y, 1)
                                }

                                let ramparts = room.find(FIND_MY_STRUCTURES, {
                                    filter: s => s.structureType == STRUCTURE_RAMPART
                                })

                                for (let rampart of ramparts) {

                                    cm.set(rampart.pos.x, rampart.pos.y, 3)
                                }

                                let roads = room.find(FIND_STRUCTURES, {
                                    filter: s => s.structureType == STRUCTURE_ROAD
                                })

                                for (let road of roads) {

                                    cm.set(road.pos.x, road.pos.y, 1)
                                }

                                let structures = room.find(FIND_STRUCTURES, {
                                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD
                                })

                                for (let structure of structures) {

                                    if (structure.structureType != STRUCTURE_CONTAINER) {

                                        cm.set(structure.pos.x, structure.pos.y, 255)
                                    }
                                }

                                return cm
                            }
                        }).path

                        new RoomVisual(room.name).poly(path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })

                        for (let i = 0; i < path.length; i++) {

                            let value = path[i - 1]
                            let normalValue = path[i]

                            if (value && room.controller.level >= 5) {

                                room.createConstructionSite(value.x, value.y, STRUCTURE_ROAD)
                            }
                            if (sourceContainer1 == null && normalValue && i + 1 == path.length) {

                                room.createConstructionSite(normalValue.x, normalValue.y, STRUCTURE_CONTAINER)
                            }
                        }
                    }
                }

                function source2Path() {

                    let origin = room.find(FIND_MY_SPAWNS)[0]

                    let goal = _.map([source2], function(source) {
                        return { pos: source.pos, range: 1 }
                    })

                    if (origin && goal) {

                        var path = PathFinder.search(origin.pos, goal, {
                            plainCost: 3,
                            swampCost: 8,
                            maxRooms: 1,

                            roomCallback: function(roomName) {

                                let room = Game.rooms[roomName]

                                if (!room) return

                                let cm

                                cm = new PathFinder.CostMatrix

                                let constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                                    filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                                })

                                for (let site of constructionSites) {

                                    cm.set(site.pos.x, site.pos.y, 255)
                                }

                                let roadConstructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                                    filter: s => s.structureType == STRUCTURE_ROAD
                                })

                                for (let roadSite of roadConstructionSites) {

                                    cm.set(roadSite.pos.x, roadSite.pos.y, 1)
                                }

                                let ramparts = room.find(FIND_MY_STRUCTURES, {
                                    filter: s => s.structureType == STRUCTURE_RAMPART
                                })

                                for (let rampart of ramparts) {

                                    cm.set(rampart.pos.x, rampart.pos.y, 3)
                                }

                                let roads = room.find(FIND_STRUCTURES, {
                                    filter: s => s.structureType == STRUCTURE_ROAD
                                })

                                for (let road of roads) {

                                    cm.set(road.pos.x, road.pos.y, 1)
                                }

                                let structures = room.find(FIND_STRUCTURES, {
                                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD
                                })

                                for (let structure of structures) {

                                    if (structure.structureType != STRUCTURE_CONTAINER) {

                                        cm.set(structure.pos.x, structure.pos.y, 255)
                                    }
                                }

                                return cm
                            }
                        }).path

                        new RoomVisual(room.name).poly(path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })

                        for (let i = 0; i < path.length; i++) {

                            let value = path[i - 1]
                            let normalValue = path[i]

                            if (value && room.controller.level >= 5) {

                                room.createConstructionSite(value.x, value.y, STRUCTURE_ROAD)
                            }
                            if (sourceContainer2 == null && normalValue && i + 1 == path.length) {

                                room.createConstructionSite(normalValue.x, normalValue.y, STRUCTURE_CONTAINER)
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
                            plainCost: 3,
                            swampCost: 8,
                            maxRooms: 1,

                            roomCallback: function(roomName) {

                                let room = Game.rooms[roomName]

                                if (!room) return

                                let cm

                                cm = new PathFinder.CostMatrix

                                let constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                                    filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                                })

                                for (let site of constructionSites) {

                                    cm.set(site.pos.x, site.pos.y, 255)
                                }

                                let roadConstructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                                    filter: s => s.structureType == STRUCTURE_ROAD
                                })

                                for (let roadSite of roadConstructionSites) {

                                    cm.set(roadSite.pos.x, roadSite.pos.y, 1)
                                }

                                let ramparts = room.find(FIND_MY_STRUCTURES, {
                                    filter: s => s.structureType == STRUCTURE_RAMPART
                                })

                                for (let rampart of ramparts) {

                                    cm.set(rampart.pos.x, rampart.pos.y, 3)
                                }

                                let roads = room.find(FIND_STRUCTURES, {
                                    filter: s => s.structureType == STRUCTURE_ROAD
                                })

                                for (let road of roads) {

                                    cm.set(road.pos.x, road.pos.y, 1)
                                }

                                let structures = room.find(FIND_STRUCTURES, {
                                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD
                                })

                                for (let structure of structures) {

                                    if (structure.structureType != STRUCTURE_CONTAINER) {

                                        cm.set(structure.pos.x, structure.pos.y, 255)
                                    }
                                }

                                return cm
                            }
                        }).path

                        new RoomVisual(room.name).poly(path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })

                        for (let i = 0; i < path.length; i++) {

                            let value = path[i - 1]
                            let normalValue = path[i]

                            if (value && room.controller.level >= 5) {

                                room.createConstructionSite(value.x, value.y, STRUCTURE_ROAD)
                            }

                            if (controllerContainer == null && controllerLink == null && normalValue && i + 1 == path.length) {

                                room.createConstructionSite(normalValue.x, normalValue.y, STRUCTURE_CONTAINER)
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
                            plainCost: 3,
                            swampCost: 8,
                            maxRooms: 1,

                            roomCallback: function(roomName) {

                                let room = Game.rooms[roomName]

                                if (!room) return

                                let cm

                                cm = new PathFinder.CostMatrix

                                let constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                                    filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                                })

                                for (let site of constructionSites) {

                                    cm.set(site.pos.x, site.pos.y, 255)
                                }

                                let roadConstructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                                    filter: s => s.structureType == STRUCTURE_ROAD
                                })

                                for (let roadSite of roadConstructionSites) {

                                    cm.set(roadSite.pos.x, roadSite.pos.y, 1)
                                }

                                let ramparts = room.find(FIND_MY_STRUCTURES, {
                                    filter: s => s.structureType == STRUCTURE_RAMPART
                                })

                                for (let rampart of ramparts) {

                                    cm.set(rampart.pos.x, rampart.pos.y, 3)
                                }

                                let roads = room.find(FIND_STRUCTURES, {
                                    filter: s => s.structureType == STRUCTURE_ROAD
                                })

                                for (let road of roads) {

                                    cm.set(road.pos.x, road.pos.y, 1)
                                }

                                let structures = room.find(FIND_STRUCTURES, {
                                    filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD
                                })

                                for (let structure of structures) {

                                    if (structure.structureType != STRUCTURE_CONTAINER) {

                                        cm.set(structure.pos.x, structure.pos.y, 255)
                                    }
                                }

                                return cm
                            }
                        }).path

                        new RoomVisual(room.name).poly(path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })

                        for (let i = 0; i < path.length; i++) {

                            let value = path[i - 1]
                            let normalValue = path[i]

                            if (value) {

                                room.createConstructionSite(value.x, value.y, STRUCTURE_ROAD)
                            }
                            if (mineralContainer == null && normalValue && i + 1 == path.length) {

                                room.createConstructionSite(normalValue.x, normalValue.y, STRUCTURE_CONTAINER)
                            }
                        }
                    }
                }

                function towerPath() {


                }

                function remotePath() {

                    let remoteRooms = room.memory.remoteRooms

                    for (let roomMemory of remoteRooms) {

                        remoteRoom = Game.rooms[roomMemory.name]

                        if (remoteRoom) {

                            sources = remoteRoom.find(FIND_SOURCES)

                            for (let source of sources) {

                                let origin = room.find(FIND_MY_SPAWNS)[0]

                                let goal = _.map([source], function(source) {
                                    return { pos: source.pos, range: 1 }
                                })

                                if (origin && goal) {

                                    var path = PathFinder.search(origin.pos, goal, {
                                        plainCost: 3,
                                        swampCost: 8,
                                        maxOps: 10000,

                                        roomCallback: function(roomName) {

                                            let room = Game.rooms[roomName]

                                            if (!room) return

                                            let cm

                                            cm = new PathFinder.CostMatrix

                                            let constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                                                filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                                            })

                                            for (let site of constructionSites) {

                                                cm.set(site.pos.x, site.pos.y, 255)
                                            }

                                            let roadConstructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                                                filter: s => s.structureType == STRUCTURE_ROAD
                                            })

                                            for (let roadSite of roadConstructionSites) {

                                                cm.set(roadSite.pos.x, roadSite.pos.y, 1)
                                            }

                                            let ramparts = room.find(FIND_MY_STRUCTURES, {
                                                filter: s => s.structureType == STRUCTURE_RAMPART
                                            })

                                            for (let rampart of ramparts) {

                                                cm.set(rampart.pos.x, rampart.pos.y, 3)
                                            }

                                            let roads = room.find(FIND_STRUCTURES, {
                                                filter: s => s.structureType == STRUCTURE_ROAD
                                            })

                                            for (let road of roads) {

                                                cm.set(road.pos.x, road.pos.y, 1)
                                            }

                                            let structures = room.find(FIND_STRUCTURES, {
                                                filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD
                                            })

                                            for (let structure of structures) {

                                                if (structure.structureType != STRUCTURE_CONTAINER) {

                                                    cm.set(structure.pos.x, structure.pos.y, 255)
                                                }
                                            }

                                            return cm
                                        }
                                    }).path

                                    //console.log(JSON.stringify(path))

                                    let containerConstructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                                        filter: s => s.structureType == STRUCTURE_CONTAINER
                                    })

                                    let containers = room.find(FIND_STRUCTURES, {
                                        filter: s => s.structureType == STRUCTURE_CONTAINER
                                    })

                                    for (let i = 0; i < path.length; i++) {

                                        let value = path[i - 1]
                                        let normalValue = path[i]

                                        //new RoomVisual(normalValue.roomName).rect(normalValue.x - 0.5, normalValue.y - 0.5, 1, 1, { fill: "transparent", stroke: "#45C476" })

                                        if (value && value.roomName && value.x && value.y && Game.rooms[value.roomName]) {

                                            Game.rooms[value.roomName].createConstructionSite(value.x, value.y, STRUCTURE_ROAD)
                                        }

                                        if (source.pos.findInRange(containerConstructionSites, 1) == 0 && source.pos.findInRange(containers, 1) == 0 && normalValue && normalValue.roomName && normalValue.x && normalValue.y && i + 1 == path.length && Game.rooms[value.roomName]) {

                                            //new RoomVisual(normalValue.roomName).rect(normalValue.x - 0.5, normalValue.y - 0.5, 1, 1, { fill: "transparent", stroke: "red" })

                                            Game.rooms[value.roomName].createConstructionSite(normalValue.x, normalValue.y, STRUCTURE_CONTAINER)
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                function placeExtractor() {

                    let extractors = room.find(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_EXTRACTOR
                    })

                    if (extractors.length == 0) {

                        let mineral = room.find(FIND_MINERALS)[0]

                        if (mineral) {

                            room.createConstructionSite(mineral.pos, STRUCTURE_EXTRACTOR)
                        }
                    }
                }

                function removeUneeded() {

                    if (baseLink != null && controllerLink != null && controllerContainer != null) {

                        controllerContainer.destroy()
                    }

                    if (sourceContainer1 != null && sourceLink1 != null) {

                        //sourceContainer1.destroy()
                    }

                    if (sourceContainer2 != null && sourceLink2 != null) {

                        //sourceContainer2.destroy()
                    }

                    let walls = room.find(FIND_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_WALL
                    })

                    for (let structure of walls) {

                        structure.destroy()
                    }

                    let notMyStructures = room.find(FIND_STRUCTURES, {
                        filter: s => s.owner && !s.my
                    })

                    for (let structure of notMyStructures) {

                        structure.destroy()
                    }
                }
            }
        })
    }
};