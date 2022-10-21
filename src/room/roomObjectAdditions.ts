Object.defineProperties(RoomObject.prototype, {
    effectsData: {
        get() {

            if (this._effectsData) return this._effectsData

            this._effectsData = new Map()
            if (!this.effects) return this._effectsData

            for (const effectData of this.effects) {

                this._effectsData.set(effectData.effect, effectData)
            }

            return this._effectsData
        }
    }
} as PropertyDescriptorMap & ThisType<RoomObject>)
