import { myColors, relayOffsets, RemoteNeeds } from 'international/constants'
import {
    customLog,
    findClosestObject,
    findCoordsInsideRect,
    findFunctionCPU,
    findObjectWithID,
    getRange,
    pack,
    unpackAsPos,
} from 'international/generalFunctions'
import { indexOf } from 'lodash'
import { unpackPosList } from 'other/packrat'
import { creepClasses } from 'room/creeps/creepClasses'
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

        const role = this.memory.SI == 0 ? 'remoteHauler0' : 'remoteHauler1'

        const commune = this.commune

        // Add the creep to creepsFromRoomWithRemote relative to its remote

        if (commune.creepsFromRoomWithRemote[this.memory.RN])
            commune.creepsFromRoomWithRemote[this.memory.RN][role].push(this.name)
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

        // if (this.dying) return

        // Memory.rooms[remoteName].needs[RemoteNeeds[`remoteHauler${this.memory.SI}`]] -= this.parts.carry
    }

    removeRemote?() {
        // if (!this.dying) {
        //     Memory.rooms[this.memory.RN].needs[RemoteNeeds[`remoteHauler${this.memory.SI}`]] += this.parts.carry
        // }

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
        if (!this.findRemote()) return false

        const sourcePos = unpackPosList(Memory.rooms[this.memory.RN].SP[this.memory.SI])[0]

        // If the creep is in the remote

        if (this.room.name === this.memory.RN) {
            if (getRange(this.pos.x, sourcePos.x, this.pos.y, sourcePos.y) > 1) {
                this.createMoveRequest({
                    origin: this.pos,
                    goals: [
                        {
                            pos: sourcePos,
                            range: 1,
                        },
                    ],
                    avoidEnemyRanges: true,
                })

                return true
            }

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

            if (this.needsResources()) {
                /* this.moved = pack(sourcePos) */
                return false
            }

            if (!this.commune) return false

            this.message += this.commune.name
            this.say(this.message)

            this.createMoveRequest({
                origin: this.pos,
                goals: [
                    {
                        pos: this.commune.anchor,
                        range: 3,
                    },
                ],
                avoidEnemyRanges: true,
                typeWeights: {
                    enemy: Infinity,
                    ally: Infinity,
                    keeper: Infinity,
                    enemyRemote: Infinity,
                    allyRemote: Infinity
                },
            })

            return true
        }

        this.message += this.memory.RN
        this.say(this.message)

        this.createMoveRequest({
            origin: this.pos,
            goals: [
                {
                    pos: sourcePos,
                    range: 1,
                },
            ],
            avoidEnemyRanges: true,
            typeWeights: {
                enemy: Infinity,
                ally: Infinity,
                keeper: Infinity,
                enemyRemote: Infinity,
                allyRemote: Infinity
            },
        })

        return true
    }

    reserveWithdrawEnergy() {
        if (this.memory.reservations && this.memory.reservations?.length) return
        if (!this.needsResources()) return

        const { room } = this
        const sourcePos = room.sources[this.memory.SI].pos

        if (this.freeCapacityNextTick === undefined) this.freeCapacityNextTick = this.store.getFreeCapacity()

        let withdrawTargets = room.MAWT.filter(target => {
            if (getRange(target.pos.x, sourcePos.x, target.pos.y, sourcePos.y) > 1) return false

            //Pick up any amount laying on the ground, so it doesn't decay.  If there's a harvester creep
            //  It'll transfer the goods to us.
            if (target instanceof Resource) return true

            return target.store.energy >= this.freeCapacityNextTick
        })

        let target
        let amount

        if (withdrawTargets.length) {
            target = findClosestObject(this.pos, withdrawTargets)

            if (target instanceof Resource) amount = target.reserveAmount
            else amount = Math.min(this.freeCapacityNextTick, target.store.energy)

            this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY)
            return
        }

        withdrawTargets = room.OAWT.filter(target => {
            if (getRange(target.pos.x, sourcePos.x, target.pos.y, sourcePos.y) > 1) return false

            //Pick up any amount laying on the ground, so it doesn't decay.  If there's a harvester creep
            //  It'll transfer the goods to us.
            if (target instanceof Resource) return true

            return target.store.energy >= this.freeCapacityNextTick
        })

        if (!withdrawTargets.length) return

        target = findClosestObject(this.pos, withdrawTargets)

        if (target instanceof Resource) amount = target.reserveAmount
        else amount = Math.min(this.freeCapacityNextTick, target.store.energy)

        this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY)
    }

    deliverResources?() {
        if (this.room.name === this.commune.name) {
            // Try to renew the creep

            this.advancedRenew()

            let store: AnyStoreStructure = this.commune.storage
            if (!store) store = this.commune.terminal

            //We don't want remote haulers fulfilling reservations all over the place in the commune.
            if (store) {
                if (!this.memory.reservations || this.memory.reservations.length == 0)
                    this.createReservation('transfer', store.id, this.store[RESOURCE_ENERGY], RESOURCE_ENERGY)
                if (!this.fulfillReservation()) {
                    this.say(this.message)
                    return true
                }
            } else {
                this.reserveTransferEnergy()

                if (this.fulfillReservation()) {
                    this.say(this.message)
                    return true
                }

                this.reserveTransferEnergy()

                if (!this.fulfillReservation()) {
                    this.say(this.message)
                    return true
                }
            }

            if (!this.needsResources()) return true

            if (!this.findRemote()) return false

            this.message += this.memory.RN
            this.say(this.message)

            const sourcePos = unpackPosList(Memory.rooms[this.memory.RN].SP[this.memory.SI])[0]

            this.createMoveRequest({
                origin: this.pos,
                goals: [
                    {
                        pos: sourcePos,
                        range: 1,
                    },
                ],
                avoidEnemyRanges: true,
                typeWeights: {
                    enemy: Infinity,
                    ally: Infinity,
                    keeper: Infinity,
                    enemyRemote: Infinity,
                    allyRemote: Infinity
                },
            })

            return false
        }

        if (!this.commune) return false

        this.message += this.commune.name
        this.say(this.message)

        this.createMoveRequest({
            origin: this.pos,
            goals: [
                {
                    pos: this.commune.anchor,
                    range: 3,
                },
            ],
            avoidEnemyRanges: true,
            typeWeights: {
                enemy: Infinity,
                ally: Infinity,
                keeper: Infinity,
                enemyRemote: Infinity,
                allyRemote: Infinity
            },
        })

        return true
    }

    relayCoord?(coord: Coord) {
        if (Memory.roomVisuals) this.room.visual.circle(coord.x, coord.y, { fill: myColors.lightBlue })

        const creepAtPosName = this.room.creepPositions.get(pack(coord))
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
        this.memory.SI = creepAtPos.memory.SI !== undefined ? creepAtPos.memory.SI : this.memory.SI
        creepAtPos.memory.RN = newCreepAtPosRemote
        creepAtPos.memory.SI = newCreepAtPosSourceIndex

        this.getResources()

        const remoteHauler = creepAtPos as RemoteHauler
        remoteHauler.deliverResources()

        return true
    }

    relayCardinal?(moveRequestCoord: Coord) {
        let offsets = relayOffsets.horizontal
        if (this.pos.y === moveRequestCoord.y) offsets = relayOffsets.vertical

        for (const offset of offsets) {
            const coord = {
                x: moveRequestCoord.x + offset.x,
                y: moveRequestCoord.y + offset.y,
            }

            if (this.relayCoord(coord)) {
                customLog('RELAY CARDINAL', 'cardinal')
                return true
            }
        }

        return false
    }

    relayDiagonal?(moveRequestCoord: Coord) {
        let offsets

        if (this.pos.y > moveRequestCoord.y) {
            offsets = relayOffsets.topLeft
            if (this.pos.x < moveRequestCoord.x) offsets = relayOffsets.topRight
        } else {
            offsets = relayOffsets.bottomLeft
            if (this.pos.x < moveRequestCoord.x) offsets = relayOffsets.bottomRight
        }

        for (const offset of offsets) {
            const coord = {
                x: moveRequestCoord.x + offset.x,
                y: moveRequestCoord.y + offset.y,
            }

            // If the x and y are dissimilar

            if (coord.x !== moveRequestCoord.x && coord.y !== moveRequestCoord.y) continue

            if (this.relayCoord(coord)) {
                customLog('RELAY DIAGONAL', 'diagonal')
                return true
            }
        }

        return false
    }

    relayAsFull?() {
        if (!this.moveRequest) return
        if (this.movedResource) return
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) return

        const moveRequestCoord = unpackAsPos(this.moveRequest)

        if (this.pos.x === moveRequestCoord.x || this.pos.y === moveRequestCoord.y) {
            this.relayCardinal(moveRequestCoord)
            return
        }

        this.relayDiagonal(moveRequestCoord)
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static remoteHaulerManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RemoteHauler = Game.creeps[creepName] as RemoteHauler

            let returnTripTime = 0
            if (creep.memory.RN && creep.memory.SI !== undefined) {
                const remoteName = creep.memory.RN
                const remoteMemory = Memory.rooms[remoteName]
                //the 1.1 is to add some margin for the return trip.
                returnTripTime = remoteMemory.SE[creep.memory.SI] * 1.1
            }

            if (creep.needsResources() && creep.ticksToLive > returnTripTime) {
                creep.getResources()
                continue
            }

            // Otherwise if the creep doesn't need resources

            // If the creep has a remoteName, delete it and delete it's fulfilled needs

            //if (creep.memory.RN) creep.removeRemote()

            if (creep.deliverResources()) findFunctionCPU(() => creep.relayAsFull())
        }
    }
}
