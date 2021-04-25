module.exports = {
    run: function visuals() {
        _.forEach(Game.rooms, function(room) {
            if (room.controller && room.controller.my && room.controller.level >= 1) {

                var labs = room.find(FIND_MY_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_LAB
                });
            
                var containers = room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_CONTAINER
                });
            
                var towers = room.find(FIND_MY_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_TOWER
                });
            
                var links = room.find(FIND_MY_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_LINK
                });
            
                var walls = room.find(FIND_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_WALL
                });
            
                var ramparts = room.find(FIND_MY_STRUCTURES, {
                    filter: (s) => s.structureType == STRUCTURE_RAMPART
                });
            
                var controller = room.controller
            
                var constructionSites = room.find(FIND_CONSTRUCTION_SITES)
            
                var spawns = room.find(FIND_MY_SPAWNS)
            
                var sources = room.find(FIND_SOURCES)
            
                var storage = room.storage
            
                var terminal = room.terminal
            
                var minerals = room.find(FIND_MINERALS)
            
                var mineral = minerals[0]
            
                for (let lab of labs) {
                    
                    let rawPrimaryLabs = room.memory.primaryLabs
                    let rawSecondaryLabs = room.memory.secondaryLabs
    
                    for (let labs of rawPrimaryLabs) {
    
                        let lab = Game.getObjectById(labs)
                        
                        room.visual.circle(lab.pos, {
                                fill: 'transparent',
                                radius: 0.8,
                                stroke: '#39A0ED',
                                strokeWidth: 0.125
                            })
                    }
                    for (let labs of rawSecondaryLabs) {
    
                        let lab = Game.getObjectById(labs)
                        
                        room.visual.circle(lab.pos, {
                                fill: 'transparent',
                                radius: 0.8,
                                stroke: '#2DF0C9',
                                strokeWidth: 0.125
                            })
                    }
                    
                    //Minerals
                    if (lab.store[RESOURCE_HYDROGEN]) {
            
                        room.visual.text("H", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_OXYGEN]) {
            
                        room.visual.text("O", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_UTRIUM]) {
            
                        room.visual.text("U", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#50d7f9", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_KEANIUM]) {
            
                        room.visual.text("K", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#a071ff", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_LEMERGIUM]) {
            
                        room.visual.text("L", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#00f4a2", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_ZYNTHIUM]) {
            
                        room.visual.text("Z", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#fdd388", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYST]) {
            
                        room.visual.text("X", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    }
                    //Base
                    else if (lab.store[RESOURCE_HYDROXIDE]) {
            
                        room.visual.text("OH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_ZYNTHIUM_KEANITE]) {
            
                        room.visual.text("ZK", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_UTRIUM_LEMERGITE]) {
            
                        room.visual.text("UL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_GHODIUM]) {
            
                        room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    }
                    //Tier 1
                    else if (lab.store[RESOURCE_UTRIUM_HYDRIDE]) {
            
                        room.visual.text("OH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_UTRIUM_OXIDE]) {
            
                        room.visual.text("ZK", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_KEANIUM_HYDRIDE]) {
            
                        room.visual.text("UL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_KEANIUM_OXIDE]) {
            
                        room.visual.text("UL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_LEMERGIUM_HYDRIDE]) {
            
                        room.visual.text("LH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#00f4a2", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_LEMERGIUM_OXIDE]) {
            
                        room.visual.text("LO", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#00f4a2", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_ZYNTHIUM_HYDRIDE]) {
            
                        room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_ZYNTHIUM_OXIDE]) {
            
                        room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_GHODIUM_HYDRIDE]) {
            
                        room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_GHODIUM_OXIDE]) {
            
                        room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    }
                    //Tier 2
                    else if (lab.store[RESOURCE_UTRIUM_ACID]) {
            
                        room.visual.text("OH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_UTRIUM_ALKALIDE]) {
            
                        room.visual.text("ZK", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_KEANIUM_ACID]) {
            
                        room.visual.text("UL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_KEANIUM_ALKALIDE]) {
            
                        room.visual.text("UL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_LEMERGIUM_ACID]) {
            
                        room.visual.text("LH", lab.pos.x, lab.pos.y, { font: 0.3, color: "black", backgroundColor: "#00f4a2", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_LEMERGIUM_ALKALIDE]) {
            
                        room.visual.text("LO", lab.pos.x, lab.pos.y, { font: 0.3, color: "black", backgroundColor: "#00f4a2", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_ZYNTHIUM_ACID]) {
            
                        room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_ZYNTHIUM_ALKALIDE]) {
            
                        room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_GHODIUM_ACID]) {
            
                        room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_GHODIUM_ALKALIDE]) {
            
                        room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    }
                    //Tier 3
                    else if (lab.store[RESOURCE_CATALYZED_UTRIUM_ACID]) {
            
                        room.visual.text("XOH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_UTRIUM_ALKALIDE]) {
            
                        room.visual.text("XZK", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_KEANIUM_ACID]) {
            
                        room.visual.text("XUL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_KEANIUM_ALKALIDE]) {
            
                        room.visual.text("XUL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_LEMERGIUM_ACID]) {
            
                        room.visual.text("XLH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#00f4a2", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE]) {
            
                        room.visual.text("XLO", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#00f4a2", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_ZYNTHIUM_ACID]) {
            
                        room.visual.text("XG", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE]) {
            
                        room.visual.text("XG", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_GHODIUM_ACID]) {
            
                        room.visual.text("XG", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_GHODIUM_ALKALIDE]) {
            
                        room.visual.text("XG", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    }
                }
                for (let container of containers) {
                
                    room.visual.text(container.store[RESOURCE_ENERGY], container.pos.x, container.pos.y, { font: 0.5, backgroundColor: "#FFD180", backgroundPadding: "0.1", align: 'center' })
                }
                    
                    let sourceContainer1 = Game.getObjectById(room.memory.sourceContainer1)
                    let sourceContainer2 = Game.getObjectById(room.memory.sourceContainer2)
                    let controllerContainer = Game.getObjectById(room.memory.controllerContainer)
                    
                    if (sourceContainer1 != null) {
                        
                        room.visual.circle(sourceContainer1.pos, {
                            fill: 'transparent',
                            radius: 0.8,
                            stroke: '#39A0ED',
                            strokeWidth: 0.125
                        })
                    }
                    if (sourceContainer2 != null) {
                        
                        room.visual.circle(sourceContainer2.pos, {
                            fill: 'transparent',
                            radius: 0.8,
                            stroke: '#2DF0C9',
                            strokeWidth: 0.125
                        })
                    }
                    if (controllerContainer != null) {
                        
                        room.visual.circle(controllerContainer.pos, {
                            fill: 'transparent',
                            radius: 0.8,
                            stroke: '#2DF0C9',
                            strokeWidth: 0.125
                        })
                    }
                    
                for (let link of links) {
                
                    room.visual.text(link.store[RESOURCE_ENERGY], link.pos.x, link.pos.y, { font: 0.5, backgroundColor: "#FFD180", backgroundPadding: "0.1", align: 'center' })   
                }
                
                    let sourceLink1 = Game.getObjectById(room.memory.sourceLink1)
                    let sourceLink2 = Game.getObjectById(room.memory.sourceLink2)
                    let controllerLink = Game.getObjectById(room.memory.controllerLink)
                    let baseLink = Game.getObjectById(room.memory.baseLink)
                    
                    if (sourceLink1 != null) {
                        
                        room.visual.circle(sourceLink1.pos, {
                            fill: 'transparent',
                            radius: 0.8,
                            stroke: '#39A0ED',
                            strokeWidth: 0.125
                        })
                    }
                    if (sourceLink2 != null) {
                        
                        room.visual.circle(sourceLink2.pos, {
                            fill: 'transparent',
                            radius: 0.8,
                            stroke: '#2DF0C9',
                            strokeWidth: 0.125
                        })
                    }
                    if (controllerLink != null) {
                        
                        room.visual.circle(controllerLink.pos, {
                            fill: 'transparent',
                            radius: 0.8,
                            stroke: '#2DF0C9',
                            strokeWidth: 0.125
                        })
                    }
                    if (baseLink != null) {
                        
                        room.visual.circle(baseLink.pos, {
                            fill: 'transparent',
                            radius: 0.8,
                            stroke: '#2DF0C9',
                            strokeWidth: 0.125
                        })
                    }
            
                room.visual.text("%" + (controller.progress / controller.progressTotal * 100).toFixed(2), controller.pos.x, controller.pos.y - 2, { align: 'center' });
            
                room.visual.text(controller.level, controller.pos.x, controller.pos.y - 1, { align: 'center' });
            
                if (storage) {
                    
                    room.visual.text((storage.store[RESOURCE_ENERGY] / 1000).toFixed(0) + "k", storage.pos.x, storage.pos.y, { font: 0.5, backgroundColor: "#FFD180", backgroundPadding: "0.1", align: 'center' });
                }
                if (terminal) {
            
                    room.visual.text((_.sum(terminal.store) / 1000).toFixed(0) + "k", terminal.pos.x, terminal.pos.y - 1, { align: 'center' });
            
                }
            
                mineral.room.visual.text((mineral.mineralAmount / 1000).toFixed(0) + "k" + ", " + (mineral.ticksToRegeneration / 1000).toFixed(0) + "k", mineral.pos.x, mineral.pos.y - 1, { align: 'center' });
            
                if (mineral.density == 1) {
            
                    mineral.room.visual.text("Low", mineral.pos.x, mineral.pos.y - 2, { align: 'center' });
            
                } else if (mineral.density == 2) {
            
                    mineral.room.visual.text("Moderate", mineral.pos.x, mineral.pos.y - 2, { align: 'center' });
            
                } else if (mineral.density == 3) {
            
                    mineral.room.visual.text("High", mineral.pos.x, mineral.pos.y - 2, { align: 'center' });
            
                } else if (mineral.density == 4) {
            
                    mineral.room.visual.text("Ultra", mineral.pos.x, mineral.pos.y - 2, { align: 'center' });
            
                }
            
                for (let constructionSite of constructionSites) {
            
                    room.visual.text("%" + (constructionSite.progress / constructionSite.progressTotal * 100).toFixed(0), constructionSite.pos.x, constructionSite.pos.y - 0.25, { font: 0.5, align: 'center' });
            
                }
                for (let tower of towers) {
            
                    room.visual.text(tower.store[RESOURCE_ENERGY], tower.pos.x, tower.pos.y, { font: 0.5, backgroundColor: "#FFD180", backgroundPadding: "0.1", align: 'center' });
            
                }
                for (let spawn of spawns) {
            
                    if (spawn.spawning) {
            
                        room.visual.text(spawn.spawning.remainingTime, spawn.pos.x, spawn.pos.y - 1, { align: 'center' });
            
                    }
            
                }
                for (let source of sources) {
            
                    if (source.ticksToRegeneration != undefined) {
            
                        room.visual.text(source.ticksToRegeneration, source.pos.x, source.pos.y - 1, { align: 'center' });
            
                    } else {
            
                        room.visual.text("0", source.pos.x, source.pos.y - 1, { align: 'center' });
            
                    }
            
                    room.visual.text(source.energy, source.pos.x, source.pos.y - 2, { align: 'center' });
            
                }
            }
        })
    }
};