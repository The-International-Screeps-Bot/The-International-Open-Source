module.exports = {
    run: function constants() {
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
            
                    var nearbyLab = lab.pos.findInRange(labs, 1);
            
                    if (controller.level == 7) {
                        if (nearbyLab.length == 3) {
            
                            lab.room.visual.circle(lab.pos, {
                                fill: 'transparent',
                                radius: 0.8,
                                stroke: '#39A0ED',
                                strokeWidth: 0.125
                            });
            
                        } else {
            
                            lab.room.visual.circle(lab.pos, {
                                fill: 'transparent',
                                radius: 0.8,
                                stroke: '#2DF0C9',
                                strokeWidth: 0.125
                            });
            
                        }
                    } else if (controller.level == 8) {
                        if (nearbyLab.length == 6) {
            
                            lab.room.visual.circle(lab.pos, {
                                fill: 'transparent',
                                radius: 0.8,
                                stroke: '#39A0ED',
                                strokeWidth: 0.125
                            });
            
                        } else {
            
                            lab.room.visual.circle(lab.pos, {
                                fill: 'transparent',
                                radius: 0.8,
                                stroke: '#2DF0C9',
                                strokeWidth: 0.125
                            });
                        }
                    }
                    //Minerals
                    if (lab.store[RESOURCE_HYDROGEN]) {
            
                        lab.room.visual.text("H", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_OXYGEN]) {
            
                        lab.room.visual.text("O", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_UTRIUM]) {
            
                        lab.room.visual.text("U", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#50d7f9", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_KEANIUM]) {
            
                        lab.room.visual.text("K", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#a071ff", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_LEMERGIUM]) {
            
                        lab.room.visual.text("L", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#00f4a2", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_ZYNTHIUM]) {
            
                        lab.room.visual.text("Z", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#fdd388", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYST]) {
            
                        lab.room.visual.text("X", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    }
                    //Base
                    else if (lab.store[RESOURCE_HYDROXIDE]) {
            
                        lab.room.visual.text("OH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_ZYNTHIUM_KEANITE]) {
            
                        lab.room.visual.text("ZK", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_UTRIUM_LEMERGITE]) {
            
                        lab.room.visual.text("UL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_GHODIUM]) {
            
                        lab.room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    }
                    //Tier 1
                    else if (lab.store[RESOURCE_UTRIUM_HYDRIDE]) {
            
                        lab.room.visual.text("OH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_UTRIUM_OXIDE]) {
            
                        lab.room.visual.text("ZK", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_KEANIUM_HYDRIDE]) {
            
                        lab.room.visual.text("UL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_KEANIUM_OXIDE]) {
            
                        lab.room.visual.text("UL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_LEMERGIUM_HYDRIDE]) {
            
                        lab.room.visual.text("LH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#00f4a2", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_LEMERGIUM_OXIDE]) {
            
                        lab.room.visual.text("LO", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#00f4a2", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_ZYNTHIUM_HYDRIDE]) {
            
                        lab.room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_ZYNTHIUM_OXIDE]) {
            
                        lab.room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_GHODIUM_HYDRIDE]) {
            
                        lab.room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_GHODIUM_OXIDE]) {
            
                        lab.room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    }
                    //Tier 2
                    else if (lab.store[RESOURCE_UTRIUM_ACID]) {
            
                        lab.room.visual.text("OH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_UTRIUM_ALKALIDE]) {
            
                        lab.room.visual.text("ZK", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_KEANIUM_ACID]) {
            
                        lab.room.visual.text("UL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_KEANIUM_ALKALIDE]) {
            
                        lab.room.visual.text("UL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_LEMERGIUM_ACID]) {
            
                        lab.room.visual.text("LH", lab.pos.x, lab.pos.y, { font: 0.3, color: "black", backgroundColor: "#00f4a2", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_LEMERGIUM_ALKALIDE]) {
            
                        lab.room.visual.text("LO", lab.pos.x, lab.pos.y, { font: 0.3, color: "black", backgroundColor: "#00f4a2", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_ZYNTHIUM_ACID]) {
            
                        lab.room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_ZYNTHIUM_ALKALIDE]) {
            
                        lab.room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_GHODIUM_ACID]) {
            
                        lab.room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_GHODIUM_ALKALIDE]) {
            
                        lab.room.visual.text("G", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    }
                    //Tier 3
                    else if (lab.store[RESOURCE_CATALYZED_UTRIUM_ACID]) {
            
                        lab.room.visual.text("XOH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_UTRIUM_ALKALIDE]) {
            
                        lab.room.visual.text("XZK", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_KEANIUM_ACID]) {
            
                        lab.room.visual.text("XUL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_KEANIUM_ALKALIDE]) {
            
                        lab.room.visual.text("XUL", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#b4b4b4", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_LEMERGIUM_ACID]) {
            
                        lab.room.visual.text("XLH", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#00f4a2", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE]) {
            
                        lab.room.visual.text("XLO", lab.pos.x, lab.pos.y, { font: 0.3, backgroundColor: "#00f4a2", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_ZYNTHIUM_ACID]) {
            
                        lab.room.visual.text("XG", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE]) {
            
                        lab.room.visual.text("XG", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_GHODIUM_ACID]) {
            
                        lab.room.visual.text("XG", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    } else if (lab.store[RESOURCE_CATALYZED_GHODIUM_ALKALIDE]) {
            
                        lab.room.visual.text("XG", lab.pos.x, lab.pos.y, { font: 0.3, color: "#b4b4b4", backgroundColor: "white", backgroundPadding: "0.1" });
            
                    }
                }
                for (let container of containers) {
            
                    var source = room.find(FIND_SOURCES);
            
                    if (container.pos.inRangeTo(container.room.controller, 2)) {
            
                        container.room.visual.circle(container.pos, {
                            fill: 'transparent',
                            radius: 0.8,
                            stroke: '#39A0ED',
                            strokeWidth: 0.125
                        });
            
                    } else if (container.pos.inRangeTo(source[0], 1)) {
            
                        container.room.visual.circle(container.pos, {
                            fill: 'transparent',
                            radius: 0.8,
                            stroke: '#2DF0C9',
                            strokeWidth: 0.125
                        });
            
                    } else if (container.pos.inRangeTo(source[1], 1)) {
            
                        container.room.visual.circle(container.pos, {
                            fill: 'transparent',
                            radius: 0.8,
                            stroke: '#2DF0C9',
                            strokeWidth: 0.125
                        });
            
                    }
                }
                for (let link of links) {
            
                    var storage = pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_STORAGE
                    });
            
                    var fullStorage = pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_STORAGE && s.store[RESOURCE_ENERGY] >= 250000
                    });
            
                    link.room.visual.text(link.store[RESOURCE_ENERGY], link.pos.x, link.pos.y, { font: 0.5, backgroundColor: "#FFD180", backgroundPadding: "0.1", align: 'center' });
            
                    if (storage) {
                        if (link.pos.inRangeTo(storage, 2)) {
            
                            link.room.visual.circle(link.pos, {
                                fill: 'transparent',
                                radius: 0.8,
                                stroke: '#39A0ED',
                                strokeWidth: 0.125
                            });
            
                        }
                    }
                    if (link.room.controller.pos.inRangeTo(link, 2)) {
            
                        link.room.visual.circle(link.pos, {
                            fill: 'transparent',
                            radius: 0.8,
                            stroke: '#39A0ED',
                            strokeWidth: 0.125
                        });
            
                    } else if (link.pos.inRangeTo(source[0], 2)) {
            
                        link.room.visual.circle(link.pos, {
                            fill: 'transparent',
                            radius: 0.8,
                            stroke: '#2DF0C9',
                            strokeWidth: 0.125
                        });
            
                    } else if (link.pos.inRangeTo(source[1], 2)) {
            
                        link.room.visual.circle(link.pos, {
                            fill: 'transparent',
                            radius: 0.8,
                            stroke: '#2DF0C9',
                            strokeWidth: 0.125
                        });
            
                    }
                }
            
                controller.room.visual.text("%" + (controller.progress / controller.progressTotal * 100).toFixed(2), controller.pos.x, controller.pos.y - 2, { align: 'center' });
            
                controller.room.visual.text(controller.level, controller.pos.x, controller.pos.y - 1, { align: 'center' });
            
                storage.room.visual.text((storage.store[RESOURCE_ENERGY] / 1000).toFixed(0) + "k", storage.pos.x, storage.pos.y, { font: 0.5, backgroundColor: "#FFD180", backgroundPadding: "0.1", align: 'center' });
            
                if (terminal) {
            
                    terminal.room.visual.text((_.sum(terminal.store) / 1000).toFixed(0) + "k", terminal.pos.x, terminal.pos.y - 1, { align: 'center' });
            
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
            
                    constructionSite.room.visual.text("%" + (constructionSite.progress / constructionSite.progressTotal * 100).toFixed(0), constructionSite.pos.x, constructionSite.pos.y - 0.25, { font: 0.5, align: 'center' });
            
                }
                for (let tower of towers) {
            
                    tower.room.visual.text(tower.store[RESOURCE_ENERGY], tower.pos.x, tower.pos.y, { font: 0.5, backgroundColor: "#FFD180", backgroundPadding: "0.1", align: 'center' });
            
                }
                for (let spawn of spawns) {
            
                    if (spawn.spawning) {
            
                        spawn.room.visual.text(spawn.spawning.remainingTime, spawn.pos.x, spawn.pos.y - 1, { align: 'center' });
            
                    }
            
                }
                for (let source of sources) {
            
                    if (source.ticksToRegeneration != undefined) {
            
                        source.room.visual.text(source.ticksToRegeneration, source.pos.x, source.pos.y - 1, { align: 'center' });
            
                    } else {
            
                        source.room.visual.text("0", source.pos.x, source.pos.y - 1, { align: 'center' });
            
                    }
            
                    source.room.visual.text(source.energy, source.pos.x, source.pos.y - 2, { align: 'center' });
            
                }
                /*
                for (let wall of walls) {
                    
                    if (wall.hits < 1000000) {
                    
                        wall.room.visual.text((wall.hits / 1000).toFixed(0) + "k", wall.pos.x, wall.pos.y - 0.25, { font: 0.5, align: 'center' });
                    
                    }
                    else {
                        
                        wall.room.visual.text((wall.hits / 1000000).toFixed(0) + "m", wall.pos.x, wall.pos.y - 0.25, { font: 0.5, align: 'center' });
                        
                    }
                }
                for (let rampart of ramparts) {
                    
                    if (rampart.hits < 1000000) {
                    
                        rampart.room.visual.text((rampart.hits / 1000).toFixed(0) + "k", rampart.pos.x, rampart.pos.y - 0.25, { font: 0.5, align: 'center' });
                    
                    }
                    else {
                        
                        rampart.room.visual.text((rampart.hits / 1000000).toFixed(0) + "m", rampart.pos.x, rampart.pos.y - 0.25, { font: 0.5, align: 'center' });
                        
                    }
                }
                */
            }
        })
    }
};