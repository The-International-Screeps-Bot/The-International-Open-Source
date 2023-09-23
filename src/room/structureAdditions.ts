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
    damageReceived: {
        get() {
            if (this._damageReceived) return this._damageReceived

            let avgHits = 0
            const rampartHits = Memory.rooms[this.room.name][RoomMemoryKeys.rampartHits]
            if (rampartHits[this.id]) {
                avgHits = this._damageReceived = rampartHits[this.id] - this.hits
                if (avgHits > 0) avgHits = 0
                else avgHits *= -1
            }
            this._damageReceived = avgHits
            return avgHits
        },
    },
} as PropertyDescriptorMap & ThisType<StructureRampart>)
