Creep.prototype.isSquadFull = function() {

    creep = this

    return creep.memory.amount == creep.memory.requiredAmount
}

Creep.prototype.findMemberCount = function(members) {

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

    for (let member of members) {

        if (member.fatigue > 0) return false
    }

    return true
}

Creep.prototype.squadInRange = function(members) {

    let lastCreep = members[0]

    for (let i = 0; i < members.length; i++) {

        let member = members[i]

        if (member.pos.getRangeTo(lastCreep) > 1) return false

        lastCreep = member
    }

    return true
}

Creep.prototype.squadEnterRoom = function(members, supporter, secondAssaulter, secondSupporter) {

    let creep = this
    let room = creep.room

    // assaulter enter room

    let enteringRoom = creep.memory.enteringRoom

    if (creep.isEdge()) {

        enteringRoom = true
        creep.memory.enteringRoom = enteringRoom
    }

    // Check if we are trying to enter a room

    if (!enteringRoom) return

    creep.memory.enteringRoom = creep.moveFromExit(members)

    // supporter enter room

    if (supporter.room.name != room.name || supporter.pos.getRangeTo(creep) > 1) {

        supporter.travel({
            origin: supporter.pos,
            goal: { pos: creep.pos, range: 1 },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: false,
            avoidStages: [],
            flee: false,
            cacheAmount: 1,
        })
    } else supporter.move(supporter.pos.getDirectionTo(creep))

    if (creep.memory.size != "quad") return true

    // secondAssaulter enter room

    if (secondAssaulter.room.name != supporter.room.name || secondAssaulter.pos.getRangeTo(supporter) > 1) {

        secondAssaulter.travel({
            origin: secondAssaulter.pos,
            goal: { pos: supporter.pos, range: 1 },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: false,
            avoidStages: [],
            flee: false,
            cacheAmount: 1,
        })
    } else secondAssaulter.move(secondAssaulter.pos.getDirectionTo(supporter))


    // secondSupporter enter room

    if (secondSupporter.room.name != secondAssaulter.room.name || secondSupporter.pos.getRangeTo(secondAssaulter) > 1) {

        secondSupporter.travel({
            origin: secondSupporter.pos,
            goal: { pos: secondAssaulter.pos, range: 1 },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: false,
            avoidStages: [],
            flee: false,
            cacheAmount: 1,
        })
    } else secondSupporter.move(secondSupporter.pos.getDirectionTo(secondAssaulter))


    return true
}

Creep.prototype.squadTravel = function(members, supporter, secondAssaulter, secondSupporter, goal) {

    let creep = this
    let room = creep.room

    /* for (let member of members) member.say(member.memory.part) */

    // Move assaulter

    if (creep.squadCanMove(members) && creep.squadInRange(members)) {

        creep.travel({
            origin: creep.pos,
            goal: goal,
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: false,
            avoidStages: [],
            flee: false,
            cacheAmount: 10,
        })
    }

    // Move supporter

    if (supporter.pos.getRangeTo(creep) > 1) {

        supporter.travel({
            origin: supporter.pos,
            goal: { pos: creep.pos, range: 1 },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: room.memory.defaultCostMatrix,
            avoidStages: [],
            flee: false,
            cacheAmount: 1,
        })
    } else {

        supporter.move(supporter.pos.getDirectionTo(creep))
    }

    // Move secondAssaulter

    if (secondAssaulter.pos.getRangeTo(supporter) > 1) {

        secondAssaulter.travel({
            origin: secondAssaulter.pos,
            goal: { pos: supporter.pos, range: 1 },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: room.memory.defaultCostMatrix,
            avoidStages: [],
            flee: false,
            cacheAmount: 1,
        })
    } else {

        secondAssaulter.move(secondAssaulter.pos.getDirectionTo(supporter))
    }

    // Move secondSupporter

    if (secondSupporter.pos.getRangeTo(secondAssaulter) > 1) {

        secondSupporter.travel({
            origin: secondSupporter.pos,
            goal: { pos: secondAssaulter.pos, range: 1 },
            plainCost: false,
            swampCost: false,
            defaultCostMatrix: room.memory.defaultCostMatrix,
            avoidStages: [],
            flee: false,
            cacheAmount: 1,
        })
    } else {

        secondSupporter.move(secondSupporter.pos.getDirectionTo(secondAssaulter))
    }
}

// Quad functions

Creep.prototype.quadMove = function() {

    let creep = this


}

Creep.prototype.quadRotate = function(membersObject) {

    let creep = this


}

Creep.prototype.quadIsInFormation = function(membersObject) {

    let creep = this

    let checkPositions = {
        left: [
            { x: -1, y: -1, part: "supporter" },
            { x: 0, y: -1, part: "secondAssaulter" },
            { x: -1, y: 0, part: "secondSupporter" },
        ],
        right: [
            { x: +1, y: +1, part: "supporter" },
            { x: +1, y: 0, part: "secondAssaulter" },
            { x: 0, y: +1, part: "secondSupporter" },
        ]
    }

    for (let directionName in checkPositions) {

        let directions = checkPositions[directionName]

        for (let pos of directions) {

            let member = membersObject[pos.part]

            let x = creep.pos.x + pos.x
            let y = creep.pos.y + pos.y

            if (member.pos.x != x || member.pos.y != y || member.room.name != room.name) {

                continue
            }
        }
    }
}

Creep.prototype.quadEnterAttackMode = function(membersObject) {

    let creep = this
    let room = creep.room

    for (let memberName in membersObject) {

        membersObject[memberName].memory.rotation = { x: 0, y: 0 }
    }

    let checkPositions = {
        left: [
            { x: -1, y: -1, part: "supporter" },
            { x: 0, y: -1, part: "secondAssaulter" },
            { x: -1, y: 0, part: "secondSupporter" },
        ],
        right: [
            { x: +1, y: +1, part: "supporter" },
            { x: +1, y: 0, part: "secondAssaulter" },
            { x: 0, y: +1, part: "secondSupporter" },
        ]
    }

    function findDirection() {

        let cm = new PathFinder.CostMatrix

        function isOpenSpace(directionName) {

            let pos = checkPositions[directionName]

            let x = creep.pos.x + pos.x
            let y = creep.pos.y + pos.y

            if (cm.get(x, y) == 255) return

            return true
        }

        for (let directionName in checkPositions) {

            if (isOpenSpace(directionName)) return directionName
        }
    }

    let directionName = findDirection()
    if (!directionName) return

    let directions = checkPositions[directionName]

    for (let pos of directions) {

        let member = membersObject[pos.part]

        let x = creep.pos.x + pos.x
        let y = creep.pos.y + pos.y

        if (member.pos.x != x || member.pos.y != y || member.room.name != room.name) {

            room.visual.circle(x, y, {})

            member.travel({
                origin: member.pos,
                goal: { pos: new RoomPosition(x, y, room.name), range: 0 },
                plainCost: false,
                swampCost: false,
                defaultCostMatrix: false,
                avoidStages: [],
                flee: false,
                cacheAmount: 1,
            })
        }
    }
}

Creep.prototype.quadRetreat = function() {


}