Creep.prototype.findHostiles = function() {

    let creep = this
    let room = creep.room

    let enemyCreeps = room.find(FIND_HOSTILE_CREEPS, {
        filter: enemyCreep => !allyList.includes(enemyCreep.owner.username) && enemyCreep.hasPartsOfTypes([ATTACK, RANGED_ATTACK, WORK, CARRY, CLAIM, HEAL])
    })

    if (enemyCreeps.length == 0) return { enemyCreeps: enemyCreeps }

    function findClosestEnemyCreep() {

        let enemiesNotOnEdge = enemyCreeps.filter(enemyCreep => !enemyCreep.isEdge())

        if (enemiesNotOnEdge.length == 0) return false

        let enemyCreep = creep.pos.findClosestByRange(enemiesNotOnEdge)
        return enemyCreep
    }

    function findClosestEnemyAttacker() {

        let enemyAttackers = room.find(FIND_HOSTILE_CREEPS, {
            filter: enemyCreep => !allyList.includes(enemyCreep.owner.username) && enemyCreep.hasPartsOfTypes([ATTACK, RANGED_ATTACK])
        })

        if (enemyAttackers.length == 0) return false

        let enemiesNotOnEdge = enemyAttackers.filter(enemyCreep => !enemyCreep.isEdge())

        if (enemiesNotOnEdge.length == 0) return false

        let enemyAttacker = creep.pos.findClosestByRange(enemiesNotOnEdge)
        return enemyAttacker
    }

    return { enemyCreeps: enemyCreeps, enemyCreep: findClosestEnemyCreep(), enemyAttacker: findClosestEnemyAttacker() }
}

Creep.prototype.advancedAttackHostiles = function(enemyCreeps, enemyCreep, enemyAttacker) {

    let creep = this

    if (attackEnemyAttacker()) return true

    function attackEnemyAttacker() {

        if (!enemyAttacker) return

        moveToEnemy()

        function moveToEnemy() {

            if ((enemyAttacker.hasActivePartsOfTypes([RANGED_ATTACK]))) {

                if (creep.pos.getRangeTo(enemyAttacker) <= 3) {

                    creep.travel({
                        origin: creep.pos,
                        goal: { pos: enemyAttacker.pos, range: 4 },
                        plainCost: 1,
                        swampCost: false,
                        defaultCostMatrix: false,
                        avoidStages: [],
                        flee: true,
                        cacheAmount: 1,
                    })
                    return
                }

                creep.travel({
                    origin: creep.pos,
                    goal: { pos: enemyAttacker.pos, range: 4 },
                    plainCost: 1,
                    swampCost: false,
                    defaultCostMatrix: false,
                    avoidStages: [],
                    flee: false,
                    cacheAmount: 1,
                })
                return
            }

            creep.travel({
                origin: creep.pos,
                goal: { pos: enemyAttacker.pos, range: 1 },
                plainCost: 1,
                swampCost: false,
                defaultCostMatrix: false,
                avoidStages: [],
                flee: false,
                cacheAmount: 2,
            })
        }

        if (creep.pos.getRangeTo(enemyAttacker) > 1) return true

        creep.attack(enemyAttacker)
        return true
    }

    if (attackEnemyCreep()) return true

    function attackEnemyCreep() {

        if (!enemyCreep) return

        creep.travel({
            origin: creep.pos,
            goal: { pos: enemyCreep.pos, range: 1 },
            plainCost: 1,
            swampCost: false,
            defaultCostMatrix: false,
            avoidStages: [],
            flee: false,
            cacheAmount: 2,
        })

        if (creep.pos.getRangeTo(enemyCreep) > 1) return true

        creep.attack(enemyCreep)
        return true
    }
}

Creep.prototype.findAndAttackInvaderCores = function() {

    let creep = this
    let room = creep.room

    let invaderCores = room.find(FIND_HOSTILE_STRUCTURES, {
        filter: structure => structure.structureType == STRUCTURE_INVADER_CORE
    })

    if (!invaderCores.length > 0) return

    let invaderCore = creep.pos.findClosestByRange(invaderCores)

    if (creep.pos.getRangeTo(invaderCore) > 1) {

        creep.travel({
            origin: creep.pos,
            goal: { pos: invaderCore.pos, range: 1 },
            plainCost: 1,
            swampCost: false,
            defaultCostMatrix: false,
            avoidStages: [],
            flee: false,
            cacheAmount: 10,
        })

        return
    }

    creep.attack(invaderCore)
}

Creep.prototype.defendRamparts = function(enemyCreeps, enemyAttacker) {

    let creep = this
    let room = creep.room

    if (!enemyAttacker) return

    let ramparts = room.find(FIND_MY_STRUCTURES, {
        filter: structure => structure.structureType == STRUCTURE_RAMPART
    })

    if (ramparts.length == 0) return

    let cm = new PathFinder.CostMatrix

    let myCreeps = room.find(FIND_MY_CREEPS)

    for (let creep of myCreeps) {

        cm.set(creep.pos.x, creep.pos.y, 255)
    }

    cm.set(creep.pos.x, creep.pos.y, 1)

    let walkableRamparts = ramparts.filter(rampart => cm.get(rampart.pos.x, rampart.pos.y) < 255)

    if (walkableRamparts.length == 0) return

    let rampart = enemyAttacker.pos.findClosestByRange(walkableRamparts)

    let goal = _.map([rampart], function(target) {
        return { pos: target.pos, range: 0 }
    })

    if (creep.pos.getRangeTo(rampart) > 0) {

        creep.rampartPathing(creep.pos, goal)
    }

    if (creep.pos.getRangeTo(enemyAttacker) > 1) return true

    creep.attack(enemyAttacker)
    return true
}

Creep.prototype.wait = function() {

    let creep = this
    let room = creep.room

    creep.say("🚬")

    const anchorPoint = room.get("anchorPoint")

    if (waitOnRampart()) return true

    function waitOnRampart() {

        let ramparts = room.find(FIND_MY_STRUCTURES, {
            filter: structure => structure.structureType == STRUCTURE_RAMPART
        })

        if (ramparts.length == 0) return

        let cm = new PathFinder.CostMatrix

        let myCreeps = room.find(FIND_MY_CREEPS)

        for (let creep of myCreeps) {

            cm.set(creep.pos.x, creep.pos.y, 255)
        }

        cm.set(creep.pos.x, creep.pos.y, 1)

        let walkableRamparts = ramparts.filter(rampart => cm.get(rampart.pos.x, rampart.pos.y) < 255 && rampart.pos.getRangeTo(anchorPoint) == 6)

        if (walkableRamparts.length == 0) return

        let rampart = creep.pos.findClosestByRange(walkableRamparts)

        if (creep.pos.getRangeTo(rampart) == 0) return true

        creep.travel({
            origin: creep.pos,
            goal: { pos: rampart.pos, range: 0 },
            plainCost: 1,
            swampCost: false,
            defaultCostMatrix: false,
            avoidStages: [],
            flee: false,
            cacheAmount: 10,
        })

        return true
    }

    if (waitAwayFromAnchorPoint()) return true

    function waitAwayFromAnchorPoint() {

        if (creep.pos.getRangeTo(anchorPoint) == 6) return true

        if (creep.pos.getRangeTo(anchorPoint) > 6) {

            creep.travel({
                origin: creep.pos,
                goal: { pos: anchorPoint, range: 6 },
                plainCost: 1,
                swampCost: false,
                defaultCostMatrix: false,
                avoidStages: [],
                flee: false,
                cacheAmount: 10,
            })

            return true
        }

        creep.travel({
            origin: creep.pos,
            goal: { pos: anchorPoint, range: 6 },
            plainCost: 1,
            swampCost: false,
            defaultCostMatrix: false,
            avoidStages: [],
            flee: true,
            cacheAmount: 10,
        })

        return true
    }
}