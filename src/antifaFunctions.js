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

Creep.prototype.findMembersInRoom = function(members) {

    let creep = this
    let room = creep.room

    let membersInRoom = members.filter(member => member.room.name == room.name)
    return membersInRoom
}

Creep.prototype.moveFromExit = function(members) {

    let creep = this
    let room = creep.room

    let exit = creep.memory.exit

    if (!exit || exit.roomName != room.name) {

        let exits = room.find(FIND_EXIT)

        let closestExit = creep.pos.findClosestByRange(exits)

        exit = closestExit
        creep.memory.exit = exit
    }

    let membersInRoomAmount = Math.max(1, creep.findMembersInRoom(members).length)

    let enteringRoom = true
    if (membersInRoomAmount == 4) enteringRoom = false

    if (creep.pos.getRangeTo(exit.x, exit.y) <= membersInRoomAmount) {

        creep.travel({
            origin: creep.pos,
            goal: { pos: exit, range: membersInRoomAmount },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: false,
            avoidStages: [],
            flee: true,
            cacheAmount: 1,
        })
    }

    return enteringRoom
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

Creep.prototype.findDirectionToTarget = function(target) {

    let creep = this

    let direction = creep.pos.getDirectionTo(target.x, target.y)
    return direction
}

Creep.prototype.findRampartTarget = function() {


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

Creep.prototype.quadMove = function() {


}

Creep.prototype.quadRotate = function() {


}

Creep.prototype.isQuadInFormation = function(members) {

    let creep = this

    let secondAssaulter = members.secondAssaulter
    let assaulterDirection = assaulter.pos.getRangeTo(secondAssaulter.pos.x, secondAssaulter.pos.y)

    let secondSupporter = members.secondSupporter
    let supporterDirection = assaulter.pos.getRangeTo(secondSupporter.pos.x, secondSupporter.pos.y)

    // Check left and right

    if ((assaulterDirection == LEFT && supporterDirection == BOTTOM_LEFT) || (assaulterDirection == RIGHT && supporterDirection == BOTTOM_RIGHT)) {

        return true
    }
}

Creep.prototype.quadGetInFormation = function() {


}

Creep.prototype.quadRetreat = function() {


}