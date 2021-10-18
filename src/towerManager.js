require("towerFunctions")

module.exports = function towerManager(room) {

    let towers = room.get("towers")

    // Stop if there are no towers

    if (towers.length == 0) return

    //

    if (room.attackEnemys(towers)) return

    if (room.healCreeps(towers)) return

    if (room.healPowerCreeps(towers)) return

    if (room.repairEcoStructures(towers)) return

    if (room.repairRamparts(towers)) return
}