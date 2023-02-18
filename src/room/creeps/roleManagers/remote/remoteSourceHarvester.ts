import { minHarvestWorkRatio, RemoteData } from 'international/constants'
import {
    customLog,
    findCarryPartsRequired,
    findObjectWithID,
    getRange,
    getRangeOfCoords,
    randomTick,
    scalePriority,
} from 'international/utils'
import { packCoord, reversePosList, unpackPos, unpackPosList } from 'other/codec'
import { RemoteHauler } from './remoteHauler'

export class RemoteHarvester extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    public get dying(): boolean {
        // Inform as dying if creep is already recorded as dying

        if (this._dying !== undefined) return this._dying

        // Stop if creep is spawning

        if (this.spawning) return false

        if (this.memory.RN) {
            if (
                this.ticksToLive >
                this.body.length * CREEP_SPAWN_TIME + Memory.rooms[this.memory.RN].SPs[this.memory.SI].length
            )
                return false
        } else if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

        // Record creep as dying

        return (this._dying = true)
    }

    preTickManager(): void {
        if (randomTick() && !this.getActiveBodyparts(MOVE)) this.suicide()

        if (!this.findRemote()) return

        const commune = this.commune

        // Add the creep to creepsOfRemote relative to its remote

        if (commune.creepsOfRemote[this.memory.RN]) commune.creepsOfRemote[this.memory.RN][this.role].push(this.name)

        if (this.memory.RN === this.room.name) {
            // Unpack the harvestPos

            const harvestPos = this.findSourcePos(this.memory.SI)
            if (!harvestPos) return

            if (getRangeOfCoords(this.pos, harvestPos) === 0) {
                this.advancedHarvestSource(this.room.sources[this.memory.SI])
            }
        }

        if (this.dying) return

        // Reduce remote need

        Memory.rooms[this.memory.RN].data[RemoteData[`remoteSourceHarvester${this.memory.SI as 0 | 1}`]] -=
            this.parts.work
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

            if (remoteMemory.data[RemoteData[`remoteSourceHarvester${this.memory.SI as 0 | 1}`]] <= 0) continue

            this.assignRemote(remoteName)
            return true
        }

        return false
    }

    assignRemote?(remoteName: string) {
        this.memory.RN = remoteName

        if (this.dying) return

        const needs = Memory.rooms[remoteName].data

        needs[RemoteData[`remoteSourceHarvester${this.memory.SI as 0 | 1}`]] -= this.parts.work
    }

    removeRemote?() {
        if (!this.dying) {
            const needs = Memory.rooms[this.memory.RN].data

            needs[RemoteData[`remoteSourceHarvester${this.memory.SI as 0 | 1}`]] += this.parts.work
        }

        delete this.memory.RN
        delete this.memory.PC
    }

    remoteActions?() {
        // Try to move to source. If creep moved then iterate
        if (this.travelToSource(this.memory.SI)) return

        const container = this.room.sourceContainers[this.memory.SI]
        const source = this.room.sources[this.memory.SI]
        let figuredOutWhatToDoWithTheEnergy = false
        if (container) this.room.targetVisual(this.pos, container.pos, true)
        //1) feed remote hauler
        //2) build if "ahead of the curve"
        //3) drop mine
        //4) means you're idle, try building the container.

        //If we're going to be overfilled after the next harvest, figure out what to do with the extra energy.
        if (this.store.getFreeCapacity() <= this.parts.work || source.energy == 0) {
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
                source.energy * 300 < (source.ticksToRegeneration - 1) * source.energyCapacity
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
        let neededEnergy = this.parts.work * BUILD_POWER
        //We need to check to see if there's enough for the current tick, plus the next tick, otherwise
        //  We need to pick up on this tick, which is why the *2 is there.

        if (this.store[RESOURCE_ENERGY] < neededEnergy * 2) {
            let droppedResource = this.pos
                .findInRange(FIND_DROPPED_RESOURCES, 1)
                .find(drop => drop.resourceType == RESOURCE_ENERGY)
            if (droppedResource) this.pickup(droppedResource)
        }
    }

    maintainContainer(): boolean {
        const container = this.room.sourceContainers[this.memory.SI]

        if (container) {
            // If the container is below 80% health, repair it.
            if (container.hits < container.hitsMax * 0.8) {
                this.obtainEnergyIfNeeded()
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

            this.obtainEnergyIfNeeded()

            this.build(cSite)

            // Don't allow the construction site manager to remove the site for while we're building

            delete Memory.constructionSites[cSite.id]
            return true
        }

        // There is no container cSite, place one

        const sourcePos = this.room.sourcePositions[this.memory.SI][0]
        this.room.createConstructionSite(sourcePos, STRUCTURE_CONTAINER)
        return false
    }

    /**
     *
     */
    travelToSource?(sourceIndex: number): boolean {
        this.message = '🚬'

        // Unpack the harvestPos

        const harvestPos = this.findSourcePos(this.memory.SI)
        if (!harvestPos) return true

        // If the creep is at the creep's packedHarvestPos, inform false

        if (getRangeOfCoords(this.pos, harvestPos) === 0) return false

        // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

        this.message = `⏩ ${sourceIndex}`

        this.createMoveRequestByPath(
            {
                origin: this.pos,
                goals: [
                    {
                        pos: harvestPos,
                        range: 0,
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

        return true
    }

    static RemoteHarvesterManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RemoteHarvester = Game.creeps[creepName] as RemoteHarvester

            // Try to find a remote

            if (!creep.findRemote()) {
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

                continue
            }

            // If the creep needs resources

            if (room.name === creep.memory.RN) {
                creep.remoteActions()
                continue
            }

            creep.message = creep.memory.RN

            const sourcePos = unpackPosList(Memory.rooms[creep.memory.RN].SP[creep.memory.SI])[0]

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
                    packedPath: reversePosList(Memory.rooms[creep.memory.RN].SPs[creep.memory.SI]),
                    remoteName: creep.memory.RN,
                },
            )
        }
    }
}
