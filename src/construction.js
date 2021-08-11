function construction(room, specialStructures) {

    destroySites("")

    destroyStructure("")

    resetRoom("")

    //removeAllSites()

    //removeAllStructures()

    function destroySites(roomName) {

        if (room.name != roomName) {

            return
        }

        let roomConstructionSites = room.find(FIND_MY_CONSTRUCTION_SITES)

        for (let cSite of roomConstructionSites) {

            cSite.remove()
        }
    }

    function destroyStructure(roomName) {

        if (room.name != roomName) {

            return
        }

        let structures = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType != STRUCTURE_SPAWN
        })

        for (let structure of structures) {

            structure.destroy()
        }
    }

    function resetRoom(roomName) {

        if (room.name != roomName) {

            return
        }

        let structures = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType != STRUCTURE_SPAWN
        })

        for (let structure of structures) {

            structure.destroy()
        }
    }

    function removeAllSites() {

        for (let value in Game.constructionSites) {

            let cSite = Game.constructionSites[value]

            cSite.remove()
        }
    }

    function removeAllStructures() {

        let structures = room.find(FIND_STRUCTURES, {
            filter: s => s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_CONTAINER
        })

        for (let structure of structures) {

            structure.destroy()
        }
    }

    let source1 = room.getObjectWithId(room.memory.source1)
    let source2 = room.getObjectWithId(room.memory.source2)

    let sourceContainer1 = specialStructures.containers.sourceContainer1
    let sourceContainer2 = specialStructures.containers.sourceContainer2
    let mineralContainer = specialStructures.containers.mineralContainer
    let controllerContainer = specialStructures.containers.controllerContainer

    let baseLink = specialStructures.links.baseLink
    let controllerLink = specialStructures.links.controllerLink
    let sourceLink1 = specialStructures.links.sourceLink1
    let sourceLink2 = specialStructures.links.sourceLink2

    let roomConstructionSites = room.find(FIND_MY_CONSTRUCTION_SITES)

    let roomPathDelay = 0

    if (roomConstructionSites.length < 5) {

        if (Game.time % 100 == 0) source1Path()

        if (Game.time % 101 == 0) source2Path()

        if (Game.time % 102 == 0) controllerPath()

        if (room.memory.stage >= 6) {

            if (Game.time % 103 == 0) mineralPath()
        }

        if (room.memory.stage >= 4 && room.memory.remoteRooms && room.memory.remoteRooms.length > 0) {

            for (let roomMemory of room.memory.remoteRooms) {

                remoteRoom = Game.rooms[roomMemory.name]

                if (remoteRoom) {

                    remotePath(remoteRoom)
                }
            }
        }

        if (room.memory.stage >= 6) {

            if (Game.time % 100 == 0) placeExtractor()
        }
    }

    if (Game.time % 100 == 0) removeUneeded()

    function source1Path() {

        let origin = room.memory.anchorPoint

        if (!source1) return

        let goal = { pos: source1.pos, range: 1 }

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

                    let ramparts = room.find(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_RAMPART
                    })

                    for (let rampart of ramparts) {

                        cm.set(rampart.pos.x, rampart.pos.y, 4)
                    }

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

                    return cm
                }
            }).path

            new RoomVisual(room.name).poly(path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })

            for (let i = 0; i < path.length; i++) {

                let value = path[i - 1]
                let normalValue = path[i]

                if (value && room.memory.stage >= 3) {

                    room.createConstructionSite(value.x, value.y, STRUCTURE_ROAD)
                }
                if (room.memory.stage > 1 && !sourceContainer1 && normalValue && i + 1 == path.length) {

                    room.createConstructionSite(normalValue.x, normalValue.y, STRUCTURE_CONTAINER)
                }
            }
        }
    }

    function source2Path() {

        let origin = room.memory.anchorPoint

        if (!source2) return

        let goal = { pos: source2.pos, range: 1 }

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

                    let ramparts = room.find(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_RAMPART
                    })

                    for (let rampart of ramparts) {

                        cm.set(rampart.pos.x, rampart.pos.y, 4)
                    }

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

                    return cm
                }
            }).path

            new RoomVisual(room.name).poly(path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })

            for (let i = 0; i < path.length; i++) {

                let value = path[i - 1]
                let normalValue = path[i]

                if (value && room.memory.stage >= 3) {

                    room.createConstructionSite(value.x, value.y, STRUCTURE_ROAD)
                }
                if (room.memory.stage > 1 && !sourceContainer2 && normalValue && i + 1 == path.length) {

                    room.createConstructionSite(normalValue.x, normalValue.y, STRUCTURE_CONTAINER)
                }
            }
        }
    }

    function controllerPath() {

        let origin = room.memory.anchorPoint

        let goal = { pos: room.controller.pos, range: 2 }

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

                    let ramparts = room.find(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_RAMPART
                    })

                    for (let rampart of ramparts) {

                        cm.set(rampart.pos.x, rampart.pos.y, 4)
                    }

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

                    return cm
                }
            }).path

            new RoomVisual(room.name).poly(path, { stroke: '#fff', strokeWidth: .15, opacity: .1, lineStyle: 'dashed' })

            for (let i = 0; i < path.length; i++) {

                let value = path[i - 1]
                let normalValue = path[i]

                if (value && room.memory.stage >= 3) {

                    room.createConstructionSite(value.x, value.y, STRUCTURE_ROAD)
                }

                if (room.memory.stage >= 2 && !controllerContainer && !controllerLink && normalValue && i + 1 == path.length) {

                    room.createConstructionSite(normalValue.x, normalValue.y, STRUCTURE_CONTAINER)
                }
            }
        }
    }

    function mineralPath() {

        let origin = room.memory.anchorPoint

        let mineral = room.find(FIND_MINERALS)[0]

        let goal = { pos: mineral.pos, range: 1 }

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

                    let ramparts = room.find(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_RAMPART
                    })

                    for (let rampart of ramparts) {

                        cm.set(rampart.pos.x, rampart.pos.y, 4)
                    }

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
                if (!mineralContainer && normalValue && i + 1 == path.length) {

                    room.createConstructionSite(normalValue.x, normalValue.y, STRUCTURE_CONTAINER)
                }
            }
        }
    }

    function remotePath(remoteRoom) {

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

                    }
                    if (Memory.rooms[roomName] && !avoidStages.includes(Memory.rooms[roomName].stage)) {

                        allowedRooms[roomName] = true
                        return 1

                    }

                    allowedRooms[roomName] = false
                    return Infinity
                }
            })

            if (!route || route == ERR_NO_PATH || route.length < 1) {

                return
            }

            if (origin && goal) {

                var path = PathFinder.search(origin, goal, {
                    plainCost: 4,
                    swampCost: 24,
                    maxOps: 10000,

                    roomCallback: function(roomName) {

                        let room = Game.rooms[roomName]

                        if (!room) return false

                        if (!allowedRooms[roomName]) return false

                        let cm

                        cm = new PathFinder.CostMatrix

                        let ramparts = room.find(FIND_MY_STRUCTURES, {
                            filter: s => s.structureType == STRUCTURE_RAMPART
                        })

                        for (let rampart of ramparts) {

                            cm.set(rampart.pos.x, rampart.pos.y, 4)
                        }

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

                        if (room.name == origin.roomName) {

                            let constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                                filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD
                            })

                            for (let site of constructionSites) {

                                cm.set(site.pos.x, site.pos.y, 255)
                            }

                            let structures = room.find(FIND_STRUCTURES, {
                                filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD
                            })

                            for (let structure of structures) {

                                cm.set(structure.pos.x, structure.pos.y, 255)
                            }
                        } else {

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
                        }

                        return cm
                    }
                }).path

                let containerConstructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER
                })

                let containers = room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER
                })

                for (let i = 0; i < path.length; i++) {

                    let value = path[i - 1]
                    let normalValue = path[i]

                    new RoomVisual(normalValue.roomName).rect(normalValue.x - 0.5, normalValue.y - 0.5, 1, 1, { fill: "transparent", stroke: "#45C476" })

                    if (value && value.roomName && value.x && value.y && Game.rooms[value.roomName]) {

                        Game.rooms[value.roomName].createConstructionSite(value.x, value.y, STRUCTURE_ROAD)
                    }

                    if (source.pos.findInRange(containerConstructionSites, 1) == 0 && source.pos.findInRange(containers, 1) == 0 && normalValue && normalValue.roomName && normalValue.x && normalValue.y && i + 1 == path.length && Game.rooms[value.roomName] && value.roomName != room.name) {

                        new RoomVisual(normalValue.roomName).rect(normalValue.x - 0.5, normalValue.y - 0.5, 1, 1, { fill: "transparent", stroke: "red" })

                        Game.rooms[value.roomName].createConstructionSite(normalValue.x, normalValue.y, STRUCTURE_CONTAINER)
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

module.exports = construction