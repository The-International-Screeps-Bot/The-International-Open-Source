import { allyList, constants, remoteNeedsIndex } from "international/constants"
import { getRange } from "international/generalFunctions"
import { RemoteDefender } from "room/creeps/creepClasses"

RemoteDefender.prototype.findRemote = function() {

    const creep = this
    // If the creep already has a remote, inform true

    if (creep.memory.remoteName) return true

    // Otherwise, get the creep's role

    const role = creep.memory.role as 'remoteDefender',

    // Get remotes by their efficacy

    remoteNamesByEfficacy: string[] = Game.rooms[creep.memory.communeName]?.get('remoteNamesByEfficacy')

    // Loop through each remote name

    for (const roomName of remoteNamesByEfficacy) {

        // Get the remote's memory using its name

        const roomMemory = Memory.rooms[roomName]

        // If the needs of this remote are met, iterate

        if (roomMemory.needs[remoteNeedsIndex[role]] <= 0) continue

        // Otherwise assign the remote to the creep and inform true

        creep.memory.remoteName = roomName
        roomMemory.needs[remoteNeedsIndex[role]] -= creep.partsOfType(WORK)

        return true
    }

    // Inform false

    return false
}

RemoteDefender.prototype.advancedHeal = function() {

    const creep = this,
    room = creep.room

    // If the creep is below max hits

    if (creep.hitsMax > creep.hits) {

        // Have it heal itself and stop

        creep.heal(creep)
        return
    }

    // Find adjacent creeps

    const adjacentCreeps = room.lookForAtArea(LOOK_CREEPS, creep.pos.y - 1, creep.pos.x - 1, creep.pos.y + 1, creep.pos.x + 1, true)

    // Loop through each adjacentCreep

    for (const posData of adjacentCreeps) {

        // If the creep is the posData creep, iterate

        if (creep.id == posData.creep.id) continue

        // If the creep is not owned and isn't an ally

        if (!posData.creep.my && !allyList.has(posData.creep.owner.username)) continue

        // If the creep is at full health, iterate

        if(posData.creep.hitsMax == posData.creep.hits) continue

        // have the creep heal the adjacentCreep and stop

        creep.heal(posData.creep)
        return
    }

    const top = Math.max(Math.min(creep.pos.y - 3, constants.roomDimensions - 2), 2),
    left = Math.max(Math.min(creep.pos.x - 3, constants.roomDimensions - 2), 2),
    bottom = Math.max(Math.min(creep.pos.y + 3, constants.roomDimensions - 2), 2),
    right = Math.max(Math.min(creep.pos.x + 3, constants.roomDimensions - 2), 2)

    // Find my creeps in range of creep

    const nearbyCreeps = room.lookForAtArea(LOOK_CREEPS, top, left, bottom, right, true)

    // Loop through each nearbyCreep

    for (const posData of nearbyCreeps) {

        // If the creep is the posData creep, iterate

        if (creep.id == posData.creep.id) continue

        // If the creep is not owned and isn't an ally

        if (!posData.creep.my && !allyList.has(posData.creep.owner.username)) continue

        // If the creep is at full health, iterate

        if(posData.creep.hitsMax == posData.creep.hits) continue

        // have the creep rangedHeal the nearbyCreep and stop

        creep.rangedHeal(posData.creep)
        return
    }
}

RemoteDefender.prototype.advancedAttackAttackers = function() {

    const creep = this,
    room = creep.room,

    // Get enemyAttackers in the room

    enemyAttackers = room.find(FIND_HOSTILE_CREEPS, {
        filter: creep => !allyList.has(creep.owner.username) && !creep.isOnExit() && creep.hasPartsOfTypes([ATTACK, RANGED_ATTACK])
    })

    // If there are none

    if (!enemyAttackers.length) {

        // Heal nearby creeps

        creep.advancedHeal()

        const enemyCreeps = (room.get('enemyCreeps') as Creep[]).filter(enemyCreep => !enemyCreep.isOnExit())
        if (!enemyCreeps.length) return false

        const enemyCreep = creep.pos.findClosestByRange(enemyCreeps),

        // Get the range between the creeps

        range = getRange(creep.pos.x - enemyCreep.pos.x, creep.pos.y - enemyCreep.pos.y)

        // If the range is more than 1

        if (range > 1) {

            creep.rangedAttack(enemyCreep)

            // Have the create a moveRequest to the enemyAttacker and inform true

            creep.createMoveRequest({
                origin: creep.pos,
                goal: { pos: enemyCreep.pos, range: 1 }
            })

            return true
        }

        creep.rangedMassAttack()
        creep.move(creep.pos.getDirectionTo(enemyCreep.pos))

        return true
    }

    // Otherwise, get the closest enemyAttacker

    const enemyAttacker = creep.pos.findClosestByRange(enemyAttackers),

    // Get the range between the creeps

    range = getRange(creep.pos.x - enemyAttacker.pos.x, creep.pos.y - enemyAttacker.pos.y)

    // If it's more than range 3

    if (range > 3) {

        // Heal nearby creeps

        creep.advancedHeal()

        // Make a moveRequest to it and inform true

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: enemyAttacker.pos, range: 1 }
        })

        return true
    }

    // Otherwise, have the creep pre-heal itself

    creep.heal(creep)

    // If the range is 1, rangedMassAttack

    if (range == 1) {

        creep.rangedMassAttack()
        creep.move(creep.pos.getDirectionTo(enemyAttacker.pos))
    }

    // Otherwise, rangedAttack the enemyAttacker

    else creep.rangedAttack(enemyAttacker)
/*
    // If the creep is out matched

    if (creep.strength < enemyAttacker.power()) {

        flee()
    }
 */
    // If the creep has less heal power than the enemyAttacker's attack power

    if (creep.findStrength() < enemyAttacker.findStrength()) {

        // If the range is less or equal to 2

        if (range <= 2) {

            // Have the creep flee and inform true

            creep.createMoveRequest({
                origin: creep.pos,
                goal: { pos: enemyAttacker.pos, range: 1 },
                flee: true
            })

            return true
        }
    }

    // If the range is more than 1

    if (range > 1) {

        // Have the create a moveRequest to the enemyAttacker and inform true

        creep.createMoveRequest({
            origin: creep.pos,
            goal: { pos: enemyAttacker.pos, range: 1 }
        })

        return true
    }

    // Otherwise inform true

    return true
}
