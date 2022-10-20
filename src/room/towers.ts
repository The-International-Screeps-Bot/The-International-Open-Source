import { myColors } from 'international/constants'
import { globalStatsUpdater } from 'international/statsManager'
import { customLog } from 'international/utils'

class TowerManager {
    constructor() {}

    run() {}
}

Room.prototype.towerManager = function () {
    // If CPU logging is enabled, get the CPU used at the start

    if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

    if (this.flags.disableTowers) return
    if (!this.structures.tower.length) return

    this.towersAttackCreeps()

    this.towersHealCreeps()

    this.towersRepairRamparts()

    // If CPU logging is enabled, log the CPU used by this manager

    if (Memory.CPULogging)
        customLog('Tower Manager', (Game.cpu.getUsed() - managerCPUStart).toFixed(2), undefined, myColors.lightGrey)
}

Room.prototype.towersHealCreeps = function () {
    let healTargets: Creep[]

    if (this.enemyAttackers.length) {
        healTargets = this.myDamagedCreeps.filter(creep => {
            return creep.role === 'meleeDefender'
        })
    } else {
        // Construct heal targets from my and allied damaged creeps in the this

        healTargets = this.myDamagedCreeps.concat(this.allyDamagedCreeps).filter(creep => {
            return creep.body.length > 1 && creep.hits < creep.hitsMax && !creep.isOnExit
        })
    }

    if (!healTargets.length) return

    const target = healTargets[0]

    // Loop through the this's towers

    for (const tower of this.structures.tower) {
        // Iterate if the tower is intended

        if (tower.intended) continue

        if (tower.store.energy < TOWER_ENERGY_COST) continue

        // If the heal failed, iterate

        if (tower.heal(target) !== OK) continue

        // Otherwise record that the tower is no longer intended

        tower.intended = true
        continue
    }
}

Room.prototype.towersAttackCreeps = function () {
    // if (this.controller.safeMode) return

    // Construct attack targets from my and allied damaged creeps in the this

    const attackTargets = this.enemyCreeps.filter(function (creep) {
        return !creep.isOnExit
    })

    if (!attackTargets.length) return

    const towers = this.structures.tower

    // Find the target the creep can deal the most damage to

    const attackTarget = attackTargets.find(creep => creep.towerDamage > 50 * towers.length)

    if (!attackTarget) return

    // If we seem to be under attack from a swarm, record that the tower needs help

    if (attackTargets.length >= 15) this.towerSuperiority = false

    // Loop through the this's towers

    for (const tower of towers) {
        // Iterate if the tower is intended

        if (tower.intended) continue

        if (tower.store.energy < TOWER_ENERGY_COST) continue

        if (tower.attack(attackTarget) !== OK) continue

        // Otherwise record that the tower is no longer intended

        tower.intended = true
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
        // Iterate if the tower is intended

        if (tower.intended) continue

        if (tower.store.energy < TOWER_ENERGY_COST) continue

        // Try to get the last element of ramparts, iterating if it's undefined

        const target = ramparts[ramparts.length - 1]

        if (!target) continue

        // If the repair failed

        if (tower.repair(target) !== OK) continue

        // Otherwise the repair worked

        // Record the tower energy spent in stats
        globalStatsUpdater(this.name, 'eorwr', TOWER_ENERGY_COST)

        tower.intended = true
        ramparts.pop()

        // And iterate

        continue
    }
}
