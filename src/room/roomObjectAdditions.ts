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
        },
    },
    nextHits: {
        get(this: Structure<BuildableStructureConstant>) {
            if (this._nextHits) return this._nextHits

            return (this._nextHits = this.hits)
        },
        set(newEstimatedHits) {
            this._nextHits = newEstimatedHits
        },
    },
    nextStore: {
        get(this: AnyStoreStructure) {
            if (this._nextStore) return this._nextStore

            return (this._nextStore = JSON.parse(JSON.stringify(this.store)))
        },
    },
    reserveStore: {
        get(this: AnyStoreStructure) {
            if (this._reserveStore) return this._reserveStore

            return (this._reserveStore = JSON.parse(JSON.stringify(this.store)))
        },
    },
    reservePowers: {
        get() {
            if (this._reservePowers) return this._reservePowers

            return (this._reservePowers = new Set())
        },
    },
} as PropertyDescriptorMap & ThisType<RoomObject>)
