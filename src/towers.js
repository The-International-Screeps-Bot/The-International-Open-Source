let allyList = require("allyList")
require("roomFunctions")
require("creepFunctions")
require("towerFunctions")

function towers(room, towers, creeps) {

    if (towers.length == 0) return

    if (room.attackHostiles(towers, creeps)) {

    } else {

        let injuredCreep = room.find(FIND_CREEPS, {
            filter: injuredCreep => {
                return (allyList.includes(injuredCreep.owner.username.toLowerCase()) || injuredCreep.my) &&
                    injuredCreep.hits < injuredCreep.hitsMax - 50
            }
        })[0]

        if (injuredCreep) {
            for (let tower of towers) {

                if (tower.energy > (tower.energyCapacity * .25)) {

                    tower.heal(injuredCreep)

                    room.visual.text("🩺 ", tower.pos.x + 1, tower.pos.y, { align: 'left' })
                }
            }
        } else {

            let injuredPowerCreep = room.find(FIND_POWER_CREEPS, {
                filter: injuredPowerCreep => {
                    return (allyList.includes(injuredPowerCreep.owner.username.toLowerCase()) || injuredPowerCreep.my) &&
                        injuredPowerCreep.hits < injuredPowerCreep.hitsMax - 50
                }
            })[0]

            if (injuredPowerCreep) {
                for (let tower of towers) {

                    if (tower.energy > (tower.energyCapacity * .25)) {

                        tower.heal(injuredPowerCreep)

                        room.visual.text("🩺 ", tower.pos.x + 1, tower.pos.y, { align: 'left' })
                    }
                }
            } else {

                let logisticStructure = room.find(FIND_STRUCTURES, {
                    filter: (s) => (s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_CONTAINER) & s.hits < s.hitsMax * 0.1
                })[0]

                if (logisticStructure) {
                    for (let tower of towers) {

                        if (tower.energy > (tower.energyCapacity * .7)) {

                            tower.repair(logisticStructure)

                            room.visual.text("🔧 ", tower.pos.x + 1, tower.pos.y, { align: 'left' })

                            Memory.data.energySpentOnRepairs += 10
                        }
                    }
                } else {

                    let lowRampart = room.find(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_RAMPART && s.hits <= 1000
                    })[0]

                    if (lowRampart) {
                        for (let tower of towers) {

                            if (tower.energy > (tower.energyCapacity * .6)) {

                                tower.repair(lowRampart)

                                room.visual.text("🧱 ", tower.pos.x + 1, tower.pos.y, { align: 'left' })

                                Memory.data.energySpentOnBarricades += 10
                            }
                        }
                    }
                }
            }
        }
    }
}

module.exports = towers