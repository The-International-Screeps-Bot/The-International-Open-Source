import { RoomTransferTask } from './roomTasks'

Room.prototype.towersRequestResources = function () {
     // Get and loop through each tower

     for (const tower of this.structures.tower) {
          // if there is no global for the tower, make one

          if (!global[tower.id]) global[tower.id] = {}

          // If there is no created task ID obj for the tower's global, create one

          if (!global[tower.id].createdTaskIDs) global[tower.id].createdTaskIDs = {}
          // Otherwise
          else {
               // Find the towers's tasks of type tansfer

               const towersTransferTasks = this.findTasksOfTypes(
                    global[tower.id].createdTaskIDs,
                    new Set(['transfer']),
               ) as RoomTransferTask[]

               // Track the amount of energy the resource has offered in tasks

               let totalResourcesRequested = 0

               // Loop through each pickup task

               for (const task of towersTransferTasks) {
                    // Otherwise find how many resources the task has requested to pick up

                    totalResourcesRequested += task.taskAmount
               }

               // If there are more or equal resources offered than the free energy capacity of the tower, iterate

               if (totalResourcesRequested >= tower.store.getFreeCapacity(RESOURCE_ENERGY)) continue
          }

          // Get the amount of energy the tower needs at a max of the hauler's capacity

          const taskAmount = Math.min(tower.store.getFreeCapacity(RESOURCE_ENERGY))

          // If the taskAmount is more than 0

          if (taskAmount > 0) {
               // Create a new transfer task for the tower

               new RoomTransferTask(this.name, RESOURCE_ENERGY, taskAmount, tower.id, 8)
          }
     }
}

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
     if (this.controller.safeMode) return

     // Construct attack targets from my and allied damaged creeps in the this

     const attackTargets = this.enemyCreeps.filter(function (creep) {
          return !creep.isOnExit()
     })

     if (!attackTargets.length) return

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
