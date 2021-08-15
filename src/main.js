let config = require("config")

require("commands")

let globalManager = require("globalManager")

let roomManager = require("roomManager")

let powerCreeps = require("module.powerCreeps")

let informationManager = require("informationManager")

let data = require("data")
let logging = require("logging")

module.exports.loop = function() {

    //

    let cpuUsed = Game.cpu.getUsed().toFixed(2)

    console.log("start: " + cpuUsed)

    //

    cpuUsed = Game.cpu.getUsed()

    config()

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("config: " + cpuUsed)

    //

    cpuUsed = Game.cpu.getUsed()

    globalManager()

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("globalManager: " + cpuUsed)

    //

    cpuUsed = Game.cpu.getUsed()

    let { consoleMessage } = roomManager()

    console.log(consoleMessage)

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("roomManager: " + cpuUsed)

    //

    cpuUsed = Game.cpu.getUsed()

    powerCreeps.run()

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("powerCreeps: " + cpuUsed)

    //

    informationManager()

    cpuUsed = Game.cpu.getUsed()

    data()

    cpuUsed = (Game.cpu.getUsed() - cpuUsed).toFixed(2)

    console.log("data: " + cpuUsed)

    //

    cpuUsed = Game.cpu.getUsed()

    logging()

    Memory.data.cpuUsage = Game.cpu.getUsed().toFixed(2)
}