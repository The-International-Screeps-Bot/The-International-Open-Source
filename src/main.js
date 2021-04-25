require("prototype.tower")
require("prototype.terminal")
let cleanMemory = require("module.cleanMemory")
let visuals = ("module.roomVisuals")
let spawns = require("module.spawning")
let roles = require("module.roles")
let constants = require("module.constants")
let labs = require("module.labs")
let links = require("module.links")
let construction = require("module.construction")

let allyList = require("module.allyList")

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
            
            roles.run(roles)

            console.log("roles: " + Game.cpu.getUsed().toFixed(2))

            console.log('--------------------------------------------------------')

            if (Game.time % 10 == 0) {

                cleanMemory.run(cleanMemory)
            }

            console.log("cleanMemory: " + Game.cpu.getUsed().toFixed(2))

            if (Game.time % 10 == 0) {

                construction.run(construction)
            }

            console.log("construction: " + Game.cpu.getUsed().toFixed(2))
                /*
                var storages = _.filter(Game.structures, s => s.structureType == STRUCTURE_STORAGE);

                for (let storage of storages) {

                    storage.visuals()
                    console.log("storage: " + Game.cpu.getUsed().toFixed(2))

                }*/

            if (Game.time % 1 == 0) {

                var terminals = _.filter(Game.structures, s => s.structureType == STRUCTURE_TERMINAL);

                for (let terminal of terminals) {

                    terminal.market()

                }
            }

            console.log("terminals: " + Game.cpu.getUsed().toFixed(2))

            if (Game.time % 1 == 0) {

                constants.run(constants)

            }

            console.log("constants: " + Game.cpu.getUsed().toFixed(2))

            links.run(links)

            console.log("links: " + Game.cpu.getUsed().toFixed(2))

            labs.run(labs)

            console.log("labs: " + Game.cpu.getUsed().toFixed(2))

            var towers = _.filter(Game.structures, s => s.structureType == STRUCTURE_TOWER);

            for (let tower of towers) {

                tower.defend()
            }

            console.log("towers: " + Game.cpu.getUsed().toFixed(2))

            spawns.run(spawns)

            console.log("spawns: " + Game.cpu.getUsed().toFixed(2))
            
            function myRoomsNumber() {
                
                let i = 0
                
                _.forEach(Game.rooms, function (room) {
                    
                    if (room.controller && room.controller.my) {
                        
                        i++
                    }
                })
                
                return i
            }
            
            function harvestedOverTime() {
                
                if (Game.time % 1000 == 0) {
                
                       
                }
            }
            
            function cpuMessage() {
                
                let cpuMessage
                let cpu = Game.cpu.getUsed()
                let cpuTotal = Game.cpu.limit
                
                if (cpu <= cpuTotal * 0.3) {
                    
                    cpuMessage = `<th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px; color: rgba(11, 218, 32, 1);">CPU: ` + Game.cpu.getUsed().toFixed(2) + " / " + Game.cpu.limit + `</th>`
                    return cpuMessage
                }
                else if (cpu <= cpuTotal * 0.7) {
                    
                    cpuMessage = `<th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px; color: rgba(243, 235, 18, 1);">CPU: ` + Game.cpu.getUsed().toFixed(2) + " / " + Game.cpu.limit + `</th>`
                    return cpuMessage
                }
                else {
                    
                    cpuMessage = `<th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px; color: rgba(243, 40, 18, 1);">CPU: ` + Game.cpu.getUsed().toFixed(2) + " / " + Game.cpu.limit + `</th>`
                    return cpuMessage
                }
            }
            
            function cpuBucketMessage() {
                
                let cpuMessage
                let cpu = Game.cpu.bucket
                let cpuTotal = 10000
                
                if (cpu >= cpuTotal * 0.7) {
                    
                    cpuMessage = `<th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px; color: rgba(11, 218, 32, 1);">CPU Bucket: ` + Game.cpu.bucket + `</th>`
                    return cpuMessage
                }
                else if (cpu >= cpuTotal * 0.3) {
                    
                    cpuMessage = `<th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px; color: rgba(243, 235, 18, 1);">CPU Bucket: ` + Game.cpu.bucket + `</th>`
                    return cpuMessage
                }
                else {
                    
                    cpuMessage = `<th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px; color: rgba(243, 40, 18, 1);">CPU Bucket: ` + Game.cpu.bucket + `</th>`
                    return cpuMessage
                }
            }
            
            function energyAmount() {
                
                let energyAmount = `<th style="text-align: center; padding: 5px 0; color: #FFD180;">Total Energy: ` + (Memory.global.totalEnergy / 1000).toFixed(0) + "k"+ `</th>`
                return energyAmount
            }

            console.log('--------------------------------------------------------')
            console.log(`
            <table style="background: rgba(255, 255, 255, 0.12); padding: 12px; border-radius: 2px; width: 90vw; box-shadow: rgba(255, 255, 255, 0.12) 0 0 0 7px; overflow: hidden; font-family: sans-serif; margin-left: 5px;">
                <tr style="background: rgba(44, 97, 242, 1);">
                    <th style="color: white; font-size: 15px; text-align: center; padding: 6px 0px; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">General</th>
                    <th style="color: white; font-size: 15px; text-align: center; padding: 6px 0px;">Economy</th>
                    <th style="color: white; font-size: 15px; text-align: center; padding: 6px 0px;">Military</th>
                    <th style="color: white; font-size: 15px; text-align: center; padding: 6px 0px;">Market</th>
                    <th style="color: white; font-size: 15px; text-align: center; padding: 6px 0px; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Allies</th>
                </tr>
                <tr>
                    <th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Stage: ` + Memory.global.globalStage + ` <br /> Time: ` + Game.time % 10 + `</th>
                    ` + energyAmount() + `
                    <th style="text-align: center; padding: 5px 0;">Last Defence: ` + "x ticks ago, room y" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Total CR: ` + (Game.market.credits / 1000).toFixed(0) + "k" + `</th>
                    <th style="text-align: center; padding: 5px 0; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Alles: ` + allyList.run(allyList) + `</th>
                </tr>
                <tr style="background: #333">
                    <th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Creeps: ` + Object.keys(Memory.creeps).length + " (" + Math.floor(Object.keys(Memory.creeps).length / myRoomsNumber()) + " / room)" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Total Boosts: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Last Attack: ` + "x ticks ago, room y" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Market Offers: ` + Object.keys(Game.market.orders).length + `</th>
                    <th style="text-align: center; padding: 5px 0; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Economy Need: ` + "true / false" + `</th>
                </tr>
                <tr>
                    ` + cpuMessage() + `
                    <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Military Need: ` + "true / false" + `</th>
                </tr>
                <tr style="background: #333">
                    ` + cpuBucketMessage() + `
                    <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Trade Need: ` + "true / false" + `</th>
                </tr>
                <tr>
                    <th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Rooms: ` + Memory.global.roomCount + " / " + Game.gcl.level + " (%" + (Game.gcl.progress / Game.gcl.progressTotal * 100).toFixed(0) + " GCL)" + ` <br /> ` + "(" + Memory.global.establishedRooms + " Established)" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Time: ` + "x" + `</th>
                </tr>
            </table>
            `)
            
                /*
                <tr>
                    <th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Time: ` + "x" + `</th>
                </tr>
                <tr style="background: #333">
                    <th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                    <th style="text-align: center; padding: 5px 0; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Time: ` + "x" + `</th>
                </tr>
                */
            
                //});
        }
    }
    /*
    //-----------------------------------------------------------------------------------------------

Market:

    Game.market.cancelOrder("orderid")

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


    */