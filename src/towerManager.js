require("towerFunctions")

function towerManager(room) {

    let towers = room.get("towers")

    if (towers.length == 0) return

    if (room.attackHostiles(towers)) return

    if (room.healCreeps(towers)) return

    if (room.healPowerCreeps(towers)) return

    if (room.repairEcoStructures(towers)) return

    if (room.repairRamparts(towers)) return
}

module.exports = towerManager