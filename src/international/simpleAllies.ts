import { allyList, simpleAlliesSegment } from 'international/constants'

const allyArray = [...allyList]

export enum RequestTypes {
     RESOURCE,
     DEFENSE,
     ATTACK,
     EXECUTE,
     HATE,
}

/**
 * Contains functions and methods useful for ally trading. Ensure allyTrading in Memory is enabled, as well as no other values or in the designated simpleAlliesSegment before usage
 */
class AllyManager {

     /**
      * An array of the requests you have made this tick
      */
     myRequests: Request[]

     /**
      * An array of all the current requests made by other allies
      */
     allyRequests: Request[]

     constructor() {
     }
     /**
      * Gets allyRequests, sets up requirements to use the foreign segment
      */
     getAllyRequests () {
          if (!Memory.allyTrading) return

          // Stop if there are no allies

          if (!allyArray.length) return

          // Run only once every 10 ticks

          if (Game.time % (10 * allyArray.length) >= allyArray.length) return

          const currentAllyName = allyArray[Game.time % allyArray.length]

          //

          if (RawMemory.foreignSegment && RawMemory.foreignSegment.username === currentAllyName) {
               try {
                    // Get the allyRequests and record them in the allyManager

                    this.allyRequests = JSON.parse(RawMemory.foreignSegment.data)
               } catch (err) {}
          }

          const nextAllyName = allyArray[(Game.time + 1) % allyArray.length]
          RawMemory.setActiveForeignSegment(nextAllyName, simpleAlliesSegment)
     }
     /**
      * To call before any requests are made. Configures some required values
      */
     tickConfig  () {
          // Initialize myRequests and allyRequests

          this.myRequests = []
          this.allyRequests = []
     }
     /**
      * To call after requests have been made, to assign requests to the next ally
      */
     endTickManager  () {
          if (!Memory.allyTrading) return

          if (Object.keys(RawMemory.segments).length < 10) {
               // Assign myRequests to the public segment

               RawMemory.segments[simpleAlliesSegment] = JSON.stringify(this.myRequests)

               RawMemory.setPublicSegments([simpleAlliesSegment])
          }
     }
     /**
      * Request an attack of a specified room
      */
     requestAttack (roomName: string, playerName: string, priority: number = 0) {
          this.myRequests.push({
               requestType: RequestTypes.ATTACK,
               roomName,
               playerName,
               priority,
          })
     }
     /**
      * Request help for a specified room
      */
     requestHelp  (roomName: string, priority: number = 0) {
          this.myRequests.push({
               requestType: RequestTypes.DEFENSE,
               roomName,
               priority,
          })
     }
     /**
      * Request hate for a specified room. It's up to you and your allies how to intepret hate
      */
     requestHate (playerName: string, priority: number = 0) {
          this.myRequests.push({
               requestType: RequestTypes.HATE,
               playerName,
               priority,
          })
     }
     /**
      * Request resources for a specified room. Handled by the marketManager
      */
     requestResource (roomName: string, resourceType: ResourceConstant, maxAmount: number, priority: number = 0) {
          this.myRequests.push({
               requestType: RequestTypes.RESOURCE,
               resourceType,
               maxAmount,
               roomName,
               priority,
          })
     }
}

export const allyManager = new AllyManager()
