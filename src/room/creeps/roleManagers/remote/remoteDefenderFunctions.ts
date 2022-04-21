import { allyList, remoteNeedsIndex } from "international/constants"
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
    room = creep

    // If the creep is below max hits

    if (creep.hits < creep.hitsMax) {

        // Have it heal itself and stop

        creep.heal(creep)
        return
    }

    // Find adjacent creeps

    const adjacentCreeps = room.lookForAtArea(LOOK_CREEPS, creep.pos.y - 1, creep.pos.x - 1, creep.pos.y + 1, creep.pos.x + 1, true)

    // Loop through each adjacentCreep

    for (const adjacentCreep of adjacentCreeps) {

        // have the creep heal the adjacentCreep and stop

        creep.heal(adjacentCreep)
        return
    }

    // Find my creeps in range of creep

    const nearbyCreeps = room.lookForAtArea(LOOK_CREEPS, creep.pos.y - 3, creep.pos.x - 3, creep.pos.y + 3, creep.pos.x + 3, true)

    // Loop through each nearbyCreep

    for (const nearbyCreep of nearbyCreeps) {

        // have the creep rangedHeal the nearbyCreep and stop

        creep.rangedHeal(nearbyCreep)
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

    // If there are none, inform false

    if (!enemyAttackers.length) return false

    // Otherwise, get the closest enemyAttacker

    const enemyAttacker = creep.pos.findClosestByRange(enemyAttackers),

    // Get the range between the creeps

    range = getRange(creep.pos.x - enemyAttacker.pos.x, creep.pos.y - enemyAttacker.pos.y)

    // If it's more than range 3

    if (range > 3) {

        // Heal nearby creeps

        creep.healNearbyCreeps()

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

    if (range == 1) creep.rangedMassAttack()

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
