import { minHarvestWorkRatio, RemoteNeeds } from 'international/constants'
import { findCarryPartsRequired, getRange, unpackAsPos } from 'international/generalFunctions'

export class RemoteHarvester extends Creep {
    /**
     * Finds a remote to harvest in
     */
    findRemote?(): boolean {
        const creep = this
        // If the creep already has a remote, inform true

        if (creep.memory.remote) return true

        // Otherwise, get the creep's role

        const role = creep.role as 'source1RemoteHarvester' | 'source2RemoteHarvester'
        // Get remotes by their efficacy

        const remoteNamesByEfficacy: string[] = Game.rooms[creep.commune]?.get('remoteNamesByEfficacy')

        // Loop through each remote name

        for (const roomName of remoteNamesByEfficacy) {
            // Get the remote's memory using its name

            const roomMemory = Memory.rooms[roomName]

            // If the needs of this remote are met, iterate

            if (roomMemory.needs[RemoteNeeds[role]] <= 0) continue

            // Otherwise assign the remote to the creep and inform true

        creep.memory.remote = roomName

        if (!creep.isDying()) {
            Memory.rooms[this.memory.remote].needs[RemoteNeeds[role]] -= this.parts.work

            const commune = Game.rooms[this.commune]
            const possibleReservation = commune.energyCapacityAvailable >= 650

            let sourceIndex = 0
            if (role === 'source2RemoteHarvester') sourceIndex = 1

            const income =
                (possibleReservation ? 10 : 5) - Math.floor(roomMemory.needs[RemoteNeeds[role]] * minHarvestWorkRatio)

            // Find the number of carry parts required for the source, and add it to the remoteHauler need

            roomMemory.needs[RemoteNeeds.remoteHauler] += findCarryPartsRequired(roomMemory.SE[sourceIndex], income) / 2
        }

            return true
        }

        // Inform false

        return false
    }

    /**
     *
     */
    travelToSource?(sourceIndex: number): boolean {
        const creep = this
        const { room } = creep

        // Try to find a harvestPosition, inform false if it failed

        if (!creep.findSourcePos(sourceIndex)) return false

        creep.say('🚬')

        // Unpack the harvestPos

        const harvestPos = unpackAsPos(creep.memory.packedPos)

        // If the creep is at the creep's packedHarvestPos, inform false

        if (getRange(creep.pos.x, harvestPos.x, creep.pos.y, harvestPos.y) === 0) return false

        // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

        creep.say(`⏩ ${sourceIndex}`)

        creep.createMoveRequest({
            origin: creep.pos,
            goal: {
                pos: new RoomPosition(harvestPos.x, harvestPos.y, room.name),
                range: 0,
            },
            avoidEnemyRanges: true,
        })

        return true
    }

    isDying(): boolean {
        // Inform as dying if creep is already recorded as dying

        if (this.memory.dying) return true

        // Stop if creep is spawning

        if (!this.ticksToLive) return false

        let sourceIndex = 0
        if (this.role === 'source2RemoteHarvester') sourceIndex = 1

        if (this.memory.remote)
            if (
                this.ticksToLive >
                this.body.length * CREEP_SPAWN_TIME + Memory.rooms[this.memory.remote].SE[sourceIndex] - 1
            )
                return false
            else if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

        // Record creep as dying

        this.memory.dying = true
        return true
    }

    preTickManager(): void {
        if (!this.memory.remote) return

        const role = this.role as 'source1RemoteHarvester' | 'source2RemoteHarvester'

        // If the creep's remote no longer is managed by its commune

        if (!Memory.rooms[this.commune].remotes.includes(this.memory.remote)) {
            // Delete it from memory and try to find a new one

            delete this.memory.remote
            if (!this.findRemote()) return
        }

        const commune = Game.rooms[this.commune]
        const remoteMemory = Memory.rooms[this.memory.remote]

        // Reduce remote need

        if (remoteMemory.needs && !this.isDying()) {
            Memory.rooms[this.memory.remote].needs[RemoteNeeds[role]] -= this.parts.work

            const possibleReservation = commune.energyCapacityAvailable >= 650

            let sourceIndex = 0
            if (role === 'source2RemoteHarvester') sourceIndex = 1

            const income =
                (possibleReservation ? 10 : 5) - Math.floor(remoteMemory.needs[RemoteNeeds[role]] * minHarvestWorkRatio)

            // Find the number of carry parts required for the source, and add it to the remoteHauler need

            remoteMemory.needs[RemoteNeeds.remoteHauler] +=
                findCarryPartsRequired(remoteMemory.SE[sourceIndex], income) / 2
        }

        // Add the creep to creepsFromRoomWithRemote relative to its remote

        if (commune.creepsFromRoomWithRemote[this.memory.remote])
            commune.creepsFromRoomWithRemote[this.memory.remote][role].push(this.name)
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static source1RemoteHarvesterManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RemoteHarvester = Game.creeps[creepName]

            // Try to find a remote. If one couldn't be found, iterate

            if (!creep.findRemote()) continue

            creep.say(creep.memory.remote)

            // If the creep needs resources

            if (room.name === creep.memory.remote) {
                // Define the creep's sourceName

                const sourceIndex = 0

                // Try to move to source. If creep moved then iterate

                if (creep.travelToSource(sourceIndex)) continue

                // Try to normally harvest. Iterate if creep harvested

                if (creep.advancedHarvestSource(room.sources[sourceIndex])) continue

                continue
            }

            creep.createMoveRequest({
                origin: creep.pos,
                goal: {
                    pos: new RoomPosition(25, 25, creep.memory.remote),
                    range: 25,
                },
                avoidEnemyRanges: true,
            })
        }
    }

    static source2RemoteHarvesterManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RemoteHarvester = Game.creeps[creepName]

            // Try to find a remote. If one couldn't be found, iterate

            if (!creep.findRemote()) continue

            creep.say(creep.memory.remote)

            // If the creep needs resources

            if (room.name === creep.memory.remote) {
                // Define the creep's sourceName

                const sourceIndex = 1

                // Try to move to source. If creep moved then iterate

                if (creep.travelToSource(sourceIndex)) continue

                // Try to normally harvest. Iterate if creep harvested

                if (creep.advancedHarvestSource(room.sources[sourceIndex])) continue

                continue
            }

            creep.createMoveRequest({
                origin: creep.pos,
                goal: {
                    pos: new RoomPosition(25, 25, creep.memory.remote),
                    range: 25,
                },
                avoidEnemyRanges: true,
            })
        }
    }
}
