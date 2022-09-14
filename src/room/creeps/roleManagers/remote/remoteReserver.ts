import { RemoteNeeds } from 'international/constants'

export class RemoteReserver extends Creep {
    public get dying(): boolean {
        // Inform as dying if creep is already recorded as dying

        if (this._dying) return true

        // Stop if creep is spawning

        if (!this.ticksToLive) return false

        if (this.memory.RN) {
            if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME + Memory.rooms[this.memory.RN].RE - 1)
                return false
        } else if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

        return (this._dying = true)
    }

    /**
     * Finds a remote to reserve
     */
    findRemote?(): boolean {
        if (this.memory.RN) return true

        const remoteNamesByEfficacy = this.commune?.remoteNamesBySourceEfficacy

        let roomMemory

        for (const roomName of remoteNamesByEfficacy) {
            roomMemory = Memory.rooms[roomName]

            if (roomMemory.needs[RemoteNeeds.remoteReserver] <= 0) continue

            this.memory.RN = roomName
            roomMemory.needs[RemoteNeeds.remoteReserver] -= 1

            return true
        }

        return false
    }

    preTickManager() {
        if (!this.memory.RN) return

        const role = this.role as 'remoteReserver'

        // If the creep's remote no longer is managed by its commune

        if (!Memory.rooms[this.commune.name].remotes.includes(this.memory.RN)) {
            // Delete it from memory and try to find a new one

            delete this.memory.RN
            if (!this.findRemote()) return
        }

        if (this.dying) return

        // Reduce remote need

        Memory.rooms[this.memory.RN].needs[RemoteNeeds[role]] -= 1

        const commune = this.commune

        // Add the creep to creepsFromRoomWithRemote relative to its remote

        if (commune.creepsFromRoomWithRemote[this.memory.RN])
            commune.creepsFromRoomWithRemote[this.memory.RN][role].push(this.name)
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static remoteReserverManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RemoteReserver = Game.creeps[creepName]

            if (!creep.findRemote()) continue

            creep.say(creep.memory.RN)

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
                plainCost: 1,
                typeWeights: {
                    enemy: Infinity,
                    ally: Infinity,
                    keeper: Infinity,
                    enemyRemote: Infinity,
                    allyRemote: Infinity
                },
            })

            continue
        }
    }
}
