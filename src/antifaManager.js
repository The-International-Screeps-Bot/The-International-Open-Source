require("antifaFunctions")
let antifaAssaulterManager = require("antifaAssaulterManager")
let antifaSupporterManager = require("antifaSupporterManager")

function antifaManager(room, assaulters, supporters) {

    // Make sure there is something to attack

    if (!Memory.global.attackTarget) return "No attack target"

    // Run each antifa unit

    antifaAssaulterManager(room, assaulters)

    antifaSupporterManager(room, assaulters, supporters)

}

module.exports = antifaManager