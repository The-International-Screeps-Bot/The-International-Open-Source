import { unPackAsRoomPos } from "international/generalFunctions"

Object.defineProperties(Room.prototype, {

    global: {
        get() {

            if (global[this.name]) return global[this.name]

            return global[this.name] = {}
        }
    },
    anchor: {
        get() {

            if (this._anchor) return this._anchor

            return this._anchor = this.memory.anchor ?
                unPackAsRoomPos(this.memory.anchor, this.name) :
                undefined
        }
    },
} as PropertyDescriptorMap & ThisType<Room>)
