import { myColors } from 'international/constants'
import { customLog } from 'international/generalFunctions'

Room.prototype.towerManager = function () {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()
    
    if (!this.structures.tower.length) return

    this.towersAttackCreeps()

    this.towersHealCreeps()

    this.towersRepairRamparts()

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.CPULogging)
        customLog('Tower Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.lightGrey)
}

Room.prototype.towersHealCreeps = function () {
    // Construct heal targets from my and allied damaged creeps in the this

    const healTargets = this.myDamagedCreeps.concat(this.allyDamagedCreeps).filter(creep => {
        return creep.body.length > 1 && creep.hits < creep.hitsMax && !creep.isOnExit()
    })

    if (!healTargets.length) return

    const target = healTargets[0]

    // Loop through the this's towers

    for (const tower of this.structures.tower) {
        // Iterate if the tower is inactionable

        if (tower.inactionable) continue

        // If tower is below or equal to 50% capacity

        if (tower.store.energy <= tower.store.getCapacity(RESOURCE_ENERGY) * 0.5) continue

        // If the heal failed, iterate

        if (tower.heal(target) !== OK) continue

        // Otherwise record that the tower is no longer inactionable

        tower.inactionable = true
        continue
    }
}

Room.prototype.towersAttackCreeps = function () {
    // if (this.controller.safeMode) return

    // Construct attack targets from my and allied damaged creeps in the this

    const attackTargets = this.enemyCreeps.filter(function (creep) {
        return !creep.isOnExit()
    })

    if (!attackTargets.length) return

    // Find the target the creep can deal the most damage to

    const attackTarget = attackTargets.sort(function (a, b) {
        return a.towerDamage - b.towerDamage
    })[attackTargets.length - 1]

    if (attackTarget.towerDamage <= 0) return

    // If the strongest enemy can be damaged, record that the tower can remove all threats

    if (attackTargets[attackTargets.length - 1].towerDamage > 0) this.towerSuperiority = true

    // If we seem to be under attack from a swarm, record that the tower needs help

    if (attackTargets.length >= 15) this.towerSuperiority = false

    // Loop through the this's towers

    for (const tower of this.structures.tower) {
        // Iterate if the tower is inactionable

        if (tower.inactionable) continue

        if (tower.attack(attackTarget) !== OK) continue

        // Otherwise record that the tower is no longer inactionable

        tower.inactionable = true
        continue
    }
}

Room.prototype.towersRepairRamparts = function () {
    // Find ramparts at 300 hits or less

    const ramparts = this.structures.rampart.filter(function (rampart) {
        return rampart.hits <= RAMPART_DECAY_AMOUNT
    })

    if (!ramparts.length) return

    // Loop through the this's towers

    for (const tower of this.structures.tower) {
        // Iterate if the tower is inactionable

        if (tower.inactionable) continue

        // Try to get the last element of ramparts, iterating if it's undefined

        const target = ramparts[ramparts.length - 1]

        if (!target) continue

        // If the repair failed

        if (tower.repair(target) !== OK) continue

        // Otherwise record that the tower is no longer inactionable

        tower.inactionable = true

        // And remove the rampart from ramparts

        ramparts.pop()

        // And iterate

        continue
    }
}
