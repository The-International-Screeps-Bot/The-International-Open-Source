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

            this._nextStore = {}

            for (const resource of RESOURCES_ALL) {

                this._nextStore[resource] = this.store[resource]
            }

            return this._nextStore
        },
    },
    reserveStore: {
        get(this: AnyStoreStructure) {
            if (this._reserveStore) return this._reserveStore

            this._reserveStore = {}

            for (const resource of RESOURCES_ALL) {

                this._reserveStore[resource] = this.store[resource]
            }

            return this._reserveStore
        },
    },
    reservePowers: {
        get() {
            if (this._reservePowers) return this._reservePowers

            return (this._reservePowers = new Set())
        },
    },
} as PropertyDescriptorMap & ThisType<RoomObject>)
