import { CreepMemoryKeys, packedPosLength, RemoteData, RESULT_FAIL, RESULT_SUCCESS } from 'international/constants'
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
import { packCoord, reversePosList, unpackPos, unpackPosList } from 'other/codec'
import { RemoteHauler } from './remoteHauler'

export class RemoteHarvester extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    public isDying(): boolean {
        // Stop if creep is spawning

        if (this.spawning) return false

        if (this.memory.RN) {
            if (
                this.ticksToLive >
                this.body.length * CREEP_SPAWN_TIME +
                    Memory.rooms[this.memory.RN].RSPs[this.memory[CreepMemoryKeys.sourceIndex]].length / packedPosLength
            )
                return false
        } else if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

        // Record creep as isDying

        return true
    }

    preTickManager(): void {
        if (randomTick() && !this.getActiveBodyparts(MOVE)) this.suicide()

        if (!this.findRemote()) return

        // Add the creep to creepsOfRemote relative to its remote

        if (this.memory.RN === this.room.name) {
            if (!this.isDying()) this.room.creepsOfSource[this.memory[CreepMemoryKeys.sourceIndex]].push(this.name)

            const source = this.room.roomManager.remoteSources[this.memory[CreepMemoryKeys.sourceIndex]]

            if (getRange(this.pos, source.pos) <= 1) {
                this.advancedHarvestSource(source)
            }
        }

        if (this.isDying()) return

        // Record response

        Memory.rooms[this.memory.RN].data[
            RemoteData[`remoteSourceHarvester${this.memory[CreepMemoryKeys.sourceIndex] as 0 | 1}`]
        ] += this.parts.work
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
            const remoteMemory = Memory.rooms[remoteName]

            // If there is no need

            if (
                remoteMemory.data[
                    RemoteData[`remoteSourceHarvester${this.memory[CreepMemoryKeys.sourceIndex] as 0 | 1}`]
                ] <= 0
            )
                continue

            this.assignRemote(remoteName)
            return true
        }

        return false
    }

    assignRemote?(remoteName: string) {
        this.memory.RN = remoteName

        if (this.isDying()) return

        Memory.rooms[remoteName].data[
            RemoteData[`remoteSourceHarvester${this.memory[CreepMemoryKeys.sourceIndex] as 0 | 1}`]
        ] += this.parts.work
    }

    removeRemote?() {
        if (!this.isDying()) {
            Memory.rooms[this.memory.RN].data[
                RemoteData[`remoteSourceHarvester${this.memory[CreepMemoryKeys.sourceIndex] as 0 | 1}`]
            ] -= this.parts.work
        }

        delete this.memory.RN
        delete this.memory.PC
    }

    remoteActions?() {
        // Try to move to source. If creep moved then iterate
        if (this.travelToSource(this.memory[CreepMemoryKeys.sourceIndex])) return

        const container = this.room.sourceContainers[this.memory[CreepMemoryKeys.sourceIndex]]
        const source = this.room.find(FIND_SOURCES)[this.memory[CreepMemoryKeys.sourceIndex]]
        let figuredOutWhatToDoWithTheEnergy = false
        if (container) this.room.targetVisual(this.pos, container.pos, true)
        //1) feed remote hauler
        //2) build if "ahead of the curve"
        //3) drop mine
        //4) means you're idle, try building the container.

        //If we're going to be overfilled after the next harvest, figure out what to do with the extra energy.
        if (this.store.getFreeCapacity() <= this.parts.work || source.energy === 0) {
            //See if there's a hauler to tranfer to if we're full so we're not drop mining.
            //   This shouldn't run if we're container mining however.

            if (!container) {
                // If the creep isn't full enough to justify a request

                if (this.nextStore.energy > this.store.getCapacity() * 0.5) {
                    this.room.createRoomLogisticsRequest({
                        target: this,
                        type: 'withdraw',
                        priority: scalePriority(this.store.getCapacity(), this.reserveStore.energy, 5, true),
                    })
                }
            }

            //if we're ahead of the curve...  As in we're beating the regen time of the source.
            //  Aka  source.energy / source.energyCapacity <  source.ticksToRegeneration / 300
            //  It's rearranged for performance.  This will also repair the container if needed.
            if (
                !figuredOutWhatToDoWithTheEnergy &&
                source.energy * ENERGY_REGEN_TIME < source.ticksToRegeneration * 0.9 * source.energyCapacity
            ) {
                let didWork = this.maintainContainer()
                //If we did container maintance, that'll eat our work action.
                if (didWork) return
            }

            //If we get here and we still haven't figured out what to do about the energy, see
            //  If we should drop mine, or transfer.
            if (!figuredOutWhatToDoWithTheEnergy && container && !container.pos.isEqualTo(this.pos)) {
                this.transfer(container, RESOURCE_ENERGY)
            }
        }
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

    maintainContainer(): boolean {
        const container = this.room.sourceContainers[this.memory[CreepMemoryKeys.sourceIndex]]

        if (container) {
            // If the container is below 80% health, repair it.
            if (container.hits < container.hitsMax * 0.8) {
                if (this.obtainEnergyIfNeeded() !== RESULT_SUCCESS) return false
                this.repair(container)
                return true
            }
            return false
        }

        // Don't build new remote containers until we can reserve the room

        if (this.commune.energyCapacityAvailable < 650) return false

        // Check if there is a construction site

        let cSite

        const cSitesAtCoord = this.room.cSiteCoords.get(packCoord(this.pos))
        if (cSitesAtCoord) cSite = findObjectWithID(cSitesAtCoord[0])

        if (cSite) {
            // Pick energy off the ground if possible

            if (this.obtainEnergyIfNeeded() !== RESULT_SUCCESS) return false

            this.build(cSite)

            // Don't allow the construction site manager to remove the site for while we're building

            Memory.constructionSites[cSite.id] = 0
            return true
        }

        // There is no container cSite, place one

        const sourcePos =
            this.room.roomManager.remoteSourceHarvestPositions[this.memory[CreepMemoryKeys.sourceIndex]][0]
        this.room.createConstructionSite(sourcePos, STRUCTURE_CONTAINER)
        return false
    }

    /**
     *
     */
    travelToSource?(sourceIndex: number): boolean {
        this.message = '🚬'

        // Unpack the harvestPos

        const harvestPos = this.findRemoteSourceHarvestPos(this.memory[CreepMemoryKeys.sourceIndex])
        if (!harvestPos) return true

        this.actionCoord = this.room.roomManager.remoteSources[this.memory[CreepMemoryKeys.sourceIndex]].pos

        // If the creep is at the creep's packedHarvestPos, inform false

        if (getRange(this.pos, harvestPos) === 0) return false

        // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

        this.message = `⏩ ${sourceIndex}`
        /*
        const targetsClosestHarvestPos = areCoordsEqual(harvestPos, unpackPosList(Memory.rooms[this.memory.RN].RSPs[this.memory[CreepMemoryKeys.sourceIndex]])[0])
 */
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
                packedPath: reversePosList(Memory.rooms[this.memory.RN].RSPs[this.memory[CreepMemoryKeys.sourceIndex]]),
                remoteName: this.memory.RN,
                /* loose: !!targetsClosestHarvestPos */
            },
        )

        return true
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

            if (room.name === creep.memory.RN) {
                creep.remoteActions()
                continue
            }

            creep.message = creep.memory.RN

            const sourcePos = unpackPosList(
                Memory.rooms[creep.memory.RN].RSHP[creep.memory[CreepMemoryKeys.sourceIndex]],
            )[0]
            console.log('reverse of null roomName', creep.memory.RN)
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
                        Memory.rooms[creep.memory.RN].RSPs[creep.memory[CreepMemoryKeys.sourceIndex]],
                    ),
                    remoteName: creep.memory.RN,
                },
            )
        }
    }
}
