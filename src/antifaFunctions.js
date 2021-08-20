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

    let definedMembers = members.filter(member => {
        if (member != null) return member
    })

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

        assaulter.memory.secondAssaulter = creep.name
        assaulter.memory.secondSupporter = creep.memory.supporter

        creep.memory.secondAssaulter = assaulter.name
        creep.memory.secondSupporter = assaulter.memory.supporter

        return true
    }
}