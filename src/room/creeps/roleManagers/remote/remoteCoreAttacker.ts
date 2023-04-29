import { CreepMemoryKeys, customColors, RoomMemoryKeys, RoomTypes } from 'international/constants'
import { getRangeXY, randomTick } from 'international/utils'

export class RemoteCoreAttacker extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    public isDying() {
        // Stop if creep is spawning

        if (this.spawning) return false

        // If the creep's remaining ticks are more than the estimated spawn time, inform false

        if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

        // Record creep as isDying

        return true
    }

    preTickManager(): void {
        if (randomTick() && !this.getActiveBodyparts(MOVE)) this.suicide()

        const role = this.role as 'remoteCoreAttacker'

        if (!this.findRemote()) return
        if (this.isDying()) return

        // Reduce remote need

        Memory.rooms[this.memory[CreepMemoryKeys.remote]][RoomMemoryKeys[role]] -= 1

        const commune = this.commune

        // Add the creep to creepsOfRemote relative to its remote

        if (commune.creepsOfRemote[this.memory[CreepMemoryKeys.remote]])
            commune.creepsOfRemote[this.memory[CreepMemoryKeys.remote]][role].push(this.name)
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
        // Otherwise, get the creep's role

        const role = 'remoteCoreAttacker'

        // Get remotes by their efficacy

        const remoteNamesByEfficacy = this.commune.remoteNamesBySourceEfficacy

        // Loop through each remote name

        for (const roomName of remoteNamesByEfficacy) {
            const roomMemory = Memory.rooms[roomName]
            if (roomMemory[RoomMemoryKeys[role]] <= 0) continue

            // Otherwise assign the remote to the creep and inform true

            this.memory[CreepMemoryKeys.remote] = roomName
            roomMemory[RoomMemoryKeys[role]] -= 1

            return true
        }

        // Inform false

        return false
    }

    /**
     * Find and attack cores
     */
    advancedAttackCores?(): boolean {
        const { room } = this

        // If there are no cores

        if (!room.roomManager.structures.invaderCore.length) return false

        // Find the closest core

        const closestCore = room.roomManager.structures.invaderCore[0]

        // If the creep at the core

        if (getRangeXY(this.pos.x, closestCore.pos.x, this.pos.y, closestCore.pos.y) === 1) {
            this.message = '🗡️C'

            this.attack(closestCore)
            return true
        }

        // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

        this.message = '⏩C'

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: closestCore.pos, range: 1 }],
            avoidEnemyRanges: true,
        })

        return true
    }

    static roleManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RemoteCoreAttacker = Game.creeps[creepName]

            // Try to find a remote

            if (!creep.findRemote()) {
                // If the room is the creep's commune

                if (room.name === creep.commune.name) {
                    // Advanced recycle and iterate

                    creep.advancedRecycle()
                    continue
                }

                const anchor = creep.commune.roomManager.anchor
                if (!anchor) throw Error('No anchor for remoteCoreAttacker ' + creep.room.name)

                // Otherwise, have the creep make a moveRequest to its commune and iterate

                creep.createMoveRequest({
                    origin: creep.pos,
                    goals: [
                        {
                            pos: anchor,
                            range: 5,
                        },
                    ],
                })

                continue
            }

            creep.message = creep.memory[CreepMemoryKeys.remote]

            if (creep.advancedAttackCores()) continue

            // If the creep is its remote

            if (room.name === creep.memory[CreepMemoryKeys.remote]) {
                delete creep.memory[CreepMemoryKeys.remote]
                continue
            }

            // Otherwise, create a moveRequest to its remote

            creep.createMoveRequest({
                origin: creep.pos,
                goals: [
                    {
                        pos: new RoomPosition(25, 25, creep.memory[CreepMemoryKeys.remote]),
                        range: 25,
                    },
                ],
                typeWeights: {
                    enemy: Infinity,
                    ally: Infinity,
                    keeper: Infinity,
                    enemyRemote: Infinity,
                    allyRemote: Infinity,
                },
                avoidAbandonedRemotes: true,
            })
        }
    }
}
