import { customColors, relayOffsets, RemoteData } from 'international/constants'
import {
    customLog,
    findClosestObject,
    findCoordsInsideRect,
    findFunctionCPU,
    findObjectWithID,
    getRange,
    getRangeOfCoords,
    randomTick,
} from 'international/utils'
import { indexOf } from 'lodash'
import { packCoord, reversePosList, unpackCoord, unpackPos, unpackPosList } from 'other/codec'
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

        if (!this.findRemote()) return
        if (this.dying) return

        Memory.rooms[this.memory.RN].data[RemoteData[`remoteHauler${this.memory.SI as 0 | 1}`]] -= this.parts.carry
    }

    hasValidRemote?() {
        if (!this.memory.RN) return false

        const remoteMemory = Memory.rooms[this.memory.RN]

        if (remoteMemory.T !== 'remote') return false
        if (remoteMemory.CN !== this.commune.name) return false
        if (remoteMemory.data[RemoteData.abandon]) return false

        return true
    }

    /**
     * Finds a remote to harvest in
     */
    findRemote?() {
        if (this.hasValidRemote()) return true

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

        Memory.rooms[remoteName].data[RemoteData[`remoteHauler${this.memory.SI as 0 | 1}`]] -= this.parts.carry
    }

    removeRemote?() {
        if (!this.dying && Memory.rooms[this.memory.RN].data) {
            Memory.rooms[this.memory.RN].data[RemoteData[`remoteHauler${this.memory.SI as 0 | 1}`]] += this.parts.carry
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

            this.createMoveRequest({
                origin: this.pos,
                goals: [
                    {
                        pos: this.commune.anchor,
                        range: 25,
                    },
                ],
            })

            return false
        }

        // If the creep is in the remote

        if (this.room.name === this.memory.RN) {
            if (!this.getRemoteSourceResources()) return false

            // We have enough resources, return home

            delete this.moved

            this.message += this.commune.name

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
                    packedPath: Memory.rooms[this.memory.RN].SPs[this.memory.SI],
                    remoteName: this.memory.RN,
                    loose: true,
                },
            )

            return true
        }

        // We aren't in the remote, go to the source

        const sourcePos = unpackPosList(Memory.rooms[this.memory.RN].SP[this.memory.SI])[0]

        this.message += this.memory.RN

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
                packedPath: reversePosList(Memory.rooms[this.memory.RN].SPs[this.memory.SI]),
                remoteName: this.memory.RN,
                loose: true,
            },
        )

        return true
    }

    /**
     *
     * @returns If the creep no longer needs energy
     */
    getRemoteSourceResources?() {
        const sourcePos = unpackPosList(Memory.rooms[this.memory.RN].SP[this.memory.SI])[0]

        // We aren't next to the source

        if (getRangeOfCoords(this.pos, sourcePos) > 1) {
            // Fulfill requests near the hauler

            this.runRoomLogisticsRequestsAdvanced({
                types: new Set(['pickup', 'withdraw']),
                resourceTypes: new Set([RESOURCE_ENERGY]),
                conditions: request => {
                    // If the target is near the creep

                    const targetPos = findObjectWithID(request.targetID).pos
                    return getRangeOfCoords(targetPos, this.pos) <= 1
                },
            })

            if (!this.needsResources()) return true

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
                    packedPath: reversePosList(Memory.rooms[this.memory.RN].SPs[this.memory.SI]),
                    remoteName: this.memory.RN,
                    loose: true,
                },
            )

            return false
        }

        // We are next to the source

        this.moved = 'yeild'

        // Fulfill requests near the source

        this.runRoomLogisticsRequestsAdvanced({
            types: new Set(['withdraw', 'pickup']),
            resourceTypes: new Set([RESOURCE_ENERGY]),
            conditions: request => {
                // If the target is near the hauler

                const targetPos = findObjectWithID(request.targetID).pos
                return getRangeOfCoords(targetPos, this.pos) <= 1
            },
        })

        return !this.needsResources()
    }

    deliverResources?() {
        if (this.room.name === this.commune.name) {
            // Try to renew the creep

            this.passiveRenew()

            this.runRoomLogisticsRequestsAdvanced({
                types: new Set(['transfer']),
                resourceTypes: new Set([RESOURCE_ENERGY]),
            })

            if (!this.needsResources()) return true

            if (!this.findRemote()) return false

            this.message += this.memory.RN

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
                    packedPath: reversePosList(Memory.rooms[this.memory.RN].SPs[this.memory.SI]),
                    remoteName: this.memory.RN,
                    loose: true,
                },
            )

            return false
        }

        this.message += this.commune.name

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
                packedPath: Memory.rooms[this.memory.RN].SPs[this.memory.SI],
                loose: true,
            },
        )

        return true
    }

    relayCoord?(coord: Coord) {
        if (Memory.roomVisuals) this.room.visual.circle(coord.x, coord.y, { fill: customColors.lightBlue })

        const creepAtPosName = this.room.creepPositions[packCoord(coord)]
        if (!creepAtPosName) return false

        const creepAtPos = Game.creeps[creepAtPosName]

        if (creepAtPos.role !== 'remoteHauler') return false
        if (creepAtPos.movedResource) return false
        if (!creepAtPos.freeNextStore) return false
        if (creepAtPos.freeNextStore !== this.usedNextStore) return false

        this.transfer(creepAtPos, RESOURCE_ENERGY)

        this.movedResource = true
        creepAtPos.movedResource = true

        const nextEnergy = Math.min(this.nextStore.energy, creepAtPos.freeNextStore)
        this.nextStore.energy -= nextEnergy
        creepAtPos.nextStore.energy += nextEnergy

        // Stop previously attempted moveRequests as they do not account for a relay

        delete this.moveRequest
        delete creepAtPos.moveRequest

        delete this.moved
        delete creepAtPos.moved

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

    relay?() {
        // If there is no easy way to know what coord the creep is trying to go to next

        if (!this.moveRequest && (!this.memory.P || !this.memory.P.length)) return
        if (this.movedResource) return
        if (!this.nextStore.energy) return

        // Don't relay too close to the source position unless we are fatigued

        if (
            !this.fatigue &&
            this.memory.RN == this.room.name &&
            getRangeOfCoords(this.room.sourcePositions[this.memory.SI][0], this.pos) <= 1
        )
            return

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

        if (this.deliverResources()) this.relay()
    }

    static remoteHaulerManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep = Game.creeps[creepName] as RemoteHauler
            creep.run()
        }
    }
}
