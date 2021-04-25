module.exports = {
    run: function constants() {
        
        global()

        let totalEnergy = 0
        Memory.global.roomCount = 0
        
        function global() {
            
            if (Memory.global == null || !Memory.global) {
                        
                    Memory.global = {}
            }
            else if (Memory.global.establishedRooms == null || !Memory.global.establishedRooms) {
                        
                    Memory.global.establishedRooms = 0
            }
            
            if (Memory.global.globalStage == null || !Memory.global.globalStage) {
                        
                Memory.global.globalStage = 0
            }
            
            if (Memory.global.establishedRooms >= 10 && Memory.global.globalStage) {
                
                Memory.global.globalStage = 3
            }
            else if (Memory.global.establishedRooms >= 3 && Memory.global.globalStage) {
                
                Memory.global.globalStage = 2
            }
            else if (Memory.global.establishedRooms >= 1 && Memory.global.globalStage) {
                
                Memory.global.globalStage = 1
            }
            else if (Memory.global.globalStage) {
                
                Memory.global.globalStage = 0
            }
        }
        
        _.forEach(Game.rooms, function(room) {
            if (room.controller && room.controller.my && room.controller.level >= 1) {
                
                Memory.global.roomCount++

                //console.log("a")

                //sources()
                containers()
                labs()
                links()
                towers()
                spawns()
                terminals()
                rooms()
                myResources()

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
                        
                        let sourceContainer1 = Game.getObjectById(room.memory.sourceContainer1)
                        let sourceContainer2 = Game.getObjectById(room.memory.sourceContainer2)

                        if (container.pos.inRangeTo(container.room.controller, 2)) {

                            container.room.memory.controllerContainer = container.id

                        } else if (sourceContainer1 == null && container.pos.inRangeTo(source[0], 1)) {

                            container.room.memory.sourceContainer1 = container.id

                        } else if (sourceContainer2 == null && container.pos.inRangeTo(source[1], 1)) {

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

                function roomGlobal() {
                    
                    if (room.memory.stage == 8) {
                        
                        Memory.global.establishedRooms += 1
                    }
                }

                function rooms() {
                    
                    if (Game.shard.name == "shard2") {
                        
                        var unfilteredRemoteRooms = ["E25N3", "E26N3", "E32N4", "E22S2", "E22S4", "E23S4", "E21S2", "E34N2", "E34N1"]
                    }
                    else if (Game.shard.name == "screepsplus1") {
                    
                        var unfilteredRemoteRooms = ["E28N12", "E28N14", "E28N16", "E28N18", "E29N17", "E31N15", "E32N14"]
                    }
                    else {
                        
                        
                    }
                    
                    let remoteRooms = []

                    for (let remoteRoom of unfilteredRemoteRooms) {

                        var targetRoomDistance = Game.map.getRoomLinearDistance(room.name, remoteRoom)

                        if (targetRoomDistance == 1) {

                            //console.log(spawn.room.name + " - " + targetRoom + ", " + targetRoomDistance)
                            remoteRooms.push({name: remoteRoom, sources: 1, roads: null, builderNeed: null, enemy: null, distance: targetRoomDistance})

                        }
                    }

                    room.memory.remoteRooms = remoteRooms
                }
                function myResources() {
                    
                    if (room.storage) {
                        
                        var storageEnergy = room.storage.store[RESOURCE_ENERGY]
                    }
                    else {
                        
                        var storageEnergy = 0
                    }
                    if (room.terminal) {
                        
                        var terminalEnergy = room.terminal.store[RESOURCE_ENERGY]
                    }
                    else {
                        
                        var terminalEnergy = 0
                    }
                    
                    room.memory.totalEnergy = storageEnergy + terminalEnergy
                    
                    //console.log(room.memory.totalEnergy)
                    
                    totalEnergy += room.memory.totalEnergy
                }
            }
        })
        
        if (Memory.global.totalEnergy == null) {
            
            Memory.global.totalEnergy = 0
        }
        
        Memory.global.totalEnergy = totalEnergy
        
        //console.log(Memory.global.totalEnergy)
    }
};