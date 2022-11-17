import { myColors, relayOffsets, RemoteData } from 'international/constants'
import {
    customLog,
    findClosestObject,
    findCoordsInsideRect,
    findFunctionCPU,
    findObjectWithID,
    getRange,
    randomTick,
} from 'international/utils'
import { indexOf } from 'lodash'
import { packCoord, reverseCoordList, unpackCoord, unpackPosList } from 'other/packrat'
import { creepClasses } from 'room/creeps/creepClasses'
import { Hauler } from '../commune/hauler'

export class RemoteHauler extends Creep {
    public get dying() {
        // Inform as dying if creep is already recorded as dying

        if (this._dying !== undefined) return this._dying

        // Stop if creep is spawning

        if (this.spawning) return false

        // If the creep's remaining ticks are more than the estimated spawn time, inform false

        if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

        // Record creep as dying

        return (this._dying = true)
    }

    preTickManager() {
        if (!this.memory.RN) return
        if (randomTick() && !this.getActiveBodyparts(MOVE)) this.suicide()

        if (Memory.rooms[this.memory.RN].T !== 'remote') {
            delete this.memory.RN
            return
        }

        // If the creep's remote no longer is managed by its commune
        else if (Memory.rooms[this.memory.RN].CN !== this.commune.name) {
            // Delete it from memory and try to find a new one

            this.removeRemote()
            return
        }

        if (this.dying) return

        Memory.rooms[this.memory.RN].data[RemoteData[`remoteHauler${this.memory.SI}`]] -= this.parts.carry
    }

    /**
     * Finds a remote to haul from
     */
    findRemote?(): boolean {
        if (this.memory.RN) return true

        for (const remoteInfo of this.commune.remoteSourceIndexesByEfficacy) {
            const splitRemoteInfo = remoteInfo.split(' ')
            const remoteName = splitRemoteInfo[0]
            const sourceIndex = parseInt(splitRemoteInfo[1]) as 0 | 1
            const remoteMemory = Memory.rooms[remoteName]

            // If there is no need

            if (remoteMemory.data[RemoteData[`remoteHauler${sourceIndex}`]] <= 0) continue

            this.assignRemote(remoteName, sourceIndex)
            return true
        }

        return false
    }

    assignRemote?(remoteName: string, sourceIndex: 0 | 1) {
        this.memory.RN = remoteName
        this.memory.SI = sourceIndex

        if (this.dying) return

        Memory.rooms[remoteName].data[RemoteData[`remoteHauler${this.memory.SI}`]] -= this.parts.carry
    }

    removeRemote?() {
        if (!this.dying && Memory.rooms[this.memory.RN].data) {
            Memory.rooms[this.memory.RN].data[RemoteData[`remoteHauler${this.memory.SI}`]] += this.parts.carry
        }

        delete this.memory.RN
        delete this.memory.SI
    }

    /*
    updateRemote?() {
        if (this.memory.RN) {

            return true
        }

        const remoteNamesByEfficacy = this.commune.remoteNamesBySourceEfficacy

        let roomMemory

        for (const roomName of remoteNamesByEfficacy) {
            roomMemory = Memory.rooms[roomName]

            if (roomMemory.needs[RemoteData.remoteHauler] <= 0) continue

            this.memory.RN = roomName
            roomMemory.needs[RemoteData.remoteHauler] -= this.parts.carry

            return true
        }

        return false
    }
 */
    getDroppedEnergy?() {
        for (const resource of this.pos.lookFor(LOOK_RESOURCES)) {
            if (resource.resourceType !== RESOURCE_ENERGY) continue

            this.pickup(resource)
            this.movedResource = true
            return true
        }

        return false
    }

    getResources?() {
        // Try to find a remote

        if (!this.findRemote()) {
            // If the room is the creep's commune

            if (this.room.name === this.commune.name) {
                // Advanced recycle and iterate

                this.advancedRecycle()
                return false
            }

            // Otherwise, have the creep make a moveRequest to its commune and iterate

            this.createMoveRequestByPath(
                {
                    origin: this.pos,
                    goals: [
                        {
                            pos: this.commune.anchor,
                            range: 25,
                        },
                    ],
                },
                {
                    packedPath: Memory.rooms[this.commune.name].SPs[this.memory.SI],
                },
            )

            return false
        }

        const sourcePos = unpackPosList(Memory.rooms[this.memory.RN].SP[this.memory.SI])[0]

        // If the creep is in the remote

        if (this.room.name === this.memory.RN) {
            if ((this.memory?.Rs?.length || 0 == 0) && getRange(this.pos.x, sourcePos.x, this.pos.y, sourcePos.y) > 1) {
                this.getDroppedEnergy()

                this.createMoveRequestByPath(
                    {
                        origin: this.pos,
                        goals: [
                            {
                                pos: sourcePos,
                                range: 1,
                            },
                        ],
                        avoidEnemyRanges: true,
                    },
                    {
                        packedPath: reverseCoordList(Memory.rooms[this.memory.RN].SPs[this.memory.SI]),
                        remoteName: this.memory.RN,
                    },
                )

                return true
            }

            this.moved = 'yeild'

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

            delete this.moved

            this.message += this.commune.name
            this.say(this.message)

            this.createMoveRequestByPath(
                {
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
                        allyRemote: Infinity,
                    },
                },
                {
                    packedPath: reverseCoordList(Memory.rooms[this.memory.RN].SPs[this.memory.SI]),
                    remoteName: this.memory.RN,
                    loose: true,
                },
            )

            return true
        }

        this.message += this.memory.RN
        this.say(this.message)

        this.getDroppedEnergy()

        this.createMoveRequestByPath(
            {
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
                    allyRemote: Infinity,
                },
                avoidAbandonedRemotes: true,
            },
            {
                packedPath: reverseCoordList(Memory.rooms[this.memory.RN].SPs[this.memory.SI]),
                remoteName: this.memory.RN,
            },
        )

        return true
    }

    reserveWithdrawEnergy() {
        if (this.memory.Rs && this.memory.Rs?.length) return
        if (!this.needsResources()) return

        const { room } = this
        const sourcePos = room.sourcePositions[this.memory.SI][0]

        if (this.freeCapacityNextTick === undefined) this.freeCapacityNextTick = this.store.getFreeCapacity()

        let withdrawTargets = room.MAWT.filter(target => {
            if (getRange(target.pos.x, sourcePos.x, target.pos.y, sourcePos.y) > 1) return false

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

            const storingStructure = this.room.storage || this.room.terminal

            // We don't want remote haulers fulfilling reservations all over the place in the commune

            if (storingStructure) {
                let inRangeTransferTargets = this.pos.findInRange(
                    this.room.METT.filter(et => et.store.getFreeCapacity(RESOURCE_ENERGY) > 0),
                    1,
                )
                if (inRangeTransferTargets.length > 0) {
                    const target = inRangeTransferTargets[0]
                    const transferResult = this.transfer(target, RESOURCE_ENERGY)

                    // If the action can be considered a success

                    if (transferResult === OK) {
                        this.movedResource = true
                        this.message += 'ATG'
                    } else {
                        this.message += 'ATF'
                        this.message += transferResult
                    }
                }

                inRangeTransferTargets = this.pos.findInRange(
                    this.room.MEFTT.filter(et => et.store.getFreeCapacity(RESOURCE_ENERGY) > 0),
                    1,
                )
                if (inRangeTransferTargets.length > 0) {
                    const target = inRangeTransferTargets[0]
                    const transferResult = this.transfer(target, RESOURCE_ENERGY)

                    // If the action can be considered a success

                    if (transferResult === OK) {
                        this.movedResource = true
                        this.message += 'AFTG'
                    } else {
                        this.message += 'AFTF'
                        this.message += transferResult
                    }
                }

                if (!this.memory.Rs || this.memory.Rs.length == 0)
                    this.createReservation(
                        'transfer',
                        storingStructure.id,
                        this.store[RESOURCE_ENERGY],
                        RESOURCE_ENERGY,
                    )
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

            this.createMoveRequestByPath(
                {
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
                        allyRemote: Infinity,
                    },
                },
                {
                    packedPath: reverseCoordList(Memory.rooms[this.memory.RN].SPs[this.memory.SI]),
                    remoteName: this.memory.RN,
                },
            )

            return false
        }

        this.message += this.commune.name
        this.say(this.message)

        this.createMoveRequestByPath(
            {
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
                    allyRemote: Infinity,
                },
            },
            {
                packedPath: Memory.rooms[this.commune.name].SPs[this.memory.SI],
            },
        )

        return true
    }

    relayCoord?(coord: Coord) {
        if (Memory.roomVisuals) this.room.visual.circle(coord.x, coord.y, { fill: myColors.lightBlue })

        const creepAtPosName = this.room.creepPositions.get(packCoord(coord))
        if (!creepAtPosName) return false

        const creepAtPos = Game.creeps[creepAtPosName]

        if (creepAtPos.role !== 'remoteHauler') return false
        if (creepAtPos.movedResource) return false
        if (creepAtPos.store.getUsedCapacity() === creepAtPos.store.getCapacity()) return false
        if (
            creepAtPos.store.getFreeCapacity() !== this.store.getUsedCapacity(RESOURCE_ENERGY) &&
            creepAtPos.store.getCapacity() !== this.store.getCapacity()
        )
            return false

        this.transfer(creepAtPos, RESOURCE_ENERGY)

        this.movedResource = true
        creepAtPos.movedResource = true

        this.store.energy -= creepAtPos.store.getFreeCapacity()
        creepAtPos.store.energy += this.store.getUsedCapacity(RESOURCE_ENERGY)

        // Stop previously attempted moveRequests as they do not account for a relay

        delete this.moveRequest
        delete creepAtPos.moveRequest

        delete this.moved
        delete creepAtPos.moved

        // Trade memory

        const newCreepAtPosMemory = JSON.parse(JSON.stringify(this.memory))

        this.memory = creepAtPos.memory
        creepAtPos.memory = newCreepAtPosMemory

        // Delete old values

        delete this.memory.P
        delete creepAtPos.memory.P

        this.getResources()

        const remoteHauler = creepAtPos as RemoteHauler
        remoteHauler.deliverResources()

        return true
    }

    relayCardinal?(moveCoord: Coord) {
        let offsets = relayOffsets.horizontal
        if (this.pos.y === moveCoord.y) offsets = relayOffsets.vertical

        for (const offset of offsets) {
            const coord = {
                x: moveCoord.x + offset.x,
                y: moveCoord.y + offset.y,
            }

            if (this.relayCoord(coord)) return true
        }

        return false
    }

    relayDiagonal?(moveCoord: Coord) {
        let offsets

        if (this.pos.y > moveCoord.y) {
            offsets = relayOffsets.topLeft
            if (this.pos.x < moveCoord.x) offsets = relayOffsets.topRight
        } else {
            offsets = relayOffsets.bottomLeft
            if (this.pos.x < moveCoord.x) offsets = relayOffsets.bottomRight
        }

        for (const offset of offsets) {
            const coord = {
                x: moveCoord.x + offset.x,
                y: moveCoord.y + offset.y,
            }

            // If the x and y are dissimilar

            if (coord.x !== moveCoord.x && coord.y !== moveCoord.y) continue

            if (this.relayCoord(coord)) return true
        }

        return false
    }

    relayAsFull?() {
        // If there is no easy way to know what coord the creep is trying to go to next

        if (!this.moveRequest && (!this.memory.P || !this.memory.P.length)) return
        if (this.movedResource) return
        if (this.store.getUsedCapacity(RESOURCE_ENERGY) === 0) return

        const moveCoord = this.moveRequest ? unpackCoord(this.moveRequest) : unpackPosList(this.memory.P)[0]

        if (this.pos.x === moveCoord.x || this.pos.y === moveCoord.y) {
            this.relayCardinal(moveCoord)
            return
        }

        this.relayDiagonal(moveCoord)
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    run?() {
        let returnTripTime = 0
        if (this.memory.RN && this.memory.SI !== undefined && Memory.rooms[this.memory.RN]) {
            // The 1.1 is to add some margin for the return trip
            if (
                Memory.rooms[this.memory.RN] &&
                Memory.rooms[this.memory.RN].SP &&
                Memory.rooms[this.memory.RN].SPs.length > this.memory.SI + 1
            )
                returnTripTime = Memory.rooms[this.memory.RN].SPs[this.memory.SI].length * 1.1
        }

        if (this.needsResources() && this.ticksToLive > returnTripTime) {
            this.getResources()
            return
        }

        // Otherwise if the creep doesn't need resources

        // If the creep has a remoteName, delete it and delete it's fulfilled needs

        if (this.deliverResources()) this.relayAsFull()
    }

    static remoteHaulerManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep = Game.creeps[creepName] as RemoteHauler
            creep.run()
        }
    }
}
