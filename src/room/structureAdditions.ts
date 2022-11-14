Object.defineProperties(Structure.prototype, {
    /**
     * Credits to Tigga for the foundation
     * Improved by MarvinTMB / Carson
     */
    RCLActionable: {
         get() {
            if (this._RCLActionable !== undefined) return this._RCLActionable

            if (!this.room.controller) return this._RCLActionable = true
            if (this.room.memory.GRCL === this.room.controller.level) return this._RCLActionable = true

            return this._RCLActionable = this.isActive()
         }
    },
} as PropertyDescriptorMap & ThisType<Structure>)
