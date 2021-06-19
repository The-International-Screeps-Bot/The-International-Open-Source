module.exports = {
    run: function constants() {

        for (let room in Memory.rooms) {

            if (Memory.rooms[room] && Memory.rooms[room].stage) {
                if (Memory.rooms[room].stage) {
                    if (Memory.rooms[room].stage >= 1) {

                        Game.map.visual.circle(new RoomPosition(8, 8, room), { radius: 8, fill: '#0008FF', opacity: 0.5 })
                        Game.map.visual.text(Memory.rooms[room].stage, new RoomPosition(8, 8, room), { color: '#ffffff', fontSize: 8 })

                        Game.map.visual.rect(new RoomPosition(0, 0, room), 50, 50, { fill: '#2DF0C9', opacity: 0.15 })

                    } else if (Memory.rooms[room].stage == "enemyRoom") {

                        Game.map.visual.rect(new RoomPosition(0, 0, room), 50, 50, { fill: '#FF0000', opacity: 0.25 })

                    } else if (Memory.rooms[room].stage == "remoteRoom") {

                        Game.map.visual.rect(new RoomPosition(0, 0, room), 50, 50, { fill: '#39A0ED', opacity: 0.25 })

                    } else if (Memory.rooms[room].stage == "keeperRoom") {

                        Game.map.visual.rect(new RoomPosition(0, 0, room), 50, 50, { fill: '#000000', opacity: 0.5 })

                    }
                } else {

                    Game.map.visual.rect(new RoomPosition(0, 0, room), 50, 50, { fill: '#F4E637', opacity: 0.25 })
                }
            }
        }

        if (Memory.global.attackingRoom && Memory.global.attackTarget) {

            Game.map.visual.line(new RoomPosition(25, 25, Memory.global.attackingRoom.name), new RoomPosition(25, 25, Memory.global.attackTarget), { width: 1.5, color: '#FE411E' })
        }

        if (Memory.global.attackTarget) {

            Game.map.visual.circle(new RoomPosition(8, 8, Memory.global.attackTarget), { radius: 8, fill: '#FF0000', opacity: 0.5 })
            Game.map.visual.text("AT", new RoomPosition(8, 8, Memory.global.attackTarget), { color: '#ffffff', fontSize: 8 })
        }

        if (Memory.global.communeEstablisher && Memory.global.newCommune) {

            Game.map.visual.line(new RoomPosition(25, 25, Memory.global.communeEstablisher.name), new RoomPosition(25, 25, Memory.global.newCommune), { width: 1.5, color: '#2DF0C9' })
        }

        if (Memory.global.newCommune) {

            Game.map.visual.circle(new RoomPosition(8, 8, Memory.global.newCommune), { radius: 8, fill: '#2DF0C9', opacity: 0.5 })
            Game.map.visual.text("NC", new RoomPosition(8, 8, Memory.global.newCommune), { color: '#ffffff', fontSize: 8 })
        }

        global()

        let totalEnergy = 0
        Memory.global.communes = []

        function global() {

            if (Memory.global == null || !Memory.global) {

                Memory.global = {}
            }
            if (Memory.global.establishedRooms == null || !Memory.global.establishedRooms) {

                Memory.global.establishedRooms = 0
            }
            if (Memory.global.hasBoosts == null || !Memory.global.hasBoosts) {

                Memory.global.hasBoosts = 0
            }

            if (Memory.global.globalStage == null || !Memory.global.globalStage) {

                Memory.global.globalStage = 0
            }

            if (Memory.global.establishedRooms >= 10 && Memory.global.globalStage) {

                Memory.global.globalStage = 3
            } else if (Memory.global.establishedRooms >= 3 && Memory.global.globalStage) {

                Memory.global.globalStage = 2
            } else if (Memory.global.establishedRooms >= 1 && Memory.global.globalStage) {

                Memory.global.globalStage = 1
            } else if (Memory.global.globalStage) {

                Memory.global.globalStage = 0
            }
        }

        _.forEach(Game.rooms, function(room) {
            if (room.controller && room.controller.my && room.controller.level >= 1) {

                Memory.global.communes.push(room.name)

                //console.log("a")

                sources()
                containers()
                labs()
                links()
                towers()
                spawns()
                rooms()
                costMatrixes()
                terminals()
                myResources()
                hasBoosts()

                function sources() {

                    let sources = room.find(FIND_SOURCES)

                    let source1 = Game.getObjectById(room.memory.source1)
                    let source2 = Game.getObjectById(room.memory.source2)

                    if (source1 == null) {

                        room.memory.source1 = sources[0].id

                    } else if (source2 == null) {

                        room.memory.source2 = sources[1].id

                    }
                }

                function containers() {

                    let containers = room.find(FIND_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_CONTAINER
                    })

                    for (let container of containers) {

                        let source1 = Game.getObjectById(room.memory.source1)
                        let source2 = Game.getObjectById(room.memory.source2)

                        let controllerContainer = Game.getObjectById(room.memory.controllerContainer)
                        let sourceContainer1 = Game.getObjectById(room.memory.sourceContainer1)
                        let sourceContainer2 = Game.getObjectById(room.memory.sourceContainer2)

                        if (controllerContainer == null && container.pos.inRangeTo(room.controller, 2)) {

                            room.memory.controllerContainer = container.id

                        } else if (sourceContainer1 == null && source1 && container.pos.inRangeTo(source1, 1)) {

                            room.memory.sourceContainer1 = container.id

                        } else if (sourceContainer2 == null && source2 && container.pos.inRangeTo(source2, 1)) {

                            room.memory.sourceContainer2 = container.id

                        }
                    }
                }

                function labs() {

                    let labs = room.find(FIND_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_LAB
                    })

                    var primaryLabs = []
                    var secondaryLabs = []

                    for (let lab of labs) {

                        var nearbyLab = lab.pos.findInRange(labs, 2)

                        var controller = room.controller

                        if (controller.level == 7) {
                            if (nearbyLab.length == labs.length && primaryLabs.length < 2) {

                                lab.room.visual.circle(lab.pos, {
                                    fill: 'transparent',
                                    radius: 0.8,
                                    stroke: '#39A0ED',
                                    strokeWidth: 0.125
                                });
                                primaryLabs.push(lab.id)

                            } else {

                                secondaryLabs.push(lab.id)

                            }
                        } else if (controller.level == 8) {
                            if (nearbyLab.length == labs.length && primaryLabs.length < 2) {

                                primaryLabs.push(lab.id)

                            } else {

                                secondaryLabs.push(lab.id)

                            }
                        }
                    }

                    room.memory.primaryLabs = primaryLabs
                    room.memory.secondaryLabs = secondaryLabs

                }

                function links() {

                    let links = room.find(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_LINK
                    })

                    for (let link of links) {

                        let source1 = Game.getObjectById(room.memory.source1)
                        let source2 = Game.getObjectById(room.memory.source2)

                        let controllerLink = Game.getObjectById(room.memory.controllerLink)
                        let baseLink = Game.getObjectById(room.memory.baseLink)
                        let sourceLink1 = Game.getObjectById(room.memory.sourceLink1)
                        let sourceLink2 = Game.getObjectById(room.memory.sourceLink2)

                        if (link.pos.inRangeTo(room.controller, 2)) {

                            room.memory.controllerLink = link.id

                        } else if (source2 && room.storage && link.pos.inRangeTo(room.storage, 2)) {

                            room.memory.baseLink = link.id

                        } else if (source1 && link.pos.inRangeTo(source1, 2)) {

                            room.memory.sourceLink1 = link.id

                        } else if (source2 && link.pos.inRangeTo(source2, 2)) {

                            room.memory.sourceLink2 = link.id
                        }
                    }
                }

                function towers() {

                    let towers = room.find(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_TOWER
                    })

                    towersSorted = []

                    for (let tower of towers) {

                        towersSorted.push(tower.id)

                    }

                    room.memory.towers = towersSorted

                }

                function spawns() {

                    let spawns = room.find(FIND_MY_SPAWNS)

                    sortedSpawns = []

                    for (let spawn of spawns) {

                        sortedSpawns.push(spawn.id)

                    }

                    room.memory.spawns = sortedSpawns

                }

                function rooms() {

                    if (!room.memory.remoteRooms) {

                        room.memory.remoteRooms = []
                    }
                }

                function costMatrixes() {

                    let cm = new PathFinder.CostMatrix

                    let terrain = Game.map.getRoomTerrain(room.name)

                    for (var x = -1; x < 50; ++x) {
                        for (var y = -1; y < 50; ++y) {

                            switch (terrain.get(x, y)) {

                                case 0:

                                    cm.set(x, y, 4)
                                    break

                                case TERRAIN_MASK_SWAMP:

                                    cm.set(x, y, 24)
                                    break

                                case TERRAIN_MASK_WALL:

                                    cm.set(x, y, 255)
                                    break
                            }
                        }
                    }

                    let constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES, {
                        filter: s => s.structureType != STRUCTURE_CONTAINER && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_RAMPART
                    })

                    for (let site of constructionSites) {

                        cm.set(site.pos.x, site.pos.y, 255)
                    }

                    let ramparts = room.find(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_RAMPART
                    })

                    for (let rampart of ramparts) {

                        cm.set(rampart.pos.x, rampart.pos.y, 4)
                    }

                    let roads = room.find(FIND_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_ROAD
                    })

                    for (let road of roads) {

                        cm.set(road.pos.x, road.pos.y, 1)
                    }

                    let structures = room.find(FIND_STRUCTURES, {
                        filter: s => s.structureType != STRUCTURE_RAMPART && s.structureType != STRUCTURE_ROAD && s.structureType != STRUCTURE_CONTAINER
                    })

                    for (let structure of structures) {

                        cm.set(structure.pos.x, structure.pos.y, 255)
                    }

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

                function terminals() {


                }

                function roomGlobal() {

                    if (room.memory.stage == 8) {

                        Memory.global.establishedRooms += 1
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

                    room.memory.totalEnergy = storageEnergy + terminalEnergy

                    //console.log(room.memory.totalEnergy)

                    totalEnergy += room.memory.totalEnergy
                }

                function hasBoosts() {

                    var hasBoosts = false
                    let t3Boosts = ["XUH2O", "XUHO2", "XKH2O", "XKHO2", "XLH2O", "XLHO2", "XZH2O", "XZHO2", "XGH2O", "XGHO2"]
                    let importantBoosts = ["XUH2O", "XKHO2", "XLH2O", "XLHO2", "XZH2O", "XZHO2", "XGH2O", "XGHO2"]
                    let attackBoosts = ["XUH2O", "XKHO2", "XLHO2", "XZH2O", "XGHO2", "XZHO2"]
                    let defendBoosts = ["XUH2O", "XKHO2", "XLH2O", "XZHO2"]
                    let economyBoosts = ["XGH2O"]

                    if (room.storage && room.terminal) {

                        let i = 0

                        while (i < importantBoosts.length) {

                            if (room.storage.store[importantBoosts[i]] || room.terminal.store[importantBoosts[i]]) {

                                i++
                            }
                            if (i == importantBoosts.length) {

                                hasBoots = true

                                break
                            } else {

                                break
                            }
                        }
                    }
                    if (hasBoosts == true) {

                        room.memory.hasBoosts = true
                    }
                }
            }
        })

        var roomsWithBoosts = _.filter(Game.rooms, function(room) { return room.memory.hasBoosts == true })

        Memory.global.hasBoosts = roomsWithBoosts

        Memory.data.totalEnergy = totalEnergy
    }
}