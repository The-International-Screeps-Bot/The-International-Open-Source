import { CreepMemoryKeys, RemoteData } from 'international/constants'
import { findObjectWithID, getRangeXY, randomTick } from 'international/utils'

export class RemoteDismantler extends Creep {
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

    preTickManager() {
        if (!this.findRemote()) return
        if (randomTick() && !this.getActiveBodyparts(MOVE)) this.suicide()

        const role = this.role as 'remoteDismantler'

        if (this.isDying()) return

        // Reduce remote need

        Memory.rooms[this.memory.RN].data[RemoteData[role]] -= 1

        const commune = this.commune

        // Add the creep to creepsOfRemote relative to its remote

        if (commune.creepsOfRemote[this.memory.RN]) commune.creepsOfRemote[this.memory.RN][role].push(this.name)
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

        // Otherwise, get the creep's role

        const role = 'remoteDismantler'

        // Get remotes by their efficacy

        const remoteNamesByEfficacy = this.commune.remoteNamesBySourceEfficacy

        // Loop through each remote name

        for (const roomName of remoteNamesByEfficacy) {
            const roomMemory = Memory.rooms[roomName]
            if (roomMemory.data[RemoteData[role]] <= 0) continue

            // Otherwise assign the remote to the creep and inform true

            this.memory.RN = roomName
            roomMemory.data[RemoteData[role]] -= 1

            return true
        }

        // Inform false

        return false
    }

    /**
     * Find and attack structures
     */
    advancedDismantle?(): boolean {
        const { room } = this

        if (
            this.room.controller &&
            this.room.controller.owner &&
            Memory.allyPlayers.includes(this.room.controller.owner.username)
        )
            return true

        let target
        let range

        if (this.memory.dismantleTarget) {
            target = findObjectWithID(this.memory.dismantleTarget)

            if (target) {
                range = getRangeXY(this.pos.x, target.pos.x, this.pos.y, target.pos.y)

                if (range > 1) {
                    this.createMoveRequest({
                        origin: this.pos,
                        goals: [
                            {
                                pos: target.pos,
                                range: 1,
                            },
                        ],
                        avoidEnemyRanges: true,
                    })

                    return true
                }

                this.dismantle(target)
                return true
            }
        }

        const targets = room.dismantleTargets

        if (targets.length) {
            target = this.pos.findClosestByPath(targets, { ignoreRoads: true, ignoreCreeps: true })

            range = getRangeXY(this.pos.x, target.pos.x, this.pos.y, target.pos.y)

            if (range > 1) {
                this.createMoveRequest({
                    origin: this.pos,
                    goals: [
                        {
                            pos: target.pos,
                            range: 1,
                        },
                    ],
                    avoidEnemyRanges: true,
                })

                return true
            }

            this.memory.dismantleTarget = target.id

            this.dismantle(target)
            return true
        }

        return false
    }

    static roleManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RemoteDismantler = Game.creeps[creepName]

            // Try to find a remote

            if (!creep.findRemote()) {
                // If the room is the creep's commune

                if (room.name === creep.commune.name) {
                    // Advanced recycle and iterate

                    creep.advancedRecycle()
                    continue
                }

                const anchor = creep.commune.roomManager.anchor
                if (!anchor) throw Error('No anchor for remoteDismantler ' + creep.room.name)

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

            creep.message = creep.memory.RN

            // If the creep is its remote

            if (room.name === creep.memory.RN) {
                if (creep.advancedDismantle()) continue
                continue
            }

            // Otherwise, create a moveRequest to its remote

            creep.createMoveRequest({
                origin: creep.pos,
                goals: [
                    {
                        pos: new RoomPosition(25, 25, creep.memory.RN),
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
