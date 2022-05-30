import { allyList, allyTrading } from 'international/constants'

const segmentID = 90
const allyArray = [...allyList]

class AllyManager {
     myRequests: Request[]

     allyRequests: Request[]

     /**
      * An enumerator with keys of requestType names and values of number references
      */
     requestTypes: RequestTypes

     /**
      * Gets allyRequests
      */
     getAllyRequests?(): void

     /**
      * To call before any requests are made
      */
     tickConfig?(): void

     /**
      * To call after requests have been made
      */
     endTickManager?(): void

     /**
      * Request an attack of a specified room
      */
     requestAttack?(roomName: string, playerName: string, priority?: number): void

     /**
      * Request help for a specified room
      */
     requestHelp?(roomName: string, priority?: number): void

     /**
      * Request hate for a specified room
      */
     requestHate?(playerName: string, priority?: number): void

     /**
      * Request resources for a specified room
      */
     requestResource?(roomName: string, resourceType: ResourceConstant, maxAmount: number, priority?: number): void

     constructor() {
          this.requestTypes = {
               RESOURCE: 0,
               DEFENSE: 1,
               ATTACK: 2,
               EXECUTE: 3,
               HATE: 4,
          }
     }
}

// This sets foreign segments. Maybe you set them yourself for some other reason
// Up to you to fix that.

AllyManager.prototype.getAllyRequests = function () {
     if (!allyTrading) return

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
     RawMemory.setActiveForeignSegment(nextAllyName, segmentID)
}

AllyManager.prototype.tickConfig = function () {
     // Initialize myRequests and allyRequests

     this.myRequests = []
     this.allyRequests = []
}

AllyManager.prototype.endTickManager = function () {
     if (!allyTrading) return

     if (Object.keys(RawMemory.segments).length < 10) {
          // Assign myRequests to the public segment

          RawMemory.segments[segmentID] = JSON.stringify(this.myRequests)

          RawMemory.setPublicSegments([segmentID])
     }
}

AllyManager.prototype.requestAttack = function (roomName, playerName, priority = 0) {
     this.myRequests.push({
          requestType: this.requestTypes.ATTACK,
          roomName,
          playerName,
          priority,
     })
}

AllyManager.prototype.requestHelp = function (roomName, priority = 0) {
     this.myRequests.push({
          requestType: this.requestTypes.DEFENSE,
          roomName,
          priority,
     })
}

AllyManager.prototype.requestHate = function (playerName, priority = 0) {
     this.myRequests.push({
          requestType: this.requestTypes.HATE,
          playerName,
          priority,
     })
}

AllyManager.prototype.requestResource = function (roomName, resourceType, maxAmount, priority = 0) {
     this.myRequests.push({
          requestType: this.requestTypes.RESOURCE,
          resourceType,
          maxAmount,
          roomName,
          priority,
     })
}

export const allyManager = new AllyManager()
