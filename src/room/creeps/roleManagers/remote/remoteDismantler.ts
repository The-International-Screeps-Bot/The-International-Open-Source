import { RemoteNeeds } from 'international/constants'
import { findObjectWithID, getRange } from 'international/generalFunctions'

export class RemoteDismantler extends Creep {
    /**
     * Finds a remote
     */
    findRemote?(): boolean {
        const creep = this

        // If the creep already has a remote, inform true

        if (creep.memory.remote) return true

        // Otherwise, get the creep's role

        const role = creep.role as 'remoteDismantler'

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
            roomMemory.needs[RemoteNeeds[role]] -= 1

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

        let target
        let range

        if (this.memory.dismantleTarget) {
            target = findObjectWithID(this.memory.dismantleTarget)

            if (target) {
                range = getRange(this.pos.x, target.pos.x, this.pos.y, target.pos.y)

                if (range > 1) {
                    this.createMoveRequest({
                        origin: this.pos,
                        goal: {
                            pos: target.pos,
                            range: 1,
                        },
                        avoidEnemyRanges: true,
                    })

                    return true
                }

                this.dismantle(target)
                return true
            }
        }

        let targets: Structure[] = room.actionableWalls

        targets = targets.concat(
            room.find(FIND_HOSTILE_STRUCTURES).filter(function (structure) {
                return structure.structureType != STRUCTURE_INVADER_CORE
            }),
        )

        if (targets.length) {
            target = this.pos.findClosestByPath(targets, { ignoreRoads: true, ignoreCreeps: true })

            range = getRange(this.pos.x, target.pos.x, this.pos.y, target.pos.y)

            if (range > 1) {
                this.createMoveRequest({
                    origin: this.pos,
                    goal: {
                        pos: target.pos,
                        range: 1,
                    },
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

    preTickManager() {
        if (!this.memory.remote) return

        const role = this.role as 'remoteDismantler'

        // If the creep's remote no longer is managed by its commune

        if (!Memory.rooms[this.commune].remotes.includes(this.memory.remote)) {
            // Delete it from memory and try to find a new one

            delete this.memory.remote
            if (!this.findRemote()) return
        }

        // Reduce remote need

        if (Memory.rooms[this.memory.remote].needs) Memory.rooms[this.memory.remote].needs[RemoteNeeds[role]] -= 1

        const commune = Game.rooms[this.commune]

        // Add the creep to creepsFromRoomWithRemote relative to its remote

        if (commune.creepsFromRoomWithRemote[this.memory.remote])
            commune.creepsFromRoomWithRemote[this.memory.remote][role].push(this.name)
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static remoteDismantlerManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RemoteDismantler = Game.creeps[creepName]

            // Try to find a remote

            if (!creep.findRemote()) {
                // If the room is the creep's commune

                if (room.name === creep.commune) {
                    // Advanced recycle and iterate

                    creep.advancedRecycle()
                    continue
                }

                // Otherwise, have the creep make a moveRequest to its commune and iterate

                creep.createMoveRequest({
                    origin: creep.pos,
                    goal: {
                        pos: new RoomPosition(25, 25, creep.commune),
                        range: 25,
                    },
                })

                continue
            }

            creep.say(creep.memory.remote)

            if (creep.advancedDismantle()) continue

            // If the creep is its remote

            if (room.name === creep.memory.remote) {
                delete creep.memory.remote
                continue
            }

            // Otherwise, create a moveRequest to its remote

            creep.createMoveRequest({
                origin: creep.pos,
                goal: {
                    pos: new RoomPosition(25, 25, creep.memory.remote),
                    range: 25,
                },
            })
        }
    }
}
