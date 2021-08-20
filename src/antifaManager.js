require("antifaFunctions")
let antifaAssaulterManager = require("antifaAssaulterManager")
let antifaSupporterManager = require("antifaSupporterManager")

function antifaManager(room, assaulters, supporters) {

    // Make sure there is something to attack

    if (!Memory.global.attackTarget || (assaulters.length == 0 && supporters.length == 0)) return "No attack target"

    // Run each antifa unit

    /* for (let creep of assaulters.concat(supporters)) {

        creep.suicide()
    } */

    antifaAssaulterManager(room, assaulters)

    antifaSupporterManager(room, assaulters, supporters)

}

module.exports = antifaManager