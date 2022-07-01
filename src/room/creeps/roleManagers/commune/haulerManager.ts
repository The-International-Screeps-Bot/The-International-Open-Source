import { customLog } from 'international/generalFunctions'
import { RoomTask } from 'room/roomTasks'
import { Hauler } from '../../creepClasses'
import './haulerFunctions'

export function haulerManager(room: Room, creepsOfRole: string[]) {
     // Loop through creep names of this role

     for (const creepName of creepsOfRole) {
          // Get the creep using its name

          const creep: Hauler = Game.creeps[creepName]

          creep.advancedRenew()

          if (!creep.memory.reservations || !creep.memory.reservations.length) creep.reserve()

          if (!creep.fulfillReservation()) {

               creep.say(creep.message)
               continue
          }

          creep.reserve()

          if (!creep.fulfillReservation()) {

               creep.say(creep.message)
               continue
          }

          if (creep.message.length) creep.say(creep.message)
     }
}
