const { indexOf } = require("lodash");

module.exports = {
    run: function constants() {

        //Instead I should be having the scouts create the map visuals the export them. This doesn't work as Memory.rooms is an object of room names, not of room objects

        for (let room in Memory.rooms) {

            if (room && room.stage) {
                if (room.memory.stage != null) {
                    if (room.memory.stage >= 1) {

                        Game.map.visual.rect(new RoomPosition(0, 0, room.name), 50, 50, { fill: '#2DF0C9', opacity: 0.25 })
                    } else if (room.memory.stage == "enemyRoom") {

                        Game.map.visual.rect(new RoomPosition(0, 0, room.name), 50, 50, { fill: '#FE411E', opacity: 0.25 })
                    } else if (room.memory.stage == "remoteRoom") {

                        Game.map.visual.rect(new RoomPosition(0, 0, room.name), 50, 50, { fill: '#39A0ED', opacity: 0.25 })
                    } else if (room.memory.stage == "invaderRoom") {

                        Game.map.visual.rect(new RoomPosition(0, 0, room.name), 50, 50, { fill: '#DA2F2F', opacity: 0.25 })
                    } else if (room.memory.stage == "emptyRoom") {

                        Game.map.visual.rect(new RoomPosition(0, 0, room.name), 50, 50, { fill: '#DA2F2F', opacity: 0.25 })
                    }
                } else {

                    Game.map.visual.rect(new RoomPosition(0, 0, room.name), 50, 50, { fill: '#F4E637', opacity: 0.25 })
                }
            }
        }

        global()

        let totalEnergy = 0
        Memory.global.roomCount = 0

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

                Memory.global.roomCount++

                    //console.log("a")

                    sources()
                containers()
                labs()
                links()
                towers()
                spawns()
                terminals()
                rooms()
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

                        if (controllerLink == null && link.pos.inRangeTo(room.controller, 2)) {

                            room.memory.controllerLink = link.id

                        } else if (baseLink == null && source2 && room.storage && link.pos.inRangeTo(room.storage, 1)) {

                            room.memory.baseLink = link.id

                        } else if (sourceLink1 == null && source1 && link.pos.inRangeTo(source1, 2)) {

                            room.memory.sourceLink1 = link.id

                        } else if (sourceLink2 == null && source2 && link.pos.inRangeTo(source2, 2)) {

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

                function terminals() {


                }

                function roomGlobal() {

                    if (room.memory.stage == 8) {

                        Memory.global.establishedRooms += 1
                    }
                }

                function rooms() {

                    if (Game.shard.name == "shard2") {

                        var unfilteredRemoteRooms = ["E25N3", "E26N3", "E32N4", "E22S2", "E22S4", "E23S4", "E21S2", "E34N2", "E34N1"]
                    } else if (Game.shard.name == "screepsplus1") {

                        var unfilteredRemoteRooms = ["E28N12", "E28N14", "E28N16", "E28N18", "E29N17", "E31N15", "E32N14", "E32N15", "E29N13"]
                    } else {


                    }

                    let remoteRoomNames = []

                    for (let object of room.memory.remoteRooms) {

                        remoteRoomNames.push(object.name)
                    }

                    if (room.memory.remoteRooms == null) {

                        room.memory.remoteRooms = []
                    }

                    for (let remoteRoom of unfilteredRemoteRooms) {

                        var targetRoomDistance = Game.map.getRoomLinearDistance(room.name, remoteRoom)

                        if (targetRoomDistance == 1) {
                            if (remoteRoomNames.indexOf(remoteRoom) === -1) {

                                room.memory.remoteRooms.push({ name: remoteRoom, sources: 1, roads: false, builderNeed: false, enemy: false, distance: null })
                            }
                        }
                    }

                    room.memory.remoteRooms = remoteRooms
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

        if (Memory.global.totalEnergy == null) {

            Memory.global.totalEnergy = 0
        }

        Memory.global.totalEnergy = totalEnergy

        //console.log(Memory.global.totalEnergy)
    }
};