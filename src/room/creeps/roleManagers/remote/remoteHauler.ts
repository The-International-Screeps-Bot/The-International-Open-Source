import { RemoteNeeds } from 'international/constants'
import { Hauler } from '../commune/hauler'

export class RemoteHauler extends Creep {
    /**
     * Finds a remote to haul from
     */
    findRemote?(): boolean {
        if (this.memory.remote) return true

        const remoteNamesByEfficacy: string[] = Game.rooms[this.commune]?.get('remoteNamesByEfficacy')

        let roomMemory

        for (const roomName of remoteNamesByEfficacy) {
            roomMemory = Memory.rooms[roomName]

            if (roomMemory.needs[RemoteNeeds.remoteHauler] <= 0) continue

            this.memory.remote = roomName
            roomMemory.needs[RemoteNeeds.remoteHauler] -= this.parts.carry

            return true
        }

        return false
    }

    getResources?() {
        if (!this.findRemote()) return true

        // If the creep is in the remote

        if (this.room.name === this.memory.remote) {
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
                    pos: new RoomPosition(25, 25, this.commune),
                    range: 20,
                },
                avoidEnemyRanges: true,
            })

            return true
        }

        this.message += this.memory.remote
        this.say(this.message)

        this.createMoveRequest({
            origin: this.pos,
            goal: {
                pos: new RoomPosition(25, 25, this.memory.remote),
                range: 20,
            },
            avoidEnemyRanges: true,
        })

        return false
    }

    deliverResources?() {
        if (this.room.name === this.commune) {
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

            this.message += this.memory.remote
            this.say(this.message)

            this.createMoveRequest({
                origin: this.pos,
                goal: {
                    pos: new RoomPosition(25, 25, this.memory.remote),
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
                pos: new RoomPosition(25, 25, this.commune),
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

        if (creepAtPos.role !== 'hauler' && creepAtPos.role !== 'remoteHauler') return false
        if (creepAtPos.movedResource) return false
        if (this.store.getFreeCapacity() < creepAtPos.store.getUsedCapacity(RESOURCE_ENERGY)) return false

        creepAtPos.transfer(this, RESOURCE_ENERGY)

        this.movedResource = true
        creepAtPos.movedResource = true

        this.store.energy += creepAtPos.store.getUsedCapacity(RESOURCE_ENERGY)
        creepAtPos.store.energy -= this.store.getFreeCapacity()

        const newCreepAtPosMemory = { ...this.memory }

        this.memory = creepAtPos.memory
        creepAtPos.memory = newCreepAtPosMemory

        delete this.moveRequest
        delete creepAtPos.moveRequest

        const newCreepAtPosRemote = this.memory.remote || creepAtPos.memory.remote

        this.memory.remote = creepAtPos.memory.remote || this.memory.remote
        creepAtPos.memory.remote = newCreepAtPosRemote

        this.deliverResources()

        if (creepAtPos.role === 'hauler') {
            const hauler = creepAtPos as Hauler
            return true
        }

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

        if (creepAtPos.role !== 'hauler' && creepAtPos.role !== 'remoteHauler') return false
        if (creepAtPos.movedResource) return false
        if (creepAtPos.store.getFreeCapacity() < this.store.getUsedCapacity(RESOURCE_ENERGY)) return false

        this.transfer(creepAtPos, RESOURCE_ENERGY)

        this.movedResource = true
        creepAtPos.movedResource = true

        this.store.energy -= creepAtPos.store.getFreeCapacity()
        creepAtPos.store.energy += this.store.getUsedCapacity(RESOURCE_ENERGY)

        const newCreepAtPosMemory = { ...this.memory }

        this.memory = creepAtPos.memory
        creepAtPos.memory = newCreepAtPosMemory

        delete this.moveRequest
        delete creepAtPos.moveRequest

        const newCreepAtPosRemote = this.memory.remote || creepAtPos.memory.remote

        this.memory.remote = creepAtPos.memory.remote || this.memory.remote
        creepAtPos.memory.remote = newCreepAtPosRemote

        this.getResources()

        if (creepAtPos.role === 'hauler') {
            const hauler = creepAtPos as Hauler
            return true
        }

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

            if (creep.memory.remote) {
                Memory.rooms[creep.memory.remote].needs[RemoteNeeds.remoteHauler] += creep.parts.carry
                delete creep.memory.remote
            }

            if (creep.deliverResources()) continue
            creep.relayAsFull()
        }
    }

    preTickManager() {
        if (!this.memory.remote) return

        const role = this.role as 'remoteHauler'

        // If the creep's remote no longer is managed by its commune

        // If the creep's remote no longer is managed by its commune

        if (!Memory.rooms[this.commune].remotes.includes(this.memory.remote)) {
            // Delete it from memory and try to find a new one

            delete this.memory.remote
            if (!this.findRemote()) return
        }

        // Reduce remote need

        if (Memory.rooms[this.memory.remote].needs && !this.isDying())
            Memory.rooms[this.memory.remote].needs[RemoteNeeds[role]] -= this.parts.carry
    }

    /*
    endTickManager() {
        if (!this.moveRequest) return
        if (this.movedResource) return
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) return

        const creepAtPosName = this.room.creepPositions.get(this.moveRequest)
        if (!creepAtPosName) return

        const creepAtPos = Game.creeps[creepAtPosName]

        if (creepAtPos.role != 'hauler' && creepAtPos.role != 'remoteHauler') return
        if (creepAtPos.movedResource) return
        if (creepAtPos.store.getFreeCapacity() < this.store.getUsedCapacity(RESOURCE_ENERGY)) return

        this.transfer(creepAtPos, RESOURCE_ENERGY)

        this.movedResource = true
        creepAtPos.movedResource = true

        const newCreepAtPosMemory = {...this.memory}

        this.memory = creepAtPos.memory
        creepAtPos.memory = newCreepAtPosMemory

        delete this.moveRequest
        delete creepAtPos.moveRequest
    }
 */
}
