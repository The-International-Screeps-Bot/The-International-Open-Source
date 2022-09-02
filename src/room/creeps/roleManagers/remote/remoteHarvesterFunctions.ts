import { minHarvestWorkRatio, RemoteNeeds } from 'international/constants'
import { customLog, findCarryPartsRequired, findObjectWithID, getRange, unpackAsPos, unpackAsRoomPos } from 'international/generalFunctions'

export class RemoteHarvester extends Creep {

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    public get dying(): boolean {
        // Inform as dying if creep is already recorded as dying

        if (this._dying) return true

        // Stop if creep is spawning

        if (!this.ticksToLive) return false

        if (this.memory.remote) {
            if (
                this.ticksToLive >
                this.body.length * CREEP_SPAWN_TIME + Memory.rooms[this.memory.remote].SE[this.memory.SI] - 1
            )
                return false
        } else if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

        // Record creep as dying

        return (this._dying = true)
    }

    preTickManager(): void {
        if (!this.memory.remote) return

        const role = this.role as 'source1RemoteHarvester' | 'source2RemoteHarvester'

        // If the creep's remote no longer is managed by its commune

        if (!Memory.rooms[this.commune.name].remotes.includes(this.memory.remote)) {
            // Delete it from memory and try to find a new one

            delete this.memory.remote
            if (!this.findRemote()) return
        }

        const commune = this.commune
        const remoteMemory = Memory.rooms[this.memory.remote]

        // Reduce remote need

        if (!this.dying) {
            Memory.rooms[this.memory.remote].needs[RemoteNeeds[role]] -= this.parts.work

            const possibleReservation = commune.energyCapacityAvailable >= 650

            let sourceIndex = 0
            if (role === 'source2RemoteHarvester') sourceIndex = 1

            const income =
                (possibleReservation ? 10 : 5) - Math.floor(remoteMemory.needs[RemoteNeeds[role]] * minHarvestWorkRatio)

            // Find the number of carry parts required for the source, and add it to the remoteHauler need

            remoteMemory.needs[RemoteNeeds[`remoteHauler${this.memory.SI}`]] +=
                findCarryPartsRequired(remoteMemory.SE[sourceIndex], income) / 2
        }

        // Add the creep to creepsFromRoomWithRemote relative to its remote

        if (commune.creepsFromRoomWithRemote[this.memory.remote])
            commune.creepsFromRoomWithRemote[this.memory.remote][role].push(this.name)
    }

    /**
     * Finds a remote to harvest in
     */
    findRemote?(): boolean {
        if (this.memory.remote) return true

        const role = this.role as 'source1RemoteHarvester' | 'source2RemoteHarvester'

        for (const sourceID of this.commune?.remoteSourceIDsByEfficacy) {
            const source = findObjectWithID(sourceID)
            const remoteMemory = Memory.rooms[source.pos.roomName]

            // If the sourceIndexes aren't aligned

            if (remoteMemory.SIDs.indexOf(sourceID) !== this.memory.SI) continue

            // If there is no need

            if (remoteMemory.needs[RemoteNeeds[role]] <= 0) continue

            this.assignRemote(source.pos.roomName)
            return true
        }

        return false
    }

    assignRemote?(remoteName: string) {
        this.memory.remote = remoteName

        if (this.dying) return

        const role = this.role as 'source1RemoteHarvester' | 'source2RemoteHarvester'

        const needs = Memory.rooms[remoteName].needs

        needs[RemoteNeeds[role]] -= this.parts.work

        const commune = this.commune
        const possibleReservation = commune.energyCapacityAvailable >= 650

        const income = (possibleReservation ? 10 : 5) - Math.floor(needs[RemoteNeeds[role]] * minHarvestWorkRatio)

        // Find the number of carry parts required for the source, and add it to the remoteHauler need

        needs[RemoteNeeds[`remoteHauler${this.memory.SI}`]] +=
            findCarryPartsRequired(Memory.rooms[remoteName].SE[this.memory.SI], income) / 2
    }

    removeRemote?() {
        delete this.memory.remote

        if (this.dying) return

        const role = this.role as 'source1RemoteHarvester' | 'source2RemoteHarvester'

        const needs = Memory.rooms[this.memory.remote].needs

        needs[RemoteNeeds[role]] += this.parts.work

        const commune = this.commune
        const possibleReservation = commune.energyCapacityAvailable >= 650

        const income = (possibleReservation ? 10 : 5) - Math.floor(needs[RemoteNeeds[role]] * minHarvestWorkRatio)

        // Find the number of carry parts required for the source, and add it to the remoteHauler need

        needs[RemoteNeeds[`remoteHauler${this.memory.SI}`]] -=
            findCarryPartsRequired(Memory.rooms[this.memory.remote].SE[this.memory.SI], income) / 2
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
            goal: {
                pos: harvestPos,
                range: 0,
            },
            avoidEnemyRanges: true,
        })

        return true
    }

    static RemoteHarvesterManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RemoteHarvester = Game.creeps[creepName]

            // Try to find a remote. If one couldn't be found, iterate

            if (!creep.findRemote()) continue

            // If the creep needs resources

            if (room.name === creep.memory.remote) {
                creep.remoteActions()
                continue
            }

            creep.say(creep.memory.remote)

            const source = findObjectWithID(Memory.rooms[creep.memory.remote].SIDs[creep.memory.SI])

            creep.createMoveRequest({
                origin: creep.pos,
                goal: {
                    pos: source.pos,
                    range: 1,
                },
                avoidEnemyRanges: true,
            })
        }
    }
}
