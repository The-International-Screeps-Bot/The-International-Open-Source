Creep.prototype.findHostile = function() {

    let creep = this
    let room = creep.room

    let enemyCreeps = room.find(FIND_HOSTILE_CREEPS, {
        filter: enemyCreep => !allyList.includes(enemyCreep.owner.username) && enemyCreep.hasPartsOfTypes([ATTACK, RANGED_ATTACK, WORK, CARRY, CLAIM, HEAL])
    })

    if (enemyCreeps.length == 0) return []

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

Creep.prototype.healMyCreeps = function(enemyAttacker) {

    let creep = this
    let room = creep.room

    if (enemyAttacker && creep.pos.getRangeTo(enemyAttacker) <= 3) {

        creep.heal(creep)
        return
    }

    if (findAndHealDamagedCreepsInRange()) return

    function findAndHealDamagedCreepsInRange() {

        let myDamagedCreeps = room.find(FIND_MY_CREEPS, {
            filter: myCreep => myCreep.hits < myCreep.hitsMax
        })

        if (myDamagedCreeps.length == 0) return

        let closestDamagedCreep = creep.pos.findClosestByRange(myDamagedCreeps)

        if (creep.pos.getRangeTo(closestDamagedCreep) == 1) {

            creep.heal(closestDamagedCreep)
            return true
        }

        creep.rangedHeal(closestDamagedCreep)
        return true
    }
}

Creep.prototype.attackHostiles = function(enemyCreeps, enemyCreep, enemyAttacker) {

    let creep = this
    let room = creep.room

    if (attackEnemyAttacker()) return true

    function attackEnemyAttacker() {

        if (!enemyAttacker) return

        if ((enemyAttacker.hasActivePartsOfTypes([ATTACK]) || enemyAttacker.getActiveBodyparts(RANGED_ATTACK) >= creep.findParts("rangedAttack")) && creep.pos.getRangeTo(enemyAttacker) <= 2) {

            creep.advancedPathing({
                origin: creep.pos,
                goal: { pos: enemyAttacker.pos, range: 4 },
                plainCost: 1,
                swampCost: false,
                defaultCostMatrix: false,
                avoidStages: [],
                flee: true,
                cacheAmount: 1,
            })
        } else {

            creep.advancedPathing({
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

        let enemyCreepsInRange = creep.pos.findInRange(enemyCreeps, 3)

        if (enemyCreepsInRange.length >= 3) {

            creep.rangedMassAttack()
            return true
        }

        if (creep.pos.getRangeTo(enemyAttacker) > 1) {

            creep.rangedAttack(enemyAttacker)
            return true
        }

        creep.rangedMassAttack()
        return true
    }

    if (attackEnemyCreep()) return true

    function attackEnemyCreep() {

        if (!enemyCreep) return

        creep.advancedPathing({
            origin: creep.pos,
            goal: { pos: enemyCreep.pos, range: 1 },
            plainCost: 1,
            swampCost: false,
            defaultCostMatrix: false,
            avoidStages: [],
            flee: false,
            cacheAmount: 10,
        })


        let enemyCreepsInRange = creep.pos.findInRange(enemyCreeps, 3)

        if (enemyCreepsInRange.length >= 3) {

            creep.rangedMassAttack()
            return true
        }

        if (creep.pos.getRangeTo(enemyCreep) > 1) {

            creep.rangedAttack(enemyCreep)
            return true
        }

        creep.rangedMassAttack()
        return true
    }
}

Creep.prototype.findAndAttackInvaderCores = function() {

    let invaderCores = room.find(FIND_HOSTILE_STRUCTURES, {
        filter: structure => structure.structureType == STRUCTURE_INVADER_CORE
    })

    if (!invaderCores.length > 0) return

    let invaderCore = creep.pos.findClosestByRange(invaderCores)

    if (creep.pos.getRangeTo(invaderCore) > 1) {

        creep.rangedAttack(invaderCore)

        creep.advancedPathing({
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

    creep.rangedMassAttack()
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

    let enemyCreepsInRange = creep.pos.findInRange(enemyCreeps, 3)

    if (enemyCreepsInRange.length >= 3) {

        creep.rangedMassAttack()
        return true
    }

    if (creep.pos.getRangeTo(enemyAttacker) > 1) {

        creep.rangedAttack(enemyAttacker)
        return true
    }

    creep.rangedMassAttack()
    return true
}

Creep.prototype.wait = function() {

    let creep = this
    let room = creep.room

    if (healCreeps()) return true

    function healCreeps() {

        let myDamagedCreeps = room.find(FIND_MY_CREEPS, {
            filter: myCreep => myCreep.hits < myCreep.hitsMax
        })

        if (myDamagedCreeps.length == 0) return

        let healTarget = creep.pos.findClosestByRange(myDamagedCreeps)

        if (creep.pos.getRangeTo(healTarget) > 1) {

            creep.rangedHeal(healTarget)

            creep.advancedPathing({
                origin: creep.pos,
                goal: { pos: healTarget.pos, range: 1 },
                plainCost: 1,
                swampCost: false,
                defaultCostMatrix: false,
                avoidStages: [],
                flee: false,
                cacheAmount: 10,
            })

            return true
        }

        creep.heal(healTarget)
        return true
    }

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

        creep.advancedPathing({
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

            creep.advancedPathing({
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

        creep.advancedPathing({
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