let towers = require("module.towers")
let terminals = require("module.terminals")
let cleanMemory = require("module.cleanMemory")
let visuals = require("module.roomVisuals")
let spawns = require("module.spawning")
let roles = require("module.roles")
let constants = require("module.constants")
let labs = require("module.labs")
let links = require("module.links")
let construction = require("module.construction")

let logging = require("module.logging")

const profiler = require('screeps-profiler')

//profiler.enable();
module.exports.loop = function() {
        if (Game.time % 1 == 0) {

            console.log("start: " + Game.cpu.getUsed().toFixed(2))

            //profiler.wrap(function() {
            //Game.profiler.profile(1000)
            
            if (Game.shard.name == "shard2") {
                
                if (Game.cpu.bucket == 10000) {
                    Game.cpu.generatePixel();
                }  
            }
            
            roles.run()

            console.log("roles: " + Game.cpu.getUsed().toFixed(2))

            console.log('--------------------------------------------------------')

            if (Game.time % 10 == 0) {

                cleanMemory.run()
            }

            console.log("cleanMemory: " + Game.cpu.getUsed().toFixed(2))

            construction.run()

            console.log("construction: " + Game.cpu.getUsed().toFixed(2))

            visuals.run()
            
            console.log("visuals: " + Game.cpu.getUsed().toFixed(2))
            
            if (Game.time % 10 == 0) {

                terminals.run()
            }

            console.log("terminals: " + Game.cpu.getUsed().toFixed(2))

            if (Game.time % 1 == 0) {

                constants.run()

            }

            console.log("constants: " + Game.cpu.getUsed().toFixed(2))

            links.run()

            console.log("links: " + Game.cpu.getUsed().toFixed(2))

            labs.run()

            console.log("labs: " + Game.cpu.getUsed().toFixed(2))

            towers.run()

            console.log("towers: " + Game.cpu.getUsed().toFixed(2))

            spawns.run()

            console.log("spawns: " + Game.cpu.getUsed().toFixed(2))
            
            logging.run()
            
            //console.log("logging: " + Game.cpu.getUsed().toFixed(2))
            
                //});
        }
    }
    /*
    //-----------------------------------------------------------------------------------------------

Market:

    Game.market.cancelOrder("608cf1bbab6e62255a81b72e")

    Game.market.deal('6010553cbfbe5cb167da78a1', 1200, "W17N54")

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

constants find a spot where serf can go, save it in memory

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
        
            RCL1: 20,000
            
            RCL2: 10,000
            
            RCL3: 20,000
            
            RCL4: 40,000
            
            RCL5: 80,000
            
            RCL6: 120,000
            
            RCL7: 150,000
            
            RCL8: 200,000
            
    //-----------------------------------------------------------------------------------------------
            
Notes:

    Improved upgrader code:
    
        if all creeps needed are spawned; and 75% of extensions are filled; and there is no storage all secondary tasks be transport to controllerLink or controllerContainer
        
        else if all creeps are spawned; and 75% of extensions are filled; and there is a storage; and the storage has more than 50k energy; and there is not 4 links and global stage of 0 / there are not 2 links and global stage of more than 0 have one hauler's task be controlelrLink or controllerContainer
        
        else if all creeps are spawned; and 75% of extensions are filled; and there is a storage; and the storage has more than 300k energy; and there is not 4 links and global stage of 0 / there are not 2 links and global stage of more than 0 have all secondary tasks be controllerLink or controllerContainer
        
        else if downgrade timer is less than 90% of max downgrade timer, make one task to give energy to controllerLink or controllerContainer
        
    Spawn que and multiple spawns:
    
        if less than requested creeps in room + creeps in room memory spawn que add a creep to the spawn que
        
        if creep in spawn que, loop through spawns in room. Have spawns spawn spawn que first item in array.
        
    Power bank logic:
    
        if scout spots a power bank record power bank as true in room; and the power bank has enough ttl; and there is an RCL 8 room close enough to harvest; and there aren't enemy creeps with attack / heal / rangedAttack have the scout record in the nearby RCL 8 room memory powerBank: { active: true, roomName: scout.room.name }
        
    Deposit logic:
    
        a
        
    Squad code logic:
    
        a
        
    
    
    

    */