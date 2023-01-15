import { allResources, customColors } from 'international/constants'
import { customLog, findObjectWithID } from 'international/utils'

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
        set(newNextHits: number) {
            this._nextHits = newNextHits
        },
    },
    nextStore: {
        get(this: AnyStoreStructure) {

            if (this._nextStore) return this._nextStore

            const parent = this
            const referenceStore = Object.assign({}, this.store)

            this._nextStore = new Proxy(referenceStore, {
                get(target: CustomStore, resourceType: ResourceConstant) {

                    return target[resourceType] ?? 0
                },
                set(target: CustomStore, resourceType: ResourceConstant, newAmount) {

                    if (parent._usedNextStore !== undefined) {
                        parent._usedNextStore += newAmount - (target[resourceType] ?? 0)
                    }
                    // Update the change

                    target[resourceType] = newAmount
                    return true
                },
            })

            return this._nextStore
        },
    },
    usedNextStore: {
        get(this: RoomObject & { store?: StoreDefinition }) {

            if (this._usedNextStore !== undefined) return this._usedNextStore

            this._usedNextStore = 0
            const keys = Object.keys(this.nextStore)

            for (let i = 0; i < keys.length; i++) {
                this._usedNextStore += this.nextStore[keys[i] as ResourceConstant]
            }

            return this._usedNextStore
        },
    },
    freeNextStore: {
        get(this: RoomObject & { store?: StoreDefinition }) {
            return this.store.getCapacity() - this.usedNextStore
        },
    },
    reserveStore: {
        get(this: AnyStoreStructure) {
            if (this._reserveStore) return this._reserveStore

            const parent = this
            const referenceStore = Object.assign({}, this.store)

            this._reserveStore = new Proxy(referenceStore, {
                get(target: CustomStore, resourceType: ResourceConstant) {
                    return target[resourceType] ?? 0
                },
                set(target: CustomStore, resourceType: ResourceConstant, newAmount) {

                    if (parent._usedReserveStore !== undefined) {
                        parent._usedReserveStore += newAmount - (target[resourceType] ?? 0)
                    }

                    // Update the change

                    target[resourceType] = newAmount
                    return true
                },
            })

            return this._reserveStore
        },
    },
    usedReserveStore: {
        get(this: RoomObject & { store?: StoreDefinition }) {
            if (this._usedReserveStore !== undefined) return this._usedReserveStore

            this._usedReserveStore = 0
            const keys = Object.keys(this.reserveStore)

            for (let i = 0; i < keys.length; i++) {
                this._usedReserveStore += this.reserveStore[keys[i] as ResourceConstant]
            }

            return this._usedReserveStore
        },
    },
    freeReserveStore: {
        get(this: RoomObject & { store?: StoreDefinition }) {
            return this.store.getCapacity() - this.usedReserveStore
        },
    },
    reservePowers: {
        get() {
            if (this._reservePowers) return this._reservePowers

            return (this._reservePowers = new Set())
        },
    },
} as PropertyDescriptorMap & ThisType<RoomObject>)
