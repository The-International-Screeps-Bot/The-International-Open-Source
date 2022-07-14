// Define roomObject types

import { findObjectWithID } from 'international/generalFunctions'

export type RoomObjectValueTypes = 'pos' | 'id' | 'object'

export type RoomObjectCacheTypes = 'global' | 'memory' | 'property'

export interface RoomObjectOpts {
     [key: string]: any
     name: RoomObjectName
     valueType: RoomObjectValueTypes
     cacheType: RoomObjectCacheTypes
     cacheAmount?: number
     room: Room

     //

     valueConstructor(): any
}

export interface RoomCacheObject extends RoomObjectOpts {
     lastCache?: number
     value: any

     // Functions

     formatValue(): void

     getCachedValue(): boolean

     getValue(): any

     cache(): void
}

export class RoomCacheObject {
     constructor(opts: RoomObjectOpts) {
          const roomObject = this

          // Assign opts as properties

          for (const propertyName in opts) roomObject[propertyName] = opts[propertyName]

          // Record the roomObject in the room's roomObjects

          roomObject.room.roomObjects[roomObject.name] = roomObject
     }
}

RoomCacheObject.prototype.formatValue = function () {
     const roomObject = this
     const { room } = roomObject

     // If roomObject's valueType is an ID

     if (roomObject.valueType === 'id') {
          // Assign its value to the object with the ID and stop

          roomObject.value = findObjectWithID(roomObject.value)
          return
     }

     // If roomObject's type is pos

     if (roomObject.valueType === 'pos') {
          // Stop if the roomObject's value isn't defined

          if (!roomObject.value) return

          // Otherwise assign its value as a new RoomPosition and stop

          roomObject.value = new RoomPosition(roomObject.value.x, roomObject.value.y, room.name)
     }
}

RoomCacheObject.prototype.getCachedValue = function () {
     const roomObject = this
     const { room } = roomObject

     if (roomObject.cacheType === 'memory') {
          // Query room memory for cachedRoomObject

          const cachedValue = room.memory[roomObject.name as keyof RoomMemory]

          // If cachedRoomObject doesn't exist, and inform false

          if (!cachedValue) return false

          // Otherwise assign the cachedValue to the roomObject and inform true

          roomObject.value = cachedValue
          return true
     }

     if (roomObject.cacheType === 'global') {
          // Query room's global for cachedRoomObject

          const cachedRoomObject: RoomCacheObject | undefined = room.global[roomObject.name]

          // If cachedRoomObject doesn't exist, and inform false

          if (!cachedRoomObject) return false

          // If cachedRoomObject is past renewal date, and inform false

          if (cachedRoomObject.lastCache + roomObject.cacheAmount <= Game.time) {
               // Delete the cachedRoomObject and inform false

               delete room.global[roomObject.name]
               return false
          }

          // Otherwise assign the cachedRoomObject's value to the roomObject and inform true

          roomObject.value = cachedRoomObject.value
          return true
     }

     // Inform false

     return false
}

RoomCacheObject.prototype.getValue = function () {
     const roomObject = this

     // If the roomObject's value can be acquired from its cache

     if (roomObject.getCachedValue()) {
          // Format the value

          roomObject.formatValue()

          // If the value is defined, inform it

          if (roomObject.value) return roomObject.value
     }

     // Otherwise run the value constructor and set it as the roomObject's value

     roomObject.value = roomObject.valueConstructor()

     // Cache the value

     roomObject.cache()

     // Then format it

     roomObject.formatValue()

     // Then inform it

     return roomObject.value
}

RoomCacheObject.prototype.cache = function () {
     const roomObject = this
     const { room } = roomObject

     // Add roomObject to roomObjects

     room.roomObjects[roomObject.name] = roomObject

     // If cacheMethod is memory

     if (roomObject.cacheType === 'memory') {
          // Store value in room's memory and stop

          (room.memory[roomObject.name as keyof RoomMemory] as any) = roomObject.value
          return
     }

     // If cacheMethod is global

     if (roomObject.cacheType === 'global') {
          // Create a copy of the roomObject

          const roomObjectCopy = new RoomCacheObject({
               name: roomObject.name,
               valueType: roomObject.valueType,
               cacheType: roomObject.cacheType,
               cacheAmount: roomObject.cacheAmount,
               room,
               valueConstructor: undefined,
          })

          // Assign special properties to the copy

          // Such as the current tick as the lastCache

          roomObjectCopy.lastCache = Game.time

          // And the roomObject's value

          roomObjectCopy.value = roomObject.value

          // Store the copy in global and stop

          room.global[roomObject.name] = roomObjectCopy
     }
}
