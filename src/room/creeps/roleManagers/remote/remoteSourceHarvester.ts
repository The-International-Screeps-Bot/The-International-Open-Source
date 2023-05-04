import {
    CreepMemoryKeys,
    packedPosLength,
    RESULT_ACTION,
    RESULT_FAIL,
    RESULT_NO_ACTION,
    RESULT_SUCCESS,
    RoomMemoryKeys,
    RoomTypes,
} from 'international/constants'
import {
    customLog,
    findCarryPartsRequired,
    findObjectWithID,
    getRangeXY,
    getRange,
    randomTick,
    scalePriority,
    areCoordsEqual,
} from 'international/utils'
import { packCoord, reversePosList, unpackPosAt } from 'other/codec'
import { RemoteHauler } from './remoteHauler'
import { indexOf } from 'lodash'

export class RemoteHarvester extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    public isDying(): boolean {
        // Stop if creep is spawning

        if (this.spawning) return false

        if (this.memory[CreepMemoryKeys.remote]) {
            if (
                this.ticksToLive >
                this.body.length * CREEP_SPAWN_TIME +
                    Memory.rooms[this.memory[CreepMemoryKeys.remote]][RoomMemoryKeys.remoteSourcePaths][
                        this.memory[CreepMemoryKeys.sourceIndex]
                    ].length /
                        packedPosLength
            )
                return false
        } else if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

        // Record creep as isDying

        return true
    }

    preTickManager(): void {
        if (randomTick() && !this.getActiveBodyparts(MOVE)) this.suicide()

        if (!this.findRemote()) return

        const creepMemory = Memory.creeps[this.name]
        const remoteName = creepMemory[CreepMemoryKeys.remote]
        const sourceIndex = creepMemory[CreepMemoryKeys.sourceIndex]

        if (remoteName === this.room.name) {
            if (!this.isDying()) this.room.creepsOfSource[sourceIndex].push(this.name)

            this.remoteActions()
        }

        if (this.isDying()) return

        // Record response

        this.commune.communeManager.remoteSourceHarvesters[remoteName][sourceIndex].push(this.name)
        Memory.rooms[remoteName][RoomMemoryKeys.remoteSourceHarvesters][sourceIndex] += this.parts.work
    }

    hasValidRemote?() {
        if (!this.memory[CreepMemoryKeys.remote]) return false

        const remoteMemory = Memory.rooms[this.memory[CreepMemoryKeys.remote]]

        if (remoteMemory[RoomMemoryKeys.type] !== RoomTypes.remote) return false
        if (remoteMemory[RoomMemoryKeys.commune] !== this.commune.name) return false
        if (remoteMemory[RoomMemoryKeys.abandon]) return false

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
            const sourceIndex = parseInt(splitRemoteInfo[1])
            const remoteMemory = Memory.rooms[remoteName]

            if (
                remoteMemory[RoomMemoryKeys.remoteSourceHarvestPositions].length / packedPosLength >=
                this.commune.communeManager.remoteSourceHarvesters[remoteName][sourceIndex].length
            )
                continue
            if (remoteMemory[RoomMemoryKeys.remoteSourceHarvesters][sourceIndex] <= 0) continue

            this.assignRemote(remoteName, sourceIndex)
            return true
        }

        return false
    }

    assignRemote?(remoteName: string, sourceIndex: number) {
        const creepMemory = Memory.creeps[this.name]
        creepMemory[CreepMemoryKeys.remote] = remoteName
        creepMemory[CreepMemoryKeys.sourceIndex] = sourceIndex

        delete creepMemory[CreepMemoryKeys.packedCoord]

        if (this.isDying()) return

        this.commune.communeManager.remoteSourceHarvesters[remoteName][sourceIndex].push(this.name)
        Memory.rooms[remoteName][RoomMemoryKeys.remoteSourceHarvesters][this.memory[CreepMemoryKeys.sourceIndex]] +=
            this.parts.work
    }

    removeRemote?() {
        const creepMemory = Memory.creeps[this.name]

        if (!this.isDying()) {
            const remoteName = creepMemory[CreepMemoryKeys.remote]

            Memory.rooms[remoteName][RoomMemoryKeys.remoteSourceHarvesters][this.memory[CreepMemoryKeys.sourceIndex]] -=
                this.parts.work
        }

        delete creepMemory[CreepMemoryKeys.remote]
        delete creepMemory[CreepMemoryKeys.packedCoord]
    }

    remoteActions?() {
        // Try to move to source

        const sourceIndex = Memory.creeps[this.name][CreepMemoryKeys.sourceIndex]
        if (this.travelToSource(sourceIndex) !== RESULT_SUCCESS) return

        // Make sure we're a bit ahead source regen time
/*
        const sourcee = this.room.roomManager.remoteSources[this.memory[CreepMemoryKeys.sourceIndex]]

        this.room.visual.text((sourcee.energy * ENERGY_REGEN_TIME).toString() + ', ' + (sourcee.ticksToRegeneration * 0.9 * sourcee.energyCapacity).toString(), this.pos)
 */

        const container = this.room.sourceContainers[sourceIndex]
        if (container) {
            // Repair or build the container if we're ahead on source regen

            if (this.maintainContainer(container) === RESULT_ACTION) return

            const source = this.room.roomManager.remoteSources[sourceIndex]
            this.advancedHarvestSource(source)

            // Give our energy to the container so it doesn't drop on the ground

            if (!container.pos.isEqualTo(this.pos) && this.store.getFreeCapacity() <= this.parts.work) {
                this.transfer(container, RESOURCE_ENERGY)
            }

            return
        }

        // There is no container

        if (this.buildContainer() === RESULT_ACTION) return

        const source = this.room.roomManager.remoteSources[sourceIndex]
        this.advancedHarvestSource(source)

        // Stop, we don't have enough energy to justify a request

        if (this.reserveStore.energy < this.store.getCapacity() * 0.5) return

        // Try to have haulers get energy directly from us (avoids decay)

        this.room.createRoomLogisticsRequest({
            target: this,
            type: 'withdraw',
            priority: scalePriority(this.store.getCapacity(), this.reserveStore.energy, 5, true),
        })
    }

    private obtainEnergyIfNeeded() {
        if (this.nextStore.energy >= this.parts.work) return RESULT_SUCCESS
        if (this.movedResource) return RESULT_FAIL

        return this.runRoomLogisticsRequestAdvanced({
            resourceTypes: new Set([RESOURCE_ENERGY]),
            types: new Set(['withdraw', 'pickup', 'offer']),
            conditions: request => {
                getRange(findObjectWithID(request.targetID).pos, this.pos) <= 1
            },
        })
    }

    maintainContainer(container: StructureContainer): number {
        // Make sure we're a bit ahead source regen time

        const source = this.room.roomManager.remoteSources[this.memory[CreepMemoryKeys.sourceIndex]]
        if (source.energy * ENERGY_REGEN_TIME > source.ticksToRegeneration * source.energyCapacity * 0.9)
            return RESULT_NO_ACTION

        // Ensure we have enough energy to use all work parts

        if (this.store.energy < this.parts.work) return RESULT_NO_ACTION

        // Make sure the contianer is sufficiently needy of repair

        if (container.hits > container.hitsMax * 0.8) return RESULT_NO_ACTION
        if (this.obtainEnergyIfNeeded() !== RESULT_SUCCESS) return RESULT_NO_ACTION

        this.repair(container)
        this.worked = true

        return RESULT_ACTION
    }

    buildContainer(): number {
        // Don't build new remote containers until we can reserve the room

        if (this.commune.energyCapacityAvailable < 650) return RESULT_NO_ACTION

        // Make sure we're a bit ahead source regen time

        const source = this.room.roomManager.remoteSources[this.memory[CreepMemoryKeys.sourceIndex]]
        if (source.energy * ENERGY_REGEN_TIME > source.ticksToRegeneration * source.energyCapacity * 0.9)
            return RESULT_NO_ACTION

        // Find an existing container construction site

        const cSite = this.room.findCSiteAtCoord(this.pos, cSite => cSite.structureType === STRUCTURE_CONTAINER)

        if (cSite) {
            // Pick energy off the ground if possible

            if (this.obtainEnergyIfNeeded() !== RESULT_SUCCESS) return RESULT_NO_ACTION

            // Don't allow the construction site manager to remove the site for while we're building

            Memory.constructionSites[cSite.id] = 0

            this.build(cSite)
            this.worked = true

            return RESULT_ACTION
        }

        // There is no container cSite, place one

        const sourcePos =
            this.room.roomManager.remoteSourceHarvestPositions[this.memory[CreepMemoryKeys.sourceIndex]][0]
        this.room.createConstructionSite(sourcePos, STRUCTURE_CONTAINER)

        return RESULT_NO_ACTION
    }

    /**
     *
     */
    travelToSource?(sourceIndex: number): number {
        this.message = '🚬'

        // Unpack the harvestPos

        const harvestPos = this.findRemoteSourceHarvestPos(this.memory[CreepMemoryKeys.sourceIndex])
        if (!harvestPos) return RESULT_NO_ACTION

        this.actionCoord = this.room.roomManager.remoteSources[this.memory[CreepMemoryKeys.sourceIndex]].pos

        // If the creep is at the creep's packedHarvestPos, inform false

        if (getRange(this.pos, harvestPos) === 0) return RESULT_SUCCESS

        // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

        this.message = `⏩ ` + sourceIndex

        this.createMoveRequestByPath(
            {
                origin: this.pos,
                goals: [
                    {
                        pos: harvestPos,
                        range: 0,
                    },
                ],
            },
            {
                packedPath: reversePosList(
                    Memory.rooms[this.memory[CreepMemoryKeys.remote]][RoomMemoryKeys.remoteSourcePaths][
                        this.memory[CreepMemoryKeys.sourceIndex]
                    ],
                ),
                remoteName: this.memory[CreepMemoryKeys.remote],
            },
        )

        return RESULT_ACTION
    }

    static roleManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RemoteHarvester = Game.creeps[creepName] as RemoteHarvester

            // Try to find a remote

            if (!creep.findRemote()) {
                creep.message = '❌ Remote'
                /*
                // If the room is the creep's commune

                if (room.name === creep.commune.name) {
                    // Advanced recycle and iterate

                    creep.advancedRecycle()
                    continue
                }

                // Otherwise, have the creep make a moveRequest to its commune and iterate

                creep.createMoveRequest({
                    origin: creep.pos,
                    goals: [
                        {
                            pos: creep.commune.anchor,
                            range: 5,
                        },
                    ],
                })
 */
                continue
            }

            // If the creep needs resources

            if (room.name === creep.memory[CreepMemoryKeys.remote]) {
                /* creep.remoteActions() */
                continue
            }

            creep.message = creep.memory[CreepMemoryKeys.remote]

            const sourcePos = unpackPosAt(
                Memory.rooms[creep.memory[CreepMemoryKeys.remote]][RoomMemoryKeys.remoteSourceHarvestPositions][
                    creep.memory[CreepMemoryKeys.sourceIndex]
                ],
            )

            creep.createMoveRequestByPath(
                {
                    origin: creep.pos,
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
                    packedPath: reversePosList(
                        Memory.rooms[creep.memory[CreepMemoryKeys.remote]][RoomMemoryKeys.remoteSourcePaths][
                            creep.memory[CreepMemoryKeys.sourceIndex]
                        ],
                    ),
                    remoteName: creep.memory[CreepMemoryKeys.remote],
                },
            )
        }
    }
}
