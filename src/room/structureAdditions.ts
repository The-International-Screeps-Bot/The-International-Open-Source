import { RoomMemoryKeys } from "international/constants"

Object.defineProperties(Structure.prototype, {
    /**
     * Credits to Tigga for the foundation
     * Improved by MarvinTMB / Carson
     */
    isRCLActionable: {
        get() {
            if (this._isRCLActionable !== undefined) return this._isRCLActionable

            if (!this.room.controller) return (this._isRCLActionable = true)
            if (Memory.rooms[this.room.name][RoomMemoryKeys.greatestRCL] === this.room.controller.level)
                return (this._isRCLActionable = true)

            return (this._isRCLActionable = this.isActive())
        },
    },
} as PropertyDescriptorMap & ThisType<Structure>)
