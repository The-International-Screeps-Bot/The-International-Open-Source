import { RemoteNeeds } from 'international/constants'
import { customLog, findObjectWithID } from 'international/generalFunctions'
import { indexOf } from 'lodash'
import { unpackPosList } from 'other/packrat'
import { Hauler } from '../commune/hauler'

export class RemoteHauler extends Creep {
    public get dying() {
        // Inform as dying if creep is already recorded as dying

        if (this._dying) return true

        // Stop if creep is spawning

        if (!this.ticksToLive) return false

        // If the creep's remaining ticks are more than the estimated spawn time, inform false

        if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

        // Record creep as dying

        return (this._dying = true)
    }

    preTickManager() {
        if (!this.memory.RN) return

        // If the creep's remote no longer is managed by its commune

        // If the creep's remote no longer is managed by its commune

        if (!Memory.rooms[this.commune.name].remotes.includes(this.memory.RN)) {
            // Delete it from memory and try to find a new one

            this.removeRemote()
            if (!this.findRemote()) return
        }

        if (this.dying) return

        Memory.rooms[this.memory.RN].needs[RemoteNeeds[`remoteHauler${this.memory.SI}`]] -= this.parts.carry
    }

    /**
     * Finds a remote to haul from
     */
    findRemote?(): boolean {
        if (this.memory.RN) return true

        for (const remoteInfo of this.commune?.remoteSourceIndexesByEfficacy) {
            const splitRemoteInfo = remoteInfo.split(' ')
            const remoteName = splitRemoteInfo[0]
            const sourceIndex = parseInt(splitRemoteInfo[1]) as 0 | 1
            const remoteMemory = Memory.rooms[remoteName]

            // If there is no need

            if (remoteMemory.needs[RemoteNeeds[`remoteHauler${sourceIndex}`]] <= 0) continue

            this.assignRemote(remoteName, sourceIndex)
            return true
        }

        return false
    }

    assignRemote?(remoteName: string, sourceIndex: 0 | 1) {
        this.memory.RN = remoteName
        this.memory.SI = sourceIndex

        if (this.dying) return

        Memory.rooms[remoteName].needs[RemoteNeeds[`remoteHauler${this.memory.SI}`]] -= this.parts.carry
    }

    removeRemote?() {
        if (!this.dying) {
            Memory.rooms[this.memory.RN].needs[RemoteNeeds[`remoteHauler${this.memory.SI}`]] += this.parts.carry
        }

        delete this.memory.RN
        delete this.memory.SI
    }

    /*
    updateRemote?() {
        if (this.memory.RN) {

            return true
        }

        const remoteNamesByEfficacy = this.commune?.remoteNamesBySourceEfficacy

        let roomMemory

        for (const roomName of remoteNamesByEfficacy) {
            roomMemory = Memory.rooms[roomName]

            if (roomMemory.needs[RemoteNeeds.remoteHauler] <= 0) continue

            this.memory.RN = roomName
            roomMemory.needs[RemoteNeeds.remoteHauler] -= this.parts.carry

            return true
        }

        return false
    }
 */
    getResources?() {
        if (!this.findRemote()) return true

        // If the creep is in the remote

        if (this.room.name === this.memory.RN) {
            this.reserveWithdrawEnergy()

            if (!this.fulfillReservation()) {
                this.say(this.message)
                return false
            }

            this.reserveWithdrawEnergy()

            if (!this.fulfillReservation()) {
                this.say(this.message)
                return false
            }

            if (this.needsResources()) return false

            this.message += this.commune
            this.say(this.message)

            this.createMoveRequest({
                origin: this.pos,
                goal: {
                    pos: new RoomPosition(25, 25, this.commune.name),
                    range: 20,
                },
                avoidEnemyRanges: true,
            })

            return true
        }

        this.message += this.memory.RN
        this.say(this.message)

        customLog('REMOTE BUG', Memory.rooms[this.memory.RN] + ', ' + this.memory.SI + ', ' + Memory.rooms[this.memory.RN].SP)
        const sourcePos = unpackPosList(Memory.rooms[this.memory.RN].SP[this.memory.SI])[0]

        this.createMoveRequest({
            origin: this.pos,
            goal: {
                pos: sourcePos,
                range: 1,
            },
            avoidEnemyRanges: true,
        })

        return false
    }

    deliverResources?() {
        if (this.room.name === this.commune.name) {
            // Try to renew the creep

            this.advancedRenew()

            this.reserveTransferEnergy()

            if (!this.fulfillReservation()) {
                this.say(this.message)
                return false
            }

            this.reserveTransferEnergy()

            if (!this.fulfillReservation()) {
                this.say(this.message)
                return false
            }

            if (!this.needsResources()) return false

            if (!this.findRemote()) return true

            this.message += this.memory.RN
            this.say(this.message)

            this.createMoveRequest({
                origin: this.pos,
                goal: {
                    pos: new RoomPosition(25, 25, this.memory.RN),
                    range: 20,
                },
                avoidEnemyRanges: true,
            })

            return true
        }

        this.message += this.commune
        this.say(this.message)

        this.createMoveRequest({
            origin: this.pos,
            goal: {
                pos: new RoomPosition(25, 25, this.commune.name),
                range: 20,
            },
            avoidEnemyRanges: true,
        })

        return false
    }

    relayAsEmpty?() {
        if (!this.moveRequest) return false
        if (this.movedResource) return false
        if (this.store.getFreeCapacity(RESOURCE_ENERGY) === 0) return false

        const creepAtPosName = this.room.creepPositions.get(this.moveRequest)
        if (!creepAtPosName) return false

        const creepAtPos = Game.creeps[creepAtPosName]

        if (creepAtPos.role !== 'remoteHauler') return false
        if (creepAtPos.movedResource) return false
        if (this.store.getFreeCapacity() !== creepAtPos.store.getUsedCapacity(RESOURCE_ENERGY)) return false

        creepAtPos.transfer(this, RESOURCE_ENERGY)

        this.movedResource = true
        creepAtPos.movedResource = true

        this.store.energy += creepAtPos.store.getUsedCapacity(RESOURCE_ENERGY)
        creepAtPos.store.energy -= this.store.getFreeCapacity()

        // Stop previously attempted moveRequests as they do not account for a relay

        delete this.moveRequest
        delete creepAtPos.moveRequest

        // Trade remotes and sourceIndexes

        const newCreepAtPosRemote = this.memory.RN || creepAtPos.memory.RN
        const newCreepAtPosSourceIndex = this.memory.SI !== undefined ? this.memory.SI : creepAtPos.memory.SI

        this.memory.RN = creepAtPos.memory.RN || this.memory.RN
        this.memory.SI = creepAtPos.memory.SI !== undefined ?  creepAtPos.memory.SI : this.memory.SI
        creepAtPos.memory.RN = newCreepAtPosRemote
        creepAtPos.memory.SI = newCreepAtPosSourceIndex

        this.deliverResources()

        const remoteHauler = creepAtPos as RemoteHauler
        remoteHauler.getResources()

        return true
    }

    relayAsFull?() {
        if (!this.moveRequest) return false
        if (this.movedResource) return false
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) return false

        const creepAtPosName = this.room.creepPositions.get(this.moveRequest)
        if (!creepAtPosName) return false

        const creepAtPos = Game.creeps[creepAtPosName]

        if (creepAtPos.role !== 'remoteHauler') return false
        if (creepAtPos.movedResource) return false
        if (creepAtPos.store.getFreeCapacity() !== this.store.getUsedCapacity(RESOURCE_ENERGY)) return false

        this.transfer(creepAtPos, RESOURCE_ENERGY)

        this.movedResource = true
        creepAtPos.movedResource = true

        this.store.energy -= creepAtPos.store.getFreeCapacity()
        creepAtPos.store.energy += this.store.getUsedCapacity(RESOURCE_ENERGY)

        // Stop previously attempted moveRequests as they do not account for a relay

        delete this.moveRequest
        delete creepAtPos.moveRequest

        // Trade remotes and sourceIndexes

        const newCreepAtPosRemote = this.memory.RN || creepAtPos.memory.RN
        const newCreepAtPosSourceIndex = this.memory.SI !== undefined ? this.memory.SI : creepAtPos.memory.SI

        this.memory.RN = creepAtPos.memory.RN || this.memory.RN
        this.memory.SI = creepAtPos.memory.SI !== undefined ?  creepAtPos.memory.SI : this.memory.SI
        creepAtPos.memory.RN = newCreepAtPosRemote
        creepAtPos.memory.SI = newCreepAtPosSourceIndex

        this.getResources()

        const remoteHauler = creepAtPos as RemoteHauler
        remoteHauler.deliverResources()

        return true
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static remoteHaulerManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RemoteHauler = Game.creeps[creepName]

            // If the creep needs resources

            if (creep.needsResources()) {
                creep.getResources()
                continue
            }

            // Otherwise if the creep doesn't need resources

            // If the creep has a remoteName, delete it and delete it's fulfilled needs

            if (creep.memory.RN) creep.removeRemote()

            if (creep.deliverResources()) continue
            creep.relayAsFull()
        }
    }
}
