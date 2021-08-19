require("antifaFunctions")

function antifaManager(room, antifa) {

    // Make sure there is something to attack

    if (!Memory.global.attackTarget) return "No attack target"

    let assaulter = antifa.assaulters
    let supporters = antifa.supporters

    for (let creep of supporters) {


    }
    for (let creep of assaulter) {

        // Define useful variables

        const roomFrom = creep.memory.roomFrom
        const attackTarget = Memory.global.attackTarget
        const squad = creep.memory.squad

        if (room.name == attackTarget) {

            // Creep is in room to attack


        } else if (room.name == roomFrom) {

            // Creep is at home


        } else {

            // Creep is traveling to attackTarget

        }
    }
}