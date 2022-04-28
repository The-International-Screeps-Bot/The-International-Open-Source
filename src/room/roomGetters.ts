import { allyList } from "international/constants"
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
    enemyCreeps: {
        get() {

            if (this._enemyCreeps) return this._enemyCreeps

            return this._enemyCreeps = this.find(FIND_HOSTILE_CREEPS, {
                filter: creep => !allyList.has(creep.owner.username)
            })
        }
    },
    sourceHarvestPositions: {
        get() {

            if (this.global.sourceHarvestPositions) return this.global.sourceHarvestPositions

            const sourceHarvestPositions = [new Map()]

            return sourceHarvestPositions
        }
    }
} as PropertyDescriptorMap & ThisType<Room>)
