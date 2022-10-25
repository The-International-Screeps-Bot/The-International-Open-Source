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
    },
    estimatedHits: {
        get(this: Structure<BuildableStructureConstant>) {

            if (this._estimatedHits) return this._estimatedHits

            return this._estimatedHits = this.hits
        },
        set(newEstimatedHits) {

            this._estimatedHits = newEstimatedHits
        }
    },
    estimatedStore: {
        get(this: AnyStoreStructure) {

            if (this._estimatedStore) return this._estimatedStore

            return this._estimatedStore = JSON.parse(JSON.stringify(this as AnyStoreStructure))
        },
    }
} as PropertyDescriptorMap & ThisType<RoomObject>)
