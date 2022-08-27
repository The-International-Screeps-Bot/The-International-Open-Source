import { remoteNeedsIndex } from 'international/constants'
import { findClosestObject, getRange, pack, randomIntRange } from 'international/generalFunctions'
import { RemoteDefender } from 'room/creeps/creepClasses'

export function remoteDefenderManager(room: Room, creepsOfRole: string[]) {
    for (const creepName of creepsOfRole) {
        const creep: RemoteDefender = Game.creeps[creepName]

        // Try to find a remote

        if (!creep.findRemote()) {
            // If the room is the creep's commune

            if (room.name === creep.commune) {
                // Advanced recycle and iterate

                creep.advancedRecycle()
                continue
            }

            // Otherwise, have the creep make a moveRequest to its commune and iterate

            creep.createMoveRequest({
                origin: creep.pos,
                goal: {
                    pos: new RoomPosition(25, 25, creep.commune),
                    range: 25,
                },
            })

            continue
        }

        creep.say(creep.memory.remote)

        // Try to attack enemyAttackers, iterating if there are none or one was attacked

        if (creep.advancedAttackEnemies()) {
            delete creep.memory.TW
            continue
        }

        // If the creep is in its remote

        if (room.name === creep.memory.remote) {

            if (!creep.memory.TW) creep.memory.TW = 0
            else creep.memory.TW += 1

            // If a random range of time has passed, find a new remote

            if (creep.memory.TW > randomIntRange(20, 100)) {

                delete creep.memory.remote

                if (creep.moveRequest) continue

                // Try to find a remote

                if (!creep.findRemote()) continue
            }
        }

        // Otherwise, create a moveRequest to its remote

        creep.createMoveRequest({
            origin: creep.pos,
            goal: {
                pos: new RoomPosition(25, 25, creep.memory.remote),
                range: 25,
            },
        })
    }
}

RemoteDefender.prototype.findRemote = function () {
    const creep = this

    // If the creep already has a remote, inform true

    if (creep.memory.remote) return true

    // Get remotes by their efficacy

    const remoteNamesByEfficacy: string[] = Game.rooms[creep.commune]?.get('remoteNamesByEfficacy')

    let roomMemory

    // Loop through each remote name

    for (const roomName of remoteNamesByEfficacy) {
        // Get the remote's memory using its name

        roomMemory = Memory.rooms[roomName]

        // If the needs of this remote are met, iterate

        if (roomMemory.needs[remoteNeedsIndex.minDamage] + roomMemory.needs[remoteNeedsIndex.minHeal] <= 0) continue

        // Otherwise assign the remote to the creep and inform true

        creep.memory.remote = roomName
        roomMemory.needs[remoteNeedsIndex.minDamage] -= creep.attackStrength
        roomMemory.needs[remoteNeedsIndex.minHeal] -= creep.healStrength

        return true
    }

    // Inform false

    return false
}

RemoteDefender.prototype.advancedAttackEnemies = function () {
    const { room } = this

    const enemyAttackers = room.enemyAttackers

    // If there are none

    if (!enemyAttackers.length) {
        const enemyCreeps = room.enemyCreeps

        if (!enemyCreeps.length) {
            return this.aggressiveHeal()
        }

        // Heal nearby creeps

        if (this.passiveHeal()) return true

        this.say('EC')

        const enemyCreep = findClosestObject(this.pos, enemyCreeps)
        // Get the range between the creeps

        const range = getRange(this.pos.x, enemyCreep.pos.x, this.pos.y, enemyCreep.pos.y)

        // If the range is more than 1

        if (range > 1) {
            this.rangedAttack(enemyCreep)

            // Have the create a moveRequest to the enemyAttacker and inform true

            this.createMoveRequest({
                origin: this.pos,
                goal: { pos: enemyCreep.pos, range: 1 },
            })

            return true
        }

        this.rangedMassAttack()
        this.moveRequest = pack(enemyCreep.pos)

        return true
    }

    // Otherwise, get the closest enemyAttacker

    const enemyAttacker = findClosestObject(this.pos, enemyAttackers)

    // Get the range between the creeps

    const range = getRange(this.pos.x, enemyAttacker.pos.x, this.pos.y, enemyAttacker.pos.y)

    // If it's more than range 3

    if (range > 3) {
        // Heal nearby creeps

        this.passiveHeal()

        // Make a moveRequest to it and inform true

        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: enemyAttacker.pos, range: 1 },
        })

        return true
    }

    this.say('AEA')

    // Otherwise, have the creep pre-heal itself

    this.heal(this)

    // If the range is 1, rangedMassAttack

    if (range === 1) {
        this.rangedMassAttack()
        this.moveRequest = pack(enemyAttacker.pos)
    }

    // Otherwise, rangedAttack the enemyAttacker
    else this.rangedAttack(enemyAttacker)

    // If the creep is out matched, try to always stay in range 3

    if (this.healStrength < enemyAttacker.attackStrength) {
        if (range === 3) return true

        if (range >= 3) {
            this.createMoveRequest({
                origin: this.pos,
                goal: { pos: enemyAttacker.pos, range: 3 },
            })

            return true
        }

        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: enemyAttacker.pos, range: 25 },
            flee: true,
        })

        return true
    }

    // If the creep has less heal power than the enemyAttacker's attack power

    if (this.healStrength < enemyAttacker.attackStrength) {
        // If the range is less or equal to 2

        if (range <= 2) {
            // Have the creep flee and inform true

            this.createMoveRequest({
                origin: this.pos,
                goal: { pos: enemyAttacker.pos, range: 1 },
                flee: true,
            })

            return true
        }
    }

    // If the range is more than 1

    if (range > 1) {
        // Have the create a moveRequest to the enemyAttacker and inform true

        this.createMoveRequest({
            origin: this.pos,
            goal: { pos: enemyAttacker.pos, range: 1 },
        })

        return true
    }

    // Otherwise inform true

    return true
}

RemoteDefender.prototype.preTickManager = function () {
    if (!this.memory.remote) return

    const role = this.role as 'remoteDefender'

    // If the creep's remote no longer is managed by its commune

    if (!Memory.rooms[this.commune].remotes.includes(this.memory.remote)) {

        // Delete it from memory and try to find a new one

        delete this.memory.remote
        if (!this.findRemote()) return
    }

    // Reduce remote need

    if (Memory.rooms[this.memory.remote].needs) {

        Memory.rooms[this.memory.remote].needs[remoteNeedsIndex.minDamage] -= this.attackStrength
        Memory.rooms[this.memory.remote].needs[remoteNeedsIndex.minHeal] -= this.healStrength
    }

    const commune = Game.rooms[this.commune]

    // Add the creep to creepsFromRoomWithRemote relative to its remote

    if (commune.creepsFromRoomWithRemote[this.memory.remote])
        commune.creepsFromRoomWithRemote[this.memory.remote][role].push(this.name)
}
