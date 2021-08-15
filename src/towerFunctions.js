let allyList = require("allyList")
require("roomFunctions")
require("creepFunctions")

Room.prototype.attackHostiles = function(towers) {

    let room = this

    let target

    let hostiles = room.find(FIND_HOSTILE_CREEPS, {
        filter: hostileCreep => !allyList.includes(hostileCreep.owner.username.toLowerCase()) && hostileCreep.hasPartsOfTypes([ATTACK, RANGED_ATTACK, HEAL, WORK, CARRY, CLAIM])
    })

    if (hostiles.length == 0) return false

    let enemyHealers = room.find(FIND_HOSTILE_CREEPS, {
        filter: hostileCreep => !allyList.includes(hostileCreep.owner.username.toLowerCase()) && hostileCreep.hasPartsOfTypes([HEAL])
    })

    if (enemyHealers.length > 0) {

        function findBestTarget() {

            for (let minDamage = towers.length * TOWER_POWER_ATTACK; minDamage > 100; minDamage -= 100) {

                for (let hostile of hostiles) {

                    if (room.findTowerDamage(towers, hostile.pos) - room.findHealPower(hostile.pos, 1, enemyHealers) >= minDamage) return hostile
                }
            }
        }

        target = findBestTarget()

    } else {

        const anchorPoint = room.memory.anchorPoint

        if (!anchorPoint) return false

        target = new RoomPosition(anchorPoint.x, anchorPoint.y, anchorPoint.roomName).findClosestByRange(hostiles)
    }

    if (!target) return false

    towersAttack(towers, target, "⚔️")

    return true
}

Room.prototype.healCreeps = function(towers) {

    let room = this

    if (towers[0].store[RESOURCE_ENERGY] <= (towers[0].store.getCapacity() * 0.4)) return false

    let injuredCreep = room.find(FIND_CREEPS, {
        filter: injuredCreep => (allyList.includes(injuredCreep.owner.username.toLowerCase()) || injuredCreep.my) &&
            injuredCreep.hits < injuredCreep.hitsMax - 50
    })[0]

    if (!injuredCreep) return false

    towersHeal(towers, injuredCreep, "🩺")

    return true
}

Room.prototype.healPowerCreeps = function(towers) {

    let room = this

    if (towers[0].store[RESOURCE_ENERGY] <= (towers[0].store.getCapacity() * 0.4)) return false

    let injuredPowerCreep = room.find(FIND_POWER_CREEPS, {
        filter: injuredPowerCreep => (allyList.includes(injuredPowerCreep.owner.username.toLowerCase()) || injuredPowerCreep.my) &&
            injuredPowerCreep.hits < injuredPowerCreep.hitsMax - 50

    })[0]

    if (!injuredPowerCreep) return false

    towersHeal(towers, injuredPowerCreep, "🩺")

    return true
}

Room.prototype.repairEcoStructures = function(towers) {

    let room = this

    if (towers[0].store[RESOURCE_ENERGY] <= (towers[0].store.getCapacity() * 0.7)) return false

    let lowEcoStructure = room.find(FIND_STRUCTURES, {
        filter: s => (s.structureType == STRUCTURE_ROAD || s.structureType == STRUCTURE_CONTAINER) & s.hits < s.hitsMax * 0.1
    })[0]

    if (!lowEcoStructure) return false

    towersRepair(towers, lowEcoStructure, "🔧")

    return true
}

Room.prototype.repairRamparts = function(towers) {

    let room = this

    if (towers[0].store[RESOURCE_ENERGY] <= (towers[0].store.getCapacity() * 0.6)) return false

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

        room.visual.text(visualText, tower.pos.x + 1, tower.pos.y, { align: 'left' })
    }
}

function towersHeal(towers, target, visualText) {

    for (let tower of towers) {

        tower.heal(target)

        room.visual.text(visualText, tower.pos.x + 1, tower.pos.y, { align: 'left' })
    }
}

function towersRepair(towers, target, visualText) {

    for (let tower of towers) {

        tower.repair(target)

        room.visual.text(visualText, tower.pos.x + 1, tower.pos.y, { align: 'left' })
        Memory.data.energySpentOnRepairs += 10
    }
}