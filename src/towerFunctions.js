Room.prototype.attackEnemys = function(towers) {

    room = this

    let target

    let enemys = room.find(FIND_HOSTILE_CREEPS, {
        filter: enemyCreep => !allyList.includes(enemyCreep.owner.username)
    })

    if (enemys.length == 0) return false

    let enemyHealers = room.find(FIND_HOSTILE_CREEPS, {
        filter: enemyCreep => !allyList.includes(enemyCreep.owner.username) && enemyCreep.hasPartsOfTypes([HEAL])
    })

    if (enemyHealers.length > 0) {

        // If there are healers find target that we can deal the most damage to accounting for possible healing

        function findBestTarget() {

            for (let minDamage = towers.length * TOWER_POWER_ATTACK; minDamage > 100; minDamage -= 100) {

                for (let enemy of enemys) {

                    if (enemy.isEdge()) continue

                    if (room.findTowerDamage(towers, enemy) - room.findHealPower(enemy, enemyHealers) >= minDamage) return enemy
                }
            }
        }

        target = findBestTarget()

    } else {

        // Filter enemys and find target towers can do the most damage to

        target = enemys.reduce(function(highestDamage, enemy) {
            return enemy.num > highestDamage.num ? enemy : highestDamage
        })
    }

    if (!target) return false

    towersAttack(towers, target, "⚔️")

    return true
}

Room.prototype.healCreeps = function(towers) {

    let room = this

    if (towers[0].store.getCapacity(RESOURCE_ENERGY) * 0.4 >= towers[0].store.getUsedCapacity(RESOURCE_ENERGY)) return false

    let injuredCreeps = room.find(FIND_CREEPS, {
        filter: injuredCreep => (allyList.includes(injuredCreep.owner.username) || injuredCreep.my) &&
            injuredCreep.hits < injuredCreep.hitsMax - 50
    })

    if (injuredCreeps.length == 0) return false

    towersHeal(towers, injuredCreeps[0], "🩺")

    return true
}

Room.prototype.healPowerCreeps = function(towers) {

    let room = this

    if (towers[0].store.getCapacity(RESOURCE_ENERGY) * 0.4 >= towers[0].store.getUsedCapacity(RESOURCE_ENERGY)) return false

    let injuredPowerCreep = room.find(FIND_POWER_CREEPS, {
        filter: injuredPowerCreep => (allyList.includes(injuredPowerCreep.owner.username) || injuredPowerCreep.my) &&
            injuredPowerCreep.hits < injuredPowerCreep.hitsMax - 50

    })[0]

    if (!injuredPowerCreep) return false

    towersHeal(towers, injuredPowerCreep, "🩺")

    return true
}

Room.prototype.repairEcoStructures = function(towers) {

    let room = this

    if (towers[0].store.getCapacity(RESOURCE_ENERGY) * 0.7 >= towers[0].store.getUsedCapacity(RESOURCE_ENERGY)) return false

    let lowEcoStructure = room.find(FIND_STRUCTURES, {
        filter: s => (s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_CONTAINER) & s.hits < s.hitsMax * 0.1
    })[0]

    if (!lowEcoStructure) return false

    towersRepair(towers, lowEcoStructure, "🔧")

    return true
}

Room.prototype.repairRamparts = function(towers) {

    let room = this

    if (towers[0].store.getCapacity(RESOURCE_ENERGY) * 0.6 >= towers[0].store.getUsedCapacity(RESOURCE_ENERGY)) return false

    let lowRampart = room.find(FIND_MY_STRUCTURES, {
        filter: s => s.structureType == STRUCTURE_RAMPART && s.hits <= 1000
    })[0]

    if (!lowRampart) return false

    towersRepair(towers, lowRampart, "🧱")

    return true
}

function towersAttack(towers, target, visualText) {

    for (let tower of towers) {

        tower.attack(target)

        tower.room.visual.text(visualText, tower.pos.x + 1, tower.pos.y, { align: 'left' })
    }
}

function towersHeal(towers, target, visualText) {

    for (let tower of towers) {

        tower.heal(target)

        tower.room.visual.text(visualText, tower.pos.x + 1, tower.pos.y, { align: 'left' })
    }
}

function towersRepair(towers, target, visualText) {

    for (let tower of towers) {

        tower.repair(target)

        tower.room.visual.text(visualText, tower.pos.x + 1, tower.pos.y, { align: 'left' })
        Memory.data.energySpentOnRepairs += 10
    }
}