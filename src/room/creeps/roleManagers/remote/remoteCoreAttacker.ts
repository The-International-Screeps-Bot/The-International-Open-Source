import { remoteNeedsIndex } from 'international/constants'
import { getRange } from 'international/generalFunctions'
import { RemoteCoreAttacker } from 'room/creeps/creepClasses'

export function remoteCoreAttackerManager(room: Room, creepsOfRole: string[]) {
     for (const creepName of creepsOfRole) {
          const creep: RemoteCoreAttacker = Game.creeps[creepName]

          // Try to find a remote

          if (!creep.findRemote()) {
               // If the room is the creep's commune

               if (room.name === creep.memory.communeName) {
                    // Advanced recycle and iterate

                    creep.advancedRecycle()
                    continue
               }

               // Otherwise, have the creep make a moveRequest to its commune and iterate

               creep.createMoveRequest({
                    origin: creep.pos,
                    goal: {
                         pos: new RoomPosition(25, 25, creep.memory.communeName),
                         range: 25,
                    },
               })

               continue
          }

          creep.say(creep.memory.remoteName)

          if (creep.advancedAttackCores()) continue

          // If the creep is its remote

          if (room.name === creep.memory.remoteName) {
               delete creep.memory.remoteName
               continue
          }

          // Otherwise, create a moveRequest to its remote

          creep.createMoveRequest({
               origin: creep.pos,
               goal: {
                    pos: new RoomPosition(25, 25, creep.memory.remoteName),
                    range: 25,
               },
          })
     }
}

RemoteCoreAttacker.prototype.findRemote = function () {
     const creep = this

     // If the creep already has a remote, inform true

     if (creep.memory.remoteName) return true

     // Otherwise, get the creep's role

     const role = creep.memory.role as 'remoteCoreAttacker'

     // Get remotes by their efficacy

     const remoteNamesByEfficacy: string[] = Game.rooms[creep.memory.communeName]?.get('remoteNamesByEfficacy')

     // Loop through each remote name

     for (const roomName of remoteNamesByEfficacy) {
          // Get the remote's memory using its name

          const roomMemory = Memory.rooms[roomName]

          // If the needs of this remote are met, iterate

          if (roomMemory.needs[remoteNeedsIndex[role]] <= 0) continue

          // Otherwise assign the remote to the creep and inform true

          creep.memory.remoteName = roomName
          roomMemory.needs[remoteNeedsIndex[role]] -= 1

          return true
     }

     // Inform false

     return false
}

RemoteCoreAttacker.prototype.advancedAttackCores = function () {
     const { room } = this

     // If there are no cores

     if (!room.structures.invaderCore.length) return false

     // Find the closest core

     const closestCore = room.structures.invaderCore[0]

     // If the creep at the core

     if (getRange(this.pos.x, closestCore.pos.x, this.pos.y, closestCore.pos.y) === 1) {
          this.say('🗡️C')

          this.attack(closestCore)
          return true
     }

     // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

     this.say('⏩C')

     this.createMoveRequest({
          origin: this.pos,
          goal: { pos: closestCore.pos, range: 1 },
          avoidEnemyRanges: true,
     })

     return true
}
