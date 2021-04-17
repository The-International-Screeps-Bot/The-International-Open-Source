module.exports = {
    run: function constants() {
        _.forEach(Game.rooms, function(room) {
            if (room.controller && room.controller.my && room.controller.level >= 1) {

                //console.log("a")

                //sources()
                containers()
                labs()
                links()
                towers()
                spawns()
                terminals()
                rooms()
                    //global() 

                /*
                if (room.name == "E28N13") {
                    
                    let structures = room.find(FIND_)
                }
                */

                function sources() {



                }

                function containers() {

                    var containers = room.find(FIND_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_CONTAINER
                    });

                    for (let container of containers) {

                        var source = room.find(FIND_SOURCES);

                        if (container.pos.inRangeTo(container.room.controller, 2)) {

                            container.room.memory.controllerContainer = container.id

                        } else if (container.pos.inRangeTo(source[0], 1)) {

                            container.room.memory.sourceContainer1 = container.id

                        } else if (container.pos.inRangeTo(source[1], 1)) {

                            container.room.memory.sourceContainer2 = container.id

                        }
                    }

                }

                function labs() {

                    var labs = room.find(FIND_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_LAB
                    });

                    var primaryLabs = []
                    var secondaryLabs = []

                    for (let lab of labs) {

                        var nearbyLab = lab.pos.findInRange(labs, 1);

                        var controller = room.controller

                        if (controller.level == 7) {
                            if (nearbyLab.length == 3) {

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
                            if (nearbyLab.length == 6) {

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

                    var links = room.find(FIND_STRUCTURES, {
                        filter: (s) => s.structureType == STRUCTURE_LINK
                    });

                    var source = room.find(FIND_SOURCES);

                    var storage = room.storage

                    var controller = room.controller

                    for (let link of links) {
                        if (storage) {
                            if (link.pos.inRangeTo(storage, 2)) {

                                link.room.memory.baseLink = link.id
                            }
                        }
                        if (controller.pos.inRangeTo(link, 2)) {

                            link.room.memory.controllerLink = link.id

                        } else if (source) {
                            if (link.pos.inRangeTo(source, 2)) {

                                link.room.memory.sourceLink1 = link.id

                            }
                        } else if (source) {
                            if (link.pos.inRangeTo(source, 2)) {

                                link.room.memory.sourceLink2 = link.id

                            }
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

                function global() {

                    let establishedRooms
                    let rcl8 = false

                    for (rooms in Game.rooms) {

                        if (rooms.memory.stage >= 6) {

                            establishedRooms++
                        }
                        if (rooms.memory.stage == 8) {

                            rcl8 = true
                        }
                    }
                    if (establishedRooms >= 2) {

                        Memory.globalStage = 2
                    }
                    if (establishedRooms >= 2 && rcl8 == true) {

                        Memory.globalStage = 3
                    }
                }

                function rooms() {

                    //let unfilteredRemoteRooms = ["E25N3"]
                    let unfilteredRemoteRooms = ["E28N12", "E28N14", "E28N16", "E28N18", "E29N17", "E27N12"]
                    let remoteRooms = []

                    for (let remoteRoom of unfilteredRemoteRooms) {

                        var targetRoomDistance = Game.map.getRoomLinearDistance(room.name, remoteRoom)

                        if (targetRoomDistance == 1) {

                            //console.log(spawn.room.name + " - " + targetRoom + ", " + targetRoomDistance)
                            remoteRooms.push({name: remoteRoom, sources: 1, builderNeed: null, enemy: null, distance: targetRoomDistance})

                        }
                    }

                    room.memory.remoteRooms = remoteRooms
                }
            }
        })
    }
};