Creep.prototype.squadFatigued = function(squad) {

    creep = this

    let isFatigued = true

    for (let creep of squad) {


    }
}

Creep.prototype.isSquadFull = function() {

    creep = this

    return creep.memory.amount == creep.memory.requiredAmount
}

Creep.prototype.findAmount = function(members) {

    creep = this

    let definedMembers = members.filter(member => member != null && member.name)

    creep.memory.amount = definedMembers.length
}

Creep.prototype.attackMode = function(attackTarget) {

    if (creep.room.name == attackTarget) return true

    return false
}

Creep.prototype.squadPart = function() {


}

Creep.prototype.findAssaulter = function(assaulters) {

    creep = this

    for (let assaulter of assaulters) {

        if (!Game.creeps[assaulter.memory.supporter]) {

            assaulter.memory.supporter = creep.name
            creep.memory.assaulter = assaulter.name

            return true
        }
    }

    return false
}

Creep.prototype.findDuo = function(assaulters) {

    creep = this

    for (let assaulter of assaulters) {

        if (creep == assaulter || !Game.creeps[assaulter.memory.supporter] || assaulter.memory.amount != 2) continue

        // Asign values to memory

        creep.memory.secondAssaulter = assaulter.name
        creep.memory.secondSupporter = assaulter.memory.supporter

        assaulter.memory.secondAssaulter = creep.name
        assaulter.memory.secondSupporter = creep.memory.supporter

        // Assign parts

        creep.memory.part = "front"
        Game.creeps[creep.memory.supporter].memory.part = "middle1"

        assaulter.memory.part = "middle2"
        Game.creeps[assaulter.memory.supporter].memory.part = "back"

        return true
    }
}

// Squad functions

Creep.prototype.squadCanMove = function(members) {

    for (let creep of members) {

        if (creep.fatigue > 0) return false
    }

    return true
}

Creep.prototype.squadInRange = function(members) {

    let lastCreep = members[0]

    for (let i = 0; i < members.length; i++) {

        let creep = members[i]

        if (creep.pos.getRangeTo(lastCreep) > 1) return false

        lastCreep = creep
    }

    return true
}