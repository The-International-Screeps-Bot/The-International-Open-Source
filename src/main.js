let towers = require("module.towers")
let terminals = require("module.terminals")
let factories = require("module.factories")
let cleanMemory = require("module.cleanMemory")
let visuals = require("module.roomVisuals")
let spawns = require("module.spawning")
let powerSpawns = require("module.powerSpawning")
let constants = require("module.constants")
let labs = require("module.labs")
let links = require("module.links")
let construction = require("module.construction")

let roles = require("module.roles")
let powerCreeps = require("module.powerCreeps")

let stats = require("module.stats")
let logging = require("module.logging")

const profiler = require('screeps-profiler')

//profiler.enable();
module.exports.loop = function() {

    let cpuUsed = Game.cpu.getUsed().toFixed(2)

    console.log("start: " + cpuUsed)

    cpuUsed = Game.cpu.getUsed()

    if (Game.shard.name == "shard2") {

        if (Game.cpu.bucket == 10000) {
            Game.cpu.generatePixel();
        }
    }

    if (Game.time % 10 == 0) {

        cleanMemory.run()
    }

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("cleanMemory: " + cpuUsed)

    cpuUsed = Game.cpu.getUsed()

    stats.run()

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("stats: " + cpuUsed)

    cpuUsed = Game.cpu.getUsed()

    roles.run()

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("roles: " + cpuUsed)

    cpuUsed = Game.cpu.getUsed()

    powerCreeps.run()

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("powerCreeps: " + cpuUsed)

    cpuUsed = Game.cpu.getUsed()

    console.log('--------------------------------------------------------')

    if (Game.time % 100 == 0) {

        construction.run()
    }

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("construction: " + cpuUsed)

    cpuUsed = Game.cpu.getUsed()

    visuals.run()

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("visuals: " + cpuUsed)

    cpuUsed = Game.cpu.getUsed()

    if (Game.time % 10 == 0) {

        terminals.run()
    }

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("terminals: " + cpuUsed)

    cpuUsed = Game.cpu.getUsed()

    if (Game.time % 1 == 0) {

        factories.run()

    }

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("factories: " + cpuUsed)

    cpuUsed = Game.cpu.getUsed()

    if (Game.time % 1 == 0) {

        constants.run()

    }

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("constants: " + cpuUsed)

    cpuUsed = Game.cpu.getUsed()

    links.run()

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("links: " + cpuUsed)

    cpuUsed = Game.cpu.getUsed()

    labs.run()

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("labs: " + cpuUsed)

    cpuUsed = Game.cpu.getUsed()

    powerSpawns.run()

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("powerSpawns: " + cpuUsed)

    cpuUsed = Game.cpu.getUsed()

    towers.run()

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("towers: " + cpuUsed)

    cpuUsed = Game.cpu.getUsed()

    spawns.run()

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("spawns: " + cpuUsed)

    cpuUsed = Game.cpu.getUsed()

    logging.run()

    Memory.stats.cpuUsage = Game.cpu.getUsed().toFixed(2)

}

/*

----------[NOTES]----------

    //-----------------------------------------------------------------------------------------------

Market:

    Game.market.cancelOrder("608cf1bbab6e62255a81b72e")

    Game.market.deal('609d1bb45df65e23335ad5a1', 1200, "W17N54")

    Game.rooms['W17N52'].terminal.send(RESOURCE_ENERGY, 30000, 'W17N54','Reason')

    Game.market.createOrder({type: ORDER_SELL, resourceType: PIXEL, price: 1000, totalAmount: 750, roomName: "E25N2"})
    
    //-----------------------------------------------------------------------------------------------

Claim Room:

    Game.spawns.Spawn1.memory.claimRoom = "W17N52"

    Create New Spawner Memory:

    Game.spawns.Spawn2.memory.minimumNumberOfMiners = 1
    
    //-----------------------------------------------------------------------------------------------
    
Flags:

    RDP = Ranged Defensive Position
    MDP = Melee Defensive Position
    AR = Attack Room
    BB = Big Boy Attack

    BR = Build Room

    S = Add Message To Room
    
    //-----------------------------------------------------------------------------------------------
    
Bunker:

    https://screeps.admon.dev/building-planner/?share=N4IgdghgtgpiBcIDqBGA7AOQKwBYQBoQB3AewCcAbAEwRCihIJAGcALCMmxNjqgZiZkAxhQQAOQgCMArgEtqssAHNmCUBUUBrNSAAOJVfADaoAB4I+fQgE8LAJgC+AXQeEyJCF1D7DJkOfhLGwsUVzMLLGDAvjD-CwA2KL4cWIC+OySABlSLNCSsHMCUKLsATkK+PJBbQMd8cPg7CWqEMsKcTPyKqpq+MQrEluiK4qH0ioyx0Pq4+A6klJmA+bGYpYQV3rqGzZDCpqS1hoOx7dmT3unj5t7s9cCcJLO0yKmKq1WRkvj374rHoZ2H73PivGpAiZ-EEfXr9EEA2EVMEWOENPiDREg5EPf5deElcogm57EGlLL7MljRZozqfIlJYE0kqo2ZBMaM1nYpoDEpoCqU3p8+ljFnLWm9DkBC6tUUWcWtSWtAWtIU7Sa9Qlo9W5X5jO5o0YSirywIFYXgzWsnoyilJVWsw0o41JWWNYmBRVuvFo62NT19KFo5WNe1i5ntE1tFyEAAuJCIMDIOh8CD8aRhFmpnPJIO1OJBGLluLpaIRe2jIAoEEkyYMqbRhdqPLeIN9fCuVpzaPdfH1nZLrJ7zxRh35SQ7aWD4wrMcTUEUEFE8G8deMPoWzlcLF0ECIYFrvlLG-xeshp03hGYcbIECUcGXelXaYiTwv4GkmkTB-rrLzljfJCSMwiYAG5fg+KZrr+BJvgAZhAQjXjUK6Hg65IVvoCZkAAyjue7flBaSNqCb4wKYs5gMwsgkPuEFPlq4b3GUo5MVOE5yl2rIZoEoa5Ha3QMl8gKupUvK2oClppJGkkWFOZrdt6g7HkGMHQmJIImuMrGvqSLEGnpXGKS8RkJPxWKqQ2FnQYCvGNFOfZpGWbpCZcxZGuZ7JjlSzbuWi2KVC5OraWM8loTZSLqWi3Hcie4K2b245nr0oVpI6+ZHmM8WabZzGecF4IiZG8XunY8XBjFKl5QpmXOt5GmCeaNpqRJAktQWjEMVVYXJW+N5QDuZAxgRRguA4DhAA

Base:

    https://screeps.admon.dev/building-planner/?share=N4IgdghgtgpiBcIDqAWAHAOQKxpAGhAHcB7AJwBsATBEKKY-EAZwAsJTrFX3KBmR0gGNyCNAQBGAVwCWVaWADmTBKFLEInUAAdiy+AG1QADwS8UBAJ4IAjAE4AvnmOnrlmw6cgT8XgCY38NZojs4+vAFBIV6m5iBWgQDsUd684XE2AGzJpv7pgVmeKa551ljZPrHxpeW8xVVJhaYZAcGNPgktNWJ5HqG83fENfR15BX3NozVYAUPRPtM9UwFlbf3LSyWzKQAMEVsxMzW2h6sjVbxdEShHESuhKLlV120PERcvjza+NWdflyXWG4A8ooOo2QEvXYlMZzUERGHeV4lO6wqFVQEAXUcIEExDATAALqRJIICTBKEgIOQRPBtLoEPosQRyPIANYqEA6PSGOapPY-E73MGBC5MkAwIxk-HSPEcrkMvrHPIolJK+LPPoDBAa3m-eA6lJ6lWmNUIBGmLXwc0+U3wVqazqrW29Xm26zbf5VD2nCLe4YBF0pCbxQNNX0bL01So2P286PwUMVR19Bbxe284PamqZ+DG+YBA0HPKFpOTVbxvO8NHuGrV+C+WNFAINmqfeuNnIRRNViLppslPumNJVbvDhAt8vNjv5vITlNdiM2QelqrLszwxf5TfVVapmwl9clA9jwIHts7vrng-C6wHuu32u3R-Qmon6piwlkCAKOC0zn0gwhSuewxQJYhCBgUg5QAnlET1ax3nueCSxQe8gSqcpfD1RMsPDMVcTAAkIHkSDoO5cZBV5c8klAyCoHkKkyIVVEIm+D8tAgQgwCYwDeT3K0ahva1eDdNjsXICBxB42CLSfH0jwFZFPUydCVNWS0ENUkUtIfSFgL0pSxWIcQmEggA3Ui-3lXiUg0sSCB0CDSAAZQ4rjpPuc9MWxAAzCBSTIeI6XI2Eb3s8BJFZSzguYxEbzKMVSGgDjSAJaSsXsewgA

[MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]

constants find a spot where stationaryHauler can go, save it in memory

    //-----------------------------------------------------------------------------------------------
    
Upkeep costs:

    0.001 / tick / road, plains
    1000 roads = 1 energy
    
    0.005 / tick / road, swamp
    500 roads = 1 energy
    
    0.1 / tick / container
    10 containers = 1 energy
    
    0.03 / tick / rampart
    300 ramparts = 1 energy

    Useful Constants:
    
        Body Costs:
        
            MOVE: 50
            WORK: 100
            ATTACK: 80
            CARRY: 50
            HEAL: 250
            RANGED_ATTACK: 150
            TOUGH: 10
            CLAIM: 600
    
        Part Stats:
    
            HEAL: 12
            RANGED_HEAL: 4
            RANGED_ATTACK: 10
            ATTACK: 30
            DISMANTLE: 50
            
        T3 Boosts:
        
            catalyzed utrium acid	 + 	60	ATTACK	+300% attack effectiveness
            catalyzed utrium alkalide	 + 	60	WORK	+600% harvest effectiveness
            catalyzed keanium acid	 + 	60	CARRY	+150 capacity
            catalyzed keanium alkalide	 + 	60	RANGED_ATTACK	+300% rangedAttack and rangedMassAttack effectiveness
            catalyzed lemergium acid	 + 	65	WORK	+100% repair and build effectiveness without increasing the energy cost
            catalyzed lemergium alkalide	 + 	60	HEAL	+300% heal and rangedHeal effectiveness
            catalyzed zynthium acid	 + 	160	WORK	+300% dismantle effectiveness
            catalyzed zynthium alkalide	 + 	60	MOVE	+300% fatigue decrease speed
            catalyzed ghodium acid	 + 	80	WORK	+100% upgradeController effectiveness without increasing the energy cost
            catalyzed ghodium alkalide	 + 	150	TOUGH	-70% damage taken
            
        Important T3 Boosts:
        
            catalyzed zynthium alkalide:	   	+300% fatigue decrease speed   
            catalyzed ghodium alkalide:  	-70% damage taken                                                      
            catalyzed utrium acid:        	+300% attack effectiveness                                             
            catalyzed lemergium alkalide:    +300% heal and rangedHeal effectiveness                                        
            catalyzed keanium alkalide:	 + 	60	RANGED_ATTACK	+300% rangedAttack and rangedMassAttack effectiveness
            
        Downgrade Timers:
        
            RCL 1: 20,000
            
            RCL 2: 10,000
            
            RCL 3: 20,000
            
            RCL 4: 40,000
            
            RCL 5: 80,000
            
            RCL 6: 120,000
            
            RCL 7: 150,000
            
            RCL 8: 200,000

        RCL Values:

            RCL 1: 300

            RCL 2: 550

            RCL 3: 800

            RCL 4: 1, 300

            RCL 5: 1, 800

            RCL 6: 2, 300

            RCL 7: 5, 600

            RCL 8: 12, 900
            
    */