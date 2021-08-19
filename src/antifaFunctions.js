Creep.prototype.squadFatigued = function(squad) {

    creep = this

    let isFatigued = true

    for (let creep of squad) {


    }
}

Creep.prototype.isSquadFull = function(squad) {

    creep = this

    return squad.amount == squad.requiredAmount
}

Creep.attackMode = function(attackTarget) {

    if (creep.room.name == attackTarget) return true

    return false
}

Creep.squadPart = function() {


}