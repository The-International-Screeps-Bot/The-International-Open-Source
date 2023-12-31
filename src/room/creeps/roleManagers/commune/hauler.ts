import {
    CreepMemoryKeys,
    CreepRoomLogisticsRequestKeys,
    FlagNames,
    MovedTypes,
    Result,
    RoomLogisticsRequestTypes,
    RoomMemoryKeys,
    RoomTypes,
    SleepFor,
    customColors,
    packedPosLength,
    relayOffsets,
} from 'international/constants'
import { statsManager } from 'international/statsManager'
import { packCoord, reversePosList, unpackCoord, unpackPosAt } from 'other/codec'
import { myCreepUtils } from 'room/creeps/myCreepUtils'
import {
    findObjectWithID,
    getRange,
    getRangeXY,
    randomIntRange,
    randomTick,
} from 'utils/utils'

export class Hauler extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    public isDying() {
        // Stop if creep is spawning

        if (this.spawning) return false
        /*
        // If the creep's remaining ticks are more than the estimated spawn time, inform false

        if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false
 */
        const creepMemory = Memory.creeps[this.name]

        if (creepMemory[CreepMemoryKeys.remote]) {
            if (creepMemory[CreepMemoryKeys.sourceIndex] === undefined) throw Error('has remote but no sourceIndex')
            if (
                this.ticksToLive >
                this.body.length * CREEP_SPAWN_TIME +
                    Memory.rooms[creepMemory[CreepMemoryKeys.remote]][
                        this.commune.communeManager.remoteResourcePathType
                    ][creepMemory[CreepMemoryKeys.sourceIndex]].length /
                        packedPosLength
            ) {
                return false
            }
        }
        if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

        return true
    }

    passiveRenew() {

        const { room } = this

        // If there is insufficient CPU to renew, inform false

        if (this.body.length > 10) return
        if (!room.myCreepsByRole.fastFiller.length) return
        // only renew if we are the same as the desired hauler cost
        if (this.cost !== Memory.rooms[room.name][RoomMemoryKeys.minHaulerCost]) return

        // If the creep's age is less than the benefit from renewing, inform false

        const energyCost = Math.ceil(this.findCost() / 2.5 / this.body.length)
        if (CREEP_LIFE_TIME - this.ticksToLive < Math.floor(600 / this.body.length)) return

        // Get the room's spawns, stopping if there are none

        const spawns = room.roomManager.structures.spawn

        // Get a spawn in range of 1, informing false if there are none

        const spawn = spawns.find(
            spawn =>
                getRangeXY(this.pos.x, spawn.pos.x, this.pos.y, spawn.pos.y) === 1 &&
                !spawn.renewed &&
                !spawn.spawning &&
                spawn.isRCLActionable,
        )
        if (!spawn) return

        const result = spawn.renewCreep(this)
        if (result === OK) {
            statsManager.updateStat(this.room.name, 'eosp', energyCost)
            spawn.renewed = true
        }
    }

    initRun() {
        if (randomTick() && (!this.getActiveBodyparts(MOVE) || !this.getActiveBodyparts(CARRY))) {
            this.suicide()
            return
        }

        const creepMemory = Memory.creeps[this.name]
        if (creepMemory[CreepMemoryKeys.previousRelayer] && Game.time > creepMemory[CreepMemoryKeys.previousRelayer][1] + 1) {

            creepMemory[CreepMemoryKeys.previousRelayer] = undefined
        }

        const carryParts = myCreepUtils.parts(this).carry
        this.commune.communeManager.haulerCarryParts += carryParts

        if (this.hasValidRemote()) {
            this.applyRemote()
            return
        }

        // We don't have a valid remote
        this.removeRemote()

        const commune = this.commune
        if (creepMemory[CreepMemoryKeys.taskRoom] === commune.name) {
            commune.communeManager.communeHaulerCarryParts += carryParts
            commune.communeManager.communeHaulers.push(this.name)
        }
    }

    hasValidRemote?() {
        const remoteName = Memory.creeps[this.name][CreepMemoryKeys.remote]
        if (!remoteName) return false

        const remoteMemory = Memory.rooms[remoteName]

        if (remoteMemory[RoomMemoryKeys.disable]) return false
        if (remoteMemory[RoomMemoryKeys.abandonRemote]) return false
        if (remoteMemory[RoomMemoryKeys.enemyReserved]) return false
        if (remoteMemory[RoomMemoryKeys.type] !== RoomTypes.remote) return false
        if (remoteMemory[RoomMemoryKeys.commune] !== this.commune.name) return false

        return true
    }

    /**
     * Finds a remote to harvest in
     */
    findRemote?() {
        if (this.hasValidRemote()) return true

        for (const remoteInfo of this.commune.roomManager.remoteSourceIndexesByEfficacy) {
            const splitRemoteInfo = remoteInfo.split(' ')
            const remoteName = splitRemoteInfo[0]
            const remoteMemory = Memory.rooms[remoteName]

            if (remoteMemory[RoomMemoryKeys.disable]) continue
            if (remoteMemory[RoomMemoryKeys.abandonRemote]) continue
            if (remoteMemory[RoomMemoryKeys.type] !== RoomTypes.remote) continue
            if (remoteMemory[RoomMemoryKeys.commune] !== this.commune.name) continue

            const sourceIndex = parseInt(splitRemoteInfo[1])
            if (!this.isRemoteValid(remoteName, sourceIndex)) continue

            /* this.room.visual.text((this.freeNextStore + remoteMemory[RoomMemoryKeys.remoteSourceCreditReservation][sourceIndex]).toString(), this.pos.x, this.pos.y + 0.5) */
            this.assignRemote(remoteName, sourceIndex)
            return true
        }

        return false
    }

    isRemoteValid?(remoteName: string, sourceIndex: number) {
        const remoteMemory = Memory.rooms[remoteName]
        const commune = this.commune

        // Make sure we have enough life to get there

        const pathLength =
            remoteMemory[commune.communeManager.remoteResourcePathType][sourceIndex].length /
            packedPosLength
        if (pathLength >= this.ticksToLive) return false

        // Make sure we have enough free space to keep reservation below credit
        if (
            remoteMemory[RoomMemoryKeys.remoteSourceCredit][sourceIndex] -
                remoteMemory[RoomMemoryKeys.remoteSourceCreditReservation][sourceIndex] <
            this.freeNextStore
        ) {
            return false
        }

        // If we do roads but the remote doesn't - change to be a low-priority search later
        if (Memory.creeps[this.name][CreepMemoryKeys.preferRoads]) {

            const roadsQuota = remoteMemory[commune.communeManager.remoteResourcePathType][sourceIndex].length / packedPosLength

            // See if there are roads close enough or more than the quota
            if (remoteMemory[RoomMemoryKeys.roads][sourceIndex] < roadsQuota * 0.9) return false
        }

        return true
    }

    isCurrentRemoteValid?() {
        const creepMemory = Memory.creeps[this.name]
        return this.isRemoteValid(
            creepMemory[CreepMemoryKeys.remote],
            creepMemory[CreepMemoryKeys.sourceIndex],
        )
    }

    assignRemote?(remoteName: string, sourceIndex: number) {
        const creepMemory = Memory.creeps[this.name]

        creepMemory[CreepMemoryKeys.remote] = remoteName
        creepMemory[CreepMemoryKeys.sourceIndex] = sourceIndex
        creepMemory[CreepMemoryKeys.taskRoom] = undefined
        creepMemory[CreepMemoryKeys.roomLogisticsRequests] = []

        this.applyRemote()
    }

    applyRemote?() {
        if (this.isDying()) return
        if (!this.needsResources()) return

        const creepMemory = Memory.creeps[this.name]

        Memory.rooms[creepMemory[CreepMemoryKeys.remote]][
            RoomMemoryKeys.remoteSourceCreditReservation
        ][creepMemory[CreepMemoryKeys.sourceIndex]] += this.dataChange = this.freeNextStore
    }

    removeRemote?() {
        const creepMemory = Memory.creeps[this.name]

        if (!this.isDying) {
            Memory.rooms[creepMemory[CreepMemoryKeys.remote]][
                RoomMemoryKeys.remoteSourceCreditReservation
            ][creepMemory[CreepMemoryKeys.sourceIndex]] -= this.dataChange
        }

        delete creepMemory[CreepMemoryKeys.remote]
        delete creepMemory[CreepMemoryKeys.sourceIndex]
    }

    getResources?() {
        const creepMemory = Memory.creeps[this.name]

        // Try to find a remote

        if (!this.findRemote()) {
            this.message = '❌ Remote'

            if (this.room.name !== this.commune.name) {
                const anchor = this.commune.roomManager.anchor
                if (!anchor) throw Error('no anchor for hauler')

                if (
                    this.createMoveRequest({
                        origin: this.pos,
                        goals: [
                            {
                                pos: anchor,
                                range: 25,
                            },
                        ],
                    }) === Result.fail
                ) {
                    creepMemory[CreepMemoryKeys.sleepFor] = SleepFor.any
                    creepMemory[CreepMemoryKeys.sleepTime] = Game.time + randomIntRange(10, 50)
                }
            }

            // If the room is the creep's commune
            /*
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
 */
            return false
        }

        // If the creep is in the remote

        if (this.room.name === this.memory[CreepMemoryKeys.remote]) {
            if (!this.getRemoteSourceResources()) return false

            // We have enough resources, return home

            delete this.moved

            this.message += this.commune.name

            const anchor = this.commune.roomManager.anchor
            if (!anchor) throw Error('No anchor for hauler ' + this.room.name)

            this.createMoveRequestByPath(
                {
                    origin: this.pos,
                    goals: [
                        {
                            pos: anchor,
                            range: 3,
                        },
                    ],
                    avoidEnemyRanges: true,
                    typeWeights: {
                        [RoomTypes.enemy]: Infinity,
                        [RoomTypes.ally]: Infinity,
                        [RoomTypes.sourceKeeper]: Infinity,
                        [RoomTypes.enemyRemote]: Infinity,
                        [RoomTypes.allyRemote]: Infinity,
                    },
                },
                {
                    packedPath:
                        Memory.rooms[creepMemory[CreepMemoryKeys.remote]][
                            this.commune.communeManager.remoteResourcePathType
                        ][creepMemory[CreepMemoryKeys.sourceIndex]],
                    remoteName: creepMemory[CreepMemoryKeys.remote],
                },
            )

            return true
        }

        if (this.room.name !== this.commune.name) {
            // Fulfill requests near the hauler

            this.runRoomLogisticsRequestsAdvanced({
                types: new Set([
                    RoomLogisticsRequestTypes.pickup,
                    RoomLogisticsRequestTypes.withdraw,
                ]),
                resourceTypes: new Set([RESOURCE_ENERGY]),
                conditions: request => {
                    // If the target is near the creep

                    const targetPos = findObjectWithID(request.targetID).pos
                    return getRange(targetPos, this.pos) <= 0
                },
            })

            if (!this.needsResources()) {
                // We have enough resources, return home

                delete this.moved

                this.message += this.commune.name

                const anchor = this.commune.roomManager.anchor
                if (!anchor) throw Error('No anchor for hauler ' + this.room.name)

                this.createMoveRequestByPath(
                    {
                        origin: this.pos,
                        goals: [
                            {
                                pos: anchor,
                                range: 3,
                            },
                        ],
                        avoidEnemyRanges: true,
                        typeWeights: {
                            [RoomTypes.enemy]: Infinity,
                            [RoomTypes.ally]: Infinity,
                            [RoomTypes.sourceKeeper]: Infinity,
                            [RoomTypes.enemyRemote]: Infinity,
                            [RoomTypes.allyRemote]: Infinity,
                        },
                    },
                    {
                        packedPath:
                            Memory.rooms[creepMemory[CreepMemoryKeys.remote]][
                                this.commune.communeManager.remoteResourcePathType
                            ][creepMemory[CreepMemoryKeys.sourceIndex]],
                        remoteName: creepMemory[CreepMemoryKeys.remote],
                    },
                )

                return true
            }
        }

        // We aren't in the remote, go to the source

        const sourceHarvestPos = unpackPosAt(
            Memory.rooms[creepMemory[CreepMemoryKeys.remote]][
                RoomMemoryKeys.remoteSourceHarvestPositions
            ][creepMemory[CreepMemoryKeys.sourceIndex]],
        )

        this.message += creepMemory[CreepMemoryKeys.remote]
        console.log(creepMemory[CreepMemoryKeys.remote])
        this.createMoveRequestByPath(
            {
                origin: this.pos,
                goals: [
                    {
                        pos: sourceHarvestPos,
                        range: 1,
                    },
                ],
                avoidEnemyRanges: true,
                typeWeights: {
                    [RoomTypes.enemy]: Infinity,
                    [RoomTypes.ally]: Infinity,
                    [RoomTypes.sourceKeeper]: Infinity,
                    [RoomTypes.enemyRemote]: Infinity,
                    [RoomTypes.allyRemote]: Infinity,
                },
                avoidDanger: true,
            },
            {
                packedPath: reversePosList(
                    Memory.rooms[creepMemory[CreepMemoryKeys.remote]][
                        this.commune.communeManager.remoteResourcePathType
                    ][creepMemory[CreepMemoryKeys.sourceIndex]],
                ),
                remoteName: creepMemory[CreepMemoryKeys.remote],
            },
        )

        return true
    }

    /**
     *
     * @returns If the creep no longer needs energy
     */
    getRemoteSourceResources?() {
        const creepMemory = Memory.creeps[this.name]
        const sourceHarvestPos = unpackPosAt(
            Memory.rooms[this.room.name][RoomMemoryKeys.remoteSourceHarvestPositions][
                creepMemory[CreepMemoryKeys.sourceIndex]
            ],
        )

        // If we're ready to take on a request by the source or we already have one, perform it

        const isBySourceHarvestPos = getRange(this.pos, sourceHarvestPos) <= 1
        if (isBySourceHarvestPos || creepMemory[CreepMemoryKeys.roomLogisticsRequests].length > 0) {
            const freeNextStoreInitial = this.freeNextStore

            this.runRoomLogisticsRequestsAdvanced({
                types: new Set([
                    RoomLogisticsRequestTypes.pickup,
                    RoomLogisticsRequestTypes.withdraw,
                ]),
                resourceTypes: new Set([RESOURCE_ENERGY]),
                conditions: request => {
                    // If the target is near the creep or source

                    const targetPos = findObjectWithID(request.targetID).pos
                    return (
                        getRange(targetPos, this.pos) <= 1 ||
                        getRange(
                            targetPos,
                            this.room.roomManager.remoteSources[
                                creepMemory[CreepMemoryKeys.sourceIndex]
                            ].pos,
                        ) <= 1
                    )
                },
            })

            // remove fulfilled reserved source credit from source credit

            // Should be a negative number, as we should have more used store than before
            const freeNextStoreDifference = this.freeNextStore - freeNextStoreInitial
            if (freeNextStoreDifference !== 0) {
                Memory.rooms[this.room.name][RoomMemoryKeys.remoteSourceCredit][
                    creepMemory[CreepMemoryKeys.sourceIndex]
                ] += freeNextStoreDifference
                Memory.rooms[this.room.name][RoomMemoryKeys.remoteSourceCreditReservation][
                    creepMemory[CreepMemoryKeys.sourceIndex]
                ] += freeNextStoreDifference
            }

            return !this.needsResources()
        }

        // Fulfill requests near the hauler

        this.runRoomLogisticsRequestsAdvanced({
            types: new Set<RoomLogisticsRequestTypes>([
                RoomLogisticsRequestTypes.pickup,
                RoomLogisticsRequestTypes.withdraw,
            ]),
            resourceTypes: new Set([RESOURCE_ENERGY]),
            conditions: request => {
                // If the target is near the creep

                const targetPos = findObjectWithID(request.targetID).pos
                return getRange(targetPos, this.pos) <= 1
            },
        })

        if (!this.needsResources()) return true

        // We aren't by the sourceHarvestPos, get adjacent to it

        if (!isBySourceHarvestPos) {
            this.createMoveRequestByPath(
                {
                    origin: this.pos,
                    goals: [
                        {
                            pos: sourceHarvestPos,
                            range: 1,
                        },
                    ],
                    avoidEnemyRanges: true,
                },
                {
                    packedPath: reversePosList(
                        Memory.rooms[this.room.name][
                            this.commune.communeManager.remoteResourcePathType
                        ][creepMemory[CreepMemoryKeys.sourceIndex]],
                    ),
                    remoteName: this.room.name,
                },
            )

            return false
        }

        // We are next to the source

        this.moved = MovedTypes.wait

        return !this.needsResources()
    }

    deliverResources?() {
        const commune = this.commune

        if (commune.communeManager.remoteResourcePathType === RoomMemoryKeys.remoteSourceHubPaths) {
            if (this.room.name === commune.name) {
                this.passiveRenew()

                this.runRoomLogisticsRequestAdvanced({
                    types: new Set([RoomLogisticsRequestTypes.transfer]),
                    resourceTypes: new Set([RESOURCE_ENERGY]),
                    noDelivery: true,
                    conditions: request => {
                        // If the target is near the creep

                        const targetPos = findObjectWithID(request.targetID).pos
                        return getRange(targetPos, this.pos) <= 1
                    },
                })

                // We haven't emptied ourselves yet
                if (!this.needsResources()) {

                    if (getRange(this.pos, commune.storage.pos) <= 1) return true

                    this.createMoveRequestByPath(
                        {
                            origin: this.pos,
                            goals: [
                                {
                                    pos: commune.storage.pos,
                                    range: 1,
                                },
                            ],
                            avoidEnemyRanges: true,
                            typeWeights: {
                                [RoomTypes.enemy]: Infinity,
                                [RoomTypes.ally]: Infinity,
                                [RoomTypes.sourceKeeper]: Infinity,
                                [RoomTypes.enemyRemote]: Infinity,
                                [RoomTypes.allyRemote]: Infinity,
                            },
                        },
                        {
                            packedPath:
                                Memory.rooms[this.memory[CreepMemoryKeys.remote]][
                                    commune.communeManager.remoteResourcePathType
                                ][this.memory[CreepMemoryKeys.sourceIndex]],
                        },
                    )
                    return true
                }
                this.removeRemote()
                if (!this.findRemote()) return false

                this.message += this.memory[CreepMemoryKeys.remote]

                const sourceHarvestPos = unpackPosAt(
                    Memory.rooms[this.memory[CreepMemoryKeys.remote]][
                        RoomMemoryKeys.remoteSourceHarvestPositions
                    ][this.memory[CreepMemoryKeys.sourceIndex]],
                )

                this.createMoveRequestByPath(
                    {
                        origin: this.pos,
                        goals: [
                            {
                                pos: sourceHarvestPos,
                                range: 1,
                            },
                        ],
                        avoidEnemyRanges: true,
                        typeWeights: {
                            [RoomTypes.enemy]: Infinity,
                            [RoomTypes.ally]: Infinity,
                            [RoomTypes.sourceKeeper]: Infinity,
                            [RoomTypes.enemyRemote]: Infinity,
                            [RoomTypes.allyRemote]: Infinity,
                        },
                    },
                    {
                        packedPath: reversePosList(
                            Memory.rooms[this.memory[CreepMemoryKeys.remote]][
                                commune.communeManager.remoteResourcePathType
                            ][this.memory[CreepMemoryKeys.sourceIndex]],
                        ),
                        remoteName: this.memory[CreepMemoryKeys.remote],
                    },
                )

                return false
            }

            this.message += commune.name

            this.createMoveRequestByPath(
                {
                    origin: this.pos,
                    goals: [
                        {
                            pos: commune.storage.pos,
                            range: 1,
                        },
                    ],
                    avoidEnemyRanges: true,
                    typeWeights: {
                        [RoomTypes.enemy]: Infinity,
                        [RoomTypes.ally]: Infinity,
                        [RoomTypes.sourceKeeper]: Infinity,
                        [RoomTypes.enemyRemote]: Infinity,
                        [RoomTypes.allyRemote]: Infinity,
                    },
                },
                {
                    packedPath:
                        Memory.rooms[this.memory[CreepMemoryKeys.remote]][
                            commune.communeManager.remoteResourcePathType
                        ][this.memory[CreepMemoryKeys.sourceIndex]],
                },
            )
            return true
        }

        if (this.room.name === commune.name) {
            this.passiveRenew()

            this.runRoomLogisticsRequestsAdvanced({
                types: new Set<RoomLogisticsRequestTypes>([RoomLogisticsRequestTypes.transfer]),
                resourceTypes: new Set([RESOURCE_ENERGY]),
            })

            // We haven't emptied ourselves yet
            if (!this.needsResources()) return true
            this.removeRemote()
            if (!this.findRemote()) return false

            this.message += this.memory[CreepMemoryKeys.remote]

            const sourceHarvestPos = unpackPosAt(
                Memory.rooms[this.memory[CreepMemoryKeys.remote]][
                    RoomMemoryKeys.remoteSourceHarvestPositions
                ][this.memory[CreepMemoryKeys.sourceIndex]],
            )

            this.createMoveRequestByPath(
                {
                    origin: this.pos,
                    goals: [
                        {
                            pos: sourceHarvestPos,
                            range: 1,
                        },
                    ],
                    avoidEnemyRanges: true,
                    typeWeights: {
                        [RoomTypes.enemy]: Infinity,
                        [RoomTypes.ally]: Infinity,
                        [RoomTypes.sourceKeeper]: Infinity,
                        [RoomTypes.enemyRemote]: Infinity,
                        [RoomTypes.allyRemote]: Infinity,
                    },
                },
                {
                    packedPath: reversePosList(
                        Memory.rooms[this.memory[CreepMemoryKeys.remote]][
                            commune.communeManager.remoteResourcePathType
                        ][this.memory[CreepMemoryKeys.sourceIndex]],
                    ),
                    remoteName: this.memory[CreepMemoryKeys.remote],
                },
            )

            return false
        }

        this.message += commune.name

        const anchor = commune.roomManager.anchor
        if (!anchor) throw Error('No anchor for hauler ' + this.room.name)

        this.createMoveRequestByPath(
            {
                origin: this.pos,
                goals: [
                    {
                        pos: anchor,
                        range: 3,
                    },
                ],
                avoidEnemyRanges: true,
                typeWeights: {
                    [RoomTypes.enemy]: Infinity,
                    [RoomTypes.ally]: Infinity,
                    [RoomTypes.sourceKeeper]: Infinity,
                    [RoomTypes.enemyRemote]: Infinity,
                    [RoomTypes.allyRemote]: Infinity,
                },
            },
            {
                packedPath:
                    Memory.rooms[this.memory[CreepMemoryKeys.remote]][
                        commune.communeManager.remoteResourcePathType
                    ][this.memory[CreepMemoryKeys.sourceIndex]],
                loose: true,
            },
        )

        return true
    }

    relayCoord?(coord: Coord) {
        if (global.settings.roomVisuals) {
            this.room.visual.circle(coord.x, coord.y, { fill: customColors.lightBlue })
        }

        const creepAtPosName = this.room.creepPositions[packCoord(coord)]
        if (!creepAtPosName) return false

        const creepAtPos = Game.creeps[creepAtPosName]

        if (creepAtPos.role !== 'hauler') return false
        if (creepAtPos.movedResource) return false

        const creepMemory = Memory.creeps[this.name]
        // ensure we aren't relaying with the same creep as last tick
        if (creepMemory[CreepMemoryKeys.previousRelayer] && creepMemory[CreepMemoryKeys.previousRelayer][0] === creepAtPos.name) return false

        // ensure the creep receiving creep is empty
        /* if (creepAtPos.store.getUsedCapacity() > 0) return false */
        if (creepAtPos.store.getUsedCapacity() > 0) return false

        // Ensure that they have the same opinions on roads
        if (creepMemory[CreepMemoryKeys.preferRoads] !== creepMemory[CreepMemoryKeys.preferRoads]) return false

        let amount: number | undefined
        const logisticsRequest = Memory.creeps[this.name][CreepMemoryKeys.roomLogisticsRequests][0]
        if (logisticsRequest) {
            const target = findObjectWithID(logisticsRequest[CreepRoomLogisticsRequestKeys.target])
            // Don't relay if they are close to our logistics target
            if (getRange(target.pos, creepAtPos.pos) <= 1) return false

            amount = logisticsRequest[CreepRoomLogisticsRequestKeys.amount]
        }
        if (creepAtPos.store.getFreeCapacity() !== (amount ?? this.store.getUsedCapacity(RESOURCE_ENERGY))) return false

        this.transfer(creepAtPos, RESOURCE_ENERGY, amount)

        this.movedResource = true
        creepAtPos.movedResource = true
        /*
        const nextEnergy = Math.min(this.nextStore.energy, creepAtPos.freeNextStore)
        this.nextStore.energy -= nextEnergy
        creepAtPos.nextStore.energy += nextEnergy
        */
        /*
        log('thisEnergy', this.store.energy)
        log('creepAtPos Energy', creepAtPos.freeNextStore)
        log('nextEnergy', Math.min(this.store.energy, creepAtPos.freeNextStore))
        */
        const transferAmount = amount ?? Math.min(this.store.getUsedCapacity(RESOURCE_ENERGY), creepAtPos.store.getFreeCapacity())
        this.reserveStore.energy -= transferAmount
        this.nextStore.energy -= transferAmount
        creepAtPos.reserveStore.energy += transferAmount
        creepAtPos.nextStore.energy += transferAmount
        /*
        log('this needs res', this.needsResources())
        log('creepAtPos need res', creepAtPos.needsResources())
 */
        // Stop previously attempted moveRequests as they do not account for a relay

        delete this.moveRequest
        delete creepAtPos.moveRequest

        delete this.moved
        delete creepAtPos.moved

        const creepAtPosMemory = Memory.creeps[creepAtPos.name]

        // Trade paths so they might reuse them

        const path = creepMemory[CreepMemoryKeys.path]
        creepMemory[CreepMemoryKeys.path] = creepAtPosMemory[CreepMemoryKeys.path]
        creepAtPosMemory[CreepMemoryKeys.path] = path

        // record relaying information to avoid swapping

        creepMemory[CreepMemoryKeys.previousRelayer] = [creepAtPos.name, Game.time]
        creepAtPosMemory[CreepMemoryKeys.previousRelayer] = [this.name, Game.time]

        // Trade room logistics requests

        const creepAtPosRequests = Array.from(creepAtPosMemory[CreepMemoryKeys.roomLogisticsRequests])
        creepAtPosMemory[CreepMemoryKeys.roomLogisticsRequests] = Array.from(
            creepMemory[CreepMemoryKeys.roomLogisticsRequests],
        )
        creepMemory[CreepMemoryKeys.roomLogisticsRequests] = creepAtPosRequests

        // Trade remotes and sourceIndexes
        // Delete from creepAtPos because it is returning home, not responding to a remote

        const remote = creepMemory[CreepMemoryKeys.remote]
        creepMemory[CreepMemoryKeys.remote] = creepAtPosMemory[CreepMemoryKeys.remote]
        creepAtPosMemory[CreepMemoryKeys.remote] = remote

        const sourceIndex = creepMemory[CreepMemoryKeys.sourceIndex]
        creepMemory[CreepMemoryKeys.sourceIndex] = creepAtPosMemory[CreepMemoryKeys.sourceIndex]
        creepAtPosMemory[CreepMemoryKeys.sourceIndex] = sourceIndex

        const taskRoom = creepMemory[CreepMemoryKeys.taskRoom]
        creepMemory[CreepMemoryKeys.taskRoom] = creepAtPosMemory[CreepMemoryKeys.taskRoom]
        creepAtPosMemory[CreepMemoryKeys.taskRoom] = taskRoom

        //

        if (creepMemory[CreepMemoryKeys.taskRoom]) {

            this.runCommuneLogistics()
        }
        else this.getResources()

        const hauler = creepAtPos as Hauler
        if (creepAtPosMemory[CreepMemoryKeys.taskRoom]) hauler.runCommuneLogistics()
        else if (creepAtPosMemory[CreepMemoryKeys.remote]) hauler.deliverResources()

        if (Game.flags[FlagNames.debugRelay]) {

            if (this.moveRequest) this.room.targetVisual(this.pos, unpackCoord(this.moveRequest), true)
            if (creepAtPos.moveRequest) {
                creepAtPos.room.targetVisual(creepAtPos.pos, unpackCoord(creepAtPos.moveRequest), true)
            }
        }

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

            if (this.relayCoord(coord)) return Result.action
        }

        return Result.noAction
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
            /*
            // If the x and y are dissimilar

            if (coord.x !== moveCoord.x && coord.y !== moveCoord.y) continue
            */
            if (this.relayCoord(coord)) return Result.action
        }

        return Result.noAction
    }

    relay?() {

        // If there is no easy way to know what coord the creep is trying to go to next

        const creepMemory = Memory.creeps[this.name]
        if (
            !this.moveRequest &&
            (!creepMemory[CreepMemoryKeys.path] ||
                creepMemory[CreepMemoryKeys.path].length / packedPosLength < 2)
        )
            return Result.noAction
        if (this.movedResource) return Result.noAction

        const creepEnergy = this.store.getUsedCapacity(RESOURCE_ENERGY)
        // ensure we have energy
        if (creepEnergy <= 0) return Result.noAction
        // ensure energy is our only resource
        if (creepEnergy !== this.store.getUsedCapacity()) return Result.noAction

        // Don't relay too close to the source position unless we are fatigued

        if (
            creepMemory[CreepMemoryKeys.taskRoom] !== this.room.name &&
            (!this.fatigue &&
                creepMemory[CreepMemoryKeys.remote] === this.room.name &&
                getRange(
                    this.room.roomManager.remoteSourceHarvestPositions[
                        creepMemory[CreepMemoryKeys.sourceIndex]
                    ][0],
                    this.pos,
                ) <= 1)
        )
            return Result.noAction

        const moveCoord = this.moveRequest
            ? unpackCoord(this.moveRequest)
            : unpackPosAt(creepMemory[CreepMemoryKeys.path], 1)

        if (this.pos.x === moveCoord.x || this.pos.y === moveCoord.y) {
            return this.relayCardinal(moveCoord)
        }

        return this.relayDiagonal(moveCoord)
    }

    travelToCommune?() {
        if (this.room.name === this.commune.name) {
            return Result.success
        }

        const anchor = this.commune.roomManager.anchor
        if (!anchor) throw Error('no anchor for hauler')

        this.createMoveRequest({
            origin: this.pos,
            goals: [
                {
                    pos: anchor,
                    range: 3,
                },
            ],
            avoidEnemyRanges: true,
            typeWeights: {
                [RoomTypes.enemy]: Infinity,
                [RoomTypes.ally]: Infinity,
                [RoomTypes.sourceKeeper]: Infinity,
                [RoomTypes.enemyRemote]: Infinity,
                [RoomTypes.allyRemote]: Infinity,
            },
        })

        return Result.action
    }

    runRestrictedCommuneLogistics?() {
        // let it respond to its remote
        if (Memory.creeps[this.name][CreepMemoryKeys.remote]) return Result.fail
        // We aren't in the commune
        if (this.room.name !== this.commune.name) return Result.fail

        // If there is no need for more commune haulers
        if (
            this.commune.communeManager.communeHaulerNeed <
            this.commune.communeManager.communeHaulerCarryParts
        ) {
            return Result.fail
        }

        if (this.commune.communeManager.hasSufficientRoads) {
            // If we have a body not optimized for roads, try to respond to a remote instead
            if (myCreepUtils.parts(this).move / this.body.length >= 0.5) return Result.fail
        }

        // success, we are working for the commune now

        const creepMemory = Memory.creeps[this.name]
        if (!creepMemory[CreepMemoryKeys.taskRoom]) {
            creepMemory[CreepMemoryKeys.taskRoom] = this.room.name
            this.commune.communeManager.communeHaulerCarryParts += myCreepUtils.parts(this).carry
        }

        return this.runCommuneLogistics()
    }

    runCommuneLogistics?() {
        this.passiveRenew()

        if (this.runRoomLogisticsRequestsAdvanced() !== Result.success) {
            this.relay()
            return Result.action
        }

        return Result.success
    }

    run?() {
        if (this.runRestrictedCommuneLogistics() !== Result.fail) {
            return
        }

        if (!this.findRemote()) {
            if (this.travelToCommune() !== Result.success) return
            this.runCommuneLogistics()
            return
        }

        const creepMemory = Memory.creeps[this.name]

        if (
            creepMemory[CreepMemoryKeys.sleepFor] === SleepFor.any &&
            creepMemory[CreepMemoryKeys.sleepTime] > Game.time
        ) {
            this.message = '😴'
            return
        }

        if (this.needsResources() /*  && this.ticksToLive > returnTripTime */) {
            this.getResources()
            return
        }

        // Otherwise if the creep doesn't need resources

        if (this.deliverResources()) {

            this.relay()
        }
    }

    static roleManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: Hauler = Game.creeps[creepName]
            creep.run()
        }
    }
}
