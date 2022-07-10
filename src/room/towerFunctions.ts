

Room.prototype.towersHealCreeps = function () {
     // Construct heal targets from my and allied damaged creeps in the this

     const healTargets = this.find(FIND_MY_CREEPS)
          .concat(this.allyCreeps)
          .filter(function (creep) {
               return creep.hits < creep.hitsMax && !creep.isOnExit()
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

          // And iterate

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

     // Loop through the this's towers

     for (const tower of this.structures.tower) {
          // Iterate if the tower is inactionable

          if (tower.inactionable) continue

          if (tower.attack(attackTarget) !== OK) continue

          // Otherwise record that the tower is no longer inactionable

          tower.inactionable = true

          // And iterate

          continue
     }
}

Room.prototype.towersRepairRamparts = function () {

     // Find ramparts at 300 hits or less

     const ramparts = this.structures.rampart.filter(function(rampart) {
          return rampart.hits <= 300
     })

     if (!ramparts.length) return

     let target

     // Loop through the this's towers

     for (const tower of this.structures.tower) {

          // Iterate if the tower is inactionable

          if (tower.inactionable) continue

          // Try to get the last element of ramparts, iterating if it's undefined
          target = ramparts[ramparts.length - 1]

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
