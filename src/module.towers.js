let allyList = require("module.allyList")

module.exports = {
    run: function towers() {
        _.forEach(Game.rooms, function(room) {
            if (room.controller && room.controller.my && room.controller.level >= 3) {

                let towers = room.find(FIND_STRUCTURES, {
                    filter: s => s.structureType == STRUCTURE_TOWER
                })

                let injuredCreep = room.find(FIND_CREEPS, {
                    filter: (c) => {
                        return (allyList.run().indexOf(c.owner.username.toLowerCase()) >= 0 && creep.hits < creep.hitsMax * 1)
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

                    let hostile = room.find(FIND_HOSTILE_CREEPS, {
                        filter: (c) => {
                            return (allyList.run().indexOf(c.owner.username.toLowerCase()) === -1 && (c.body.some(i => i.type === ATTACK) || c.body.some(i => i.type === RANGED_ATTACK) || c.body.some(i => i.type === WORK) || c.body.some(i => i.type === CARRY)))
                        }
                    })[0]

                    if (hostile && (hostile.pos.inRangeTo(room.find(FIND_MY_SPAWNS)[0], 15) || hostile.hits < hostile.hitsMax * 0.75)) {

                        for (let tower of towers) {

                            tower.attack(hostile)

                            room.visual.text("⚔️ ", tower.pos.x + 1, tower.pos.y, { align: 'left' })
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

                                        room.visual.text("🔧 ", tower.pos.x + 1, tower.pos.y, { align: 'left' })
                                    }
                                }
                            }
                        }
                    }
                }
            }
        })
    }
};