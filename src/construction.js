function construction(room, specialStructures) {

    let mineralContainer = specialStructures.containers.mineralContainer
    let controllerContainer = specialStructures.containers.controllerContainer

    let controllerLink = specialStructures.links.controllerLink

    let roomConstructionSites = room.find(FIND_MY_CONSTRUCTION_SITES)

    if (roomConstructionSites.length < 5) {

        if (Game.time % 102 == 0) controllerPath()

        if (room.memory.stage >= 6) {

            if (Game.time % 103 == 0) mineralPath()
        }

        if (room.memory.stage >= 6) {

            if (Game.time % 100 == 0) placeExtractor()
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

            room.visual.poly(path, { stroke: colors.neutralYellow, strokeWidth: .15, opacity: .2, lineStyle: 'normal' })

            for (let i = 0; i < path.length; i++) {

                let value = path[i - 1]
                let normalValue = path[i]

                if (value && room.memory.stage >= 4) {

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

            room.visual.poly(path, { stroke: colors.neutralYellow, strokeWidth: .15, opacity: .2, lineStyle: 'normal' })

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
}

module.exports = construction