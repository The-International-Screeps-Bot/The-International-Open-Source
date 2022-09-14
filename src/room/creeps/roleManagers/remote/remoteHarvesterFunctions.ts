import { minHarvestWorkRatio, RemoteNeeds } from 'international/constants'
import {
    customLog,
    findCarryPartsRequired,
    findObjectWithID,
    getRange,
    unpackAsPos,
    unpackAsRoomPos,
} from 'international/generalFunctions'
import { unpackPosList } from 'other/packrat'
import { RemoteHauler } from './remoteHauler'

export class RemoteHarvester extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    public get dying(): boolean {
        // Inform as dying if creep is already recorded as dying

        if (this._dying) return true

        // Stop if creep is spawning

        if (!this.ticksToLive) return false

        if (this.memory.RN) {
            if (
                this.ticksToLive >
                this.body.length * CREEP_SPAWN_TIME +
                    Memory.rooms[this.memory.RN].SE[this.memory.SI] -
                    1 +
                    //I'm adding 20 to the theoritical value.  I'm frequently seeing the replacement harvesters
                    // not re-spawn in time because other creeps are spawning, and we end up losing out on a lot of
                    // energy because we miss a chance to farm.  -PR
                    20
            )
                return false
        } else if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

        // Record creep as dying

        return (this._dying = true)
    }

    preTickManager(): void {
        if (!this.findRemote()) return

        const role = this.role as 'source1RemoteHarvester' | 'source2RemoteHarvester'

        // If the creep's remote no longer is managed by its commune

        if (!Memory.rooms[this.commune.name].remotes.includes(this.memory.RN)) {
            // Delete it from memory and try to find a new one

            this.removeRemote()
            if (!this.findRemote()) return
        }

        if (this.dying) return

        // Reduce remote need

        Memory.rooms[this.memory.RN].needs[RemoteNeeds[role]] -= this.parts.work

        const commune = this.commune

        // Add the creep to creepsFromRoomWithRemote relative to its remote

        if (commune && commune.creepsFromRoomWithRemote[this.memory.RN])
            commune.creepsFromRoomWithRemote[this.memory.RN][role].push(this.name)
    }

    /**
     * Finds a remote to harvest in
     */
    findRemote?(): boolean {
        if (this.memory.RN) return true

        const role = this.role as 'source1RemoteHarvester' | 'source2RemoteHarvester'

        for (const remoteInfo of this.commune?.remoteSourceIndexesByEfficacy) {
            const splitRemoteInfo = remoteInfo.split(' ')
            const remoteName = splitRemoteInfo[0]
            const sourceIndex = parseInt(splitRemoteInfo[1])
            const remoteMemory = Memory.rooms[remoteName]

            // If the sourceIndexes aren't aligned

            if (sourceIndex !== this.memory.SI) continue

            // If there is no need

            if (remoteMemory.needs[RemoteNeeds[role]] <= 0) continue

            this.assignRemote(remoteName)
            return true
        }

        return false
    }

    assignRemote?(remoteName: string) {
        this.memory.RN = remoteName

        if (this.dying) return

        const role = this.role as 'source1RemoteHarvester' | 'source2RemoteHarvester'

        const needs = Memory.rooms[remoteName].needs

        needs[RemoteNeeds[role]] -= this.parts.work
    }

    removeRemote?() {
        if (!this.dying) {
            const role = this.role as 'source1RemoteHarvester' | 'source2RemoteHarvester'

            const needs = Memory.rooms[this.memory.RN].needs

            needs[RemoteNeeds[role]] += this.parts.work
        }

        delete this.memory.RN
    }

    remoteActions?() {
        // Try to move to source. If creep moved then iterate

        if (this.travelToSource(this.memory.SI)) return

        // Try to normally harvest. Iterate if creep harvested

        if (this.advancedHarvestSource(this.room.sources[this.memory.SI])) return
    }

    /**
     *
     */
    travelToSource?(sourceIndex: number): boolean {
        const { room } = this

        // Try to find a harvestPosition, inform false if it failed

        if (!this.findSourcePos(sourceIndex)) return false

        this.say('🚬')

        // Unpack the harvestPos

        const harvestPos = unpackAsRoomPos(this.memory.packedPos, room.name)

        // If the creep is at the creep's packedHarvestPos, inform false

        if (getRange(this.pos.x, harvestPos.x, this.pos.y, harvestPos.y) === 0) return false

        // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

        this.say(`⏩ ${sourceIndex}`)

        this.createMoveRequest({
            origin: this.pos,
            goals: [
                {
                    pos: harvestPos,
                    range: 0,
                },
            ],
            avoidEnemyRanges: true,
        })

        return true
    }

    static RemoteHarvesterManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RemoteHarvester = Game.creeps[creepName] as RemoteHarvester

            // Try to find a remote. If one couldn't be found, iterate

            if (!creep.findRemote()) continue

            // If the creep needs resources

            if (room.name === creep.memory.RN) {
                creep.remoteActions()
                continue
            }

            creep.say(creep.memory.RN)

            const sourcePos = unpackPosList(Memory.rooms[creep.memory.RN].SP[creep.memory.SI])[0]

            creep.createMoveRequest({
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
            })
        }
    }
}
