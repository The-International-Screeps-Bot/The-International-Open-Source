import { findClosestCommuneName } from 'international/generalFunctions'
import { Scout } from '../../creepClasses'

Scout.prototype.findScoutTarget = function () {
     if (this.memory.scoutTarget) return true

     const commune = Game.rooms[this.memory.communeName]

     // Construct storage of exit information

     const scoutedRooms: string[] = []
     const unscoutedRooms: string[] = []

     // Get information about the room's exits

     const exits = Game.map.describeExits(this.room.name)

     // Loop through each exit type

     for (const exitType in exits) {
          // Get the roomName using the exitType

          const roomName = exits[exitType as ExitKey]

          // Iterate if the room statuses aren't the same

          if (Game.map.getRoomStatus(roomName).status !== Game.map.getRoomStatus(this.room.name).status) continue

          // If a scout already has this room as a target

          if (commune.scoutTargets.has(roomName)) continue

          // If the room has memory and a lastScout

          if (Memory.rooms[roomName] && Memory.rooms[roomName].lastScout) {
               // Add it to scoutedRooms and iterate

               scoutedRooms.push(roomName)
               continue
          }

          // Otherwise add it to unscouted rooms

          unscoutedRooms.push(roomName)
     }

     const scoutTarget = unscoutedRooms.length
          ? unscoutedRooms.sort(
                 (a, b) =>
                      Game.map.getRoomLinearDistance(this.memory.communeName, a) -
                      Game.map.getRoomLinearDistance(this.memory.communeName, b),
            )[0]
          : scoutedRooms.sort((a, b) => Memory.rooms[a].lastScout - Memory.rooms[b].lastScout)[0]

     if (!scoutTarget) return false

     this.memory.scoutTarget = scoutTarget
     commune.scoutTargets.add(scoutTarget)

     return true
}

Scout.prototype.recordDeposits = function () {
     const { room } = this

     if (room.memory.type != 'highway') return

     // Make sure the room has a commune

     if (room.memory.commune) {
          if (!Memory.communes.includes(room.memory.commune)) {
               room.memory.commune = findClosestCommuneName(room.name)
          }
     } else {
          room.memory.commune = findClosestCommuneName(room.name)
     }

     const communeMemory = Memory.rooms[room.memory.communeName]

     const deposits = room.find(FIND_DEPOSITS)

     // Filter deposits that haven't been assigned a commune and are viable

     const unAssignedDeposits = deposits.filter(function(deposit) {
          return !communeMemory[deposit.id] && deposit.lastCooldown <= 100 && deposit.ticksToDecay > 500
     })

     for (const deposit of unAssignedDeposits)
          communeMemory.deposits[deposit.id] = {
               decay: deposit.ticksToDecay,
               needs: [1, 1],
          }
}
