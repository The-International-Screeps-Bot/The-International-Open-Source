// Define roomObject types

import { constants } from "international/constants"
import { generalFuncs } from "international/generalFunctions"

export type RoomObjectValueTypes = 'pos' |
'id' |
'object'

export type RoomObjectCacheTypes = 'global' |
'memory' | 'property'

export interface RoomObjectOpts {
    [key: string]: any
    name: RoomObjectName,
    valueType: RoomObjectValueTypes,
    cacheType: RoomObjectCacheTypes,
    cacheAmount?: number
    room: Room

    //

    valueConstructor(): any
}

export interface RoomObject extends RoomObjectOpts {

    lastCache?: number
    value: any

    // Functions

    formatValue(): void

    getCachedValue(): boolean

    getValue(): any

    cache(): void
}

export class RoomObject {
    constructor(opts: RoomObjectOpts) {

        const roomObject = this

        // Assign opts as properties

        for (const propertyName in opts) roomObject[propertyName] = opts[propertyName]

        // Record the roomObject in the room's roomObjects

        roomObject.room.roomObjects[roomObject.name] = roomObject
    }
}

RoomObject.prototype.formatValue = function() {

    const roomObject = this,
    room = roomObject.room

    // If roomObject's valueType is an ID

    if (roomObject.valueType == 'id') {

        // Assign its value to the object with the ID and stop

        roomObject.value = generalFuncs.findObjectWithID(roomObject.value)
        return
    }

    // If roomObject's type is pos

    if (roomObject.valueType == 'pos') {

        // Stop if the roomObject's value isn't defined

        if (!roomObject.value) return

        // Otherwise assign its value as a new RoomPosition and stop

        roomObject.value = room.newPos(roomObject.value)
        return
    }
}

RoomObject.prototype.getCachedValue = function() {

    const roomObject = this,
    room = roomObject.room

    if (roomObject.cacheType == 'memory') {

        // Query room memory for cachedRoomObject

        const cachedValue: any = room.memory[roomObject.name]

        // If cachedRoomObject doesn't exist, and inform false

        if (!cachedValue) return false

        // Otherwise assign the cachedValue to the roomObject and inform true

        roomObject.value = cachedValue
        return true
    }

    if (roomObject.cacheType == 'global') {

        // Query room's global for cachedRoomObject

        const cachedRoomObject: RoomObject | undefined = global[room.name][roomObject.name]

        // If cachedRoomObject doesn't exist, and inform false

        if (!cachedRoomObject) return false

        // If cachedRoomObject is past renewal date, and inform false

        if (cachedRoomObject.lastCache + roomObject.cacheAmount <= Game.time) {

            // Delete the cachedRoomObject and inform false

            delete global[room.name][roomObject.name]
            return false
        }

        // Otherwise assign the cachedRoomObject's value to the roomObject and inform true

        roomObject.value = cachedRoomObject.value
        return true
    }

    // Inform false

    return false
}

RoomObject.prototype.getValue = function() {

    const roomObject = this

    // If the roomObject's value can be acquired from its cache

    if (roomObject.getCachedValue()) {

        // Format the value and inform it

        roomObject.formatValue()
        return roomObject.value
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

RoomObject.prototype.cache = function() {

    const roomObject = this,
    room = roomObject.room

    // Add roomObject to roomObjects

    room.roomObjects[roomObject.name] = roomObject

    // If cacheMethod is memory

    if (roomObject.cacheType == 'memory') {

        // Store value in room's memory and stop

        room.memory[roomObject.name] = roomObject.value
        return
    }

    // If cacheMethod is global

    if (roomObject.cacheType == 'global') {

        // Create a copy of the roomObject

        const roomObjectCopy = new RoomObject({
            name: roomObject.name,
            valueType: roomObject.valueType,
            cacheType: roomObject.cacheType,
            cacheAmount: roomObject.cacheAmount,
            room,
            valueConstructor: undefined
        })

        // Assign special properties to the copy

        // Such as the current tick as the lastCache

        roomObjectCopy.lastCache = Game.time

        // And the roomObject's value

        roomObjectCopy.value = roomObject.value

        // Store the copy in global and stop

        global[room.name][roomObject.name] = roomObjectCopy
        return
    }
}
