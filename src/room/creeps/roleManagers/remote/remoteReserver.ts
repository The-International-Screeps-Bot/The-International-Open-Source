import { RemoteData } from 'international/constants'
import { randomTick } from 'international/utils'

export class RemoteReserver extends Creep {
    public get dying(): boolean {
        // Inform as dying if creep is already recorded as dying

        if (this._dying !== undefined) return this._dying

        // Stop if creep is spawning

        if (this.spawning) return false

        if (this.memory.RN) {
            if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME + Memory.rooms[this.memory.RN].RE) return false
        } else if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

        return (this._dying = true)
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

        const remoteNamesByEfficacy = this.commune.remoteNamesBySourceEfficacy

        let roomMemory

        for (const roomName of remoteNamesByEfficacy) {
            roomMemory = Memory.rooms[roomName]

            if (roomMemory.data[RemoteData.remoteReserver] <= 0) continue

            this.memory.RN = roomName
            roomMemory.data[RemoteData.remoteReserver] -= 1

            return true
        }

        return false
    }

    preTickManager() {
        if (randomTick() && !this.getActiveBodyparts(MOVE)) this.suicide()

        const role = this.role as 'remoteReserver'

        if (!this.findRemote()) return
        if (this.dying) return

        // Reduce remote need

        Memory.rooms[this.memory.RN].data[RemoteData[role]] -= 1

        const commune = this.commune

        // Add the creep to creepsOfRemote relative to its remote

        if (commune.creepsOfRemote[this.memory.RN]) commune.creepsOfRemote[this.memory.RN][role].push(this.name)
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static remoteReserverManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RemoteReserver = Game.creeps[creepName]

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

            creep.message = creep.memory.RN

            // If the creep is in the remote

            if (room.name === creep.memory.RN) {
                // Try to reserve the controller

                creep.advancedReserveController()
                continue
            }

            // Otherwise, make a moveRequest to it

            creep.createMoveRequest({
                origin: creep.pos,
                goals: [
                    {
                        pos: new RoomPosition(25, 25, creep.memory.RN),
                        range: 25,
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
            })
        }
    }
}
