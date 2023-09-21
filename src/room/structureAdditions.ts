import { RoomMemoryKeys } from 'international/constants'

Object.defineProperties(Structure.prototype, {
    /**
     * Credits to Tigga for the foundation
     * Improved by MarvinTMB / Carson
     */
    RCLActionable: {
        get() {
            if (this._RCLActionable !== undefined) return this._RCLActionable

            if (!this.room.controller) return (this._RCLActionable = true)
            if (
                Memory.rooms[this.room.name][RoomMemoryKeys.greatestRCL] ===
                this.room.controller.level
            )
                return (this._RCLActionable = true)

            return (this._RCLActionable = this.isActive())
        },
    },
} as PropertyDescriptorMap & ThisType<Structure>)

Object.defineProperties(StructureRampart.prototype, {
    updateDamageReceived: function () {
        if (!this.originalHits) this.originalHits = this.hits

        const change = this.originalHits - this.hits
        this.damageReceived = change > 0 ? change : 0
    },
} as PropertyDescriptorMap & ThisType<StructureRampart>)
