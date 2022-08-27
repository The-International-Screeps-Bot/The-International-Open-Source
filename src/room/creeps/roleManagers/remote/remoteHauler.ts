import { RemoteNeeds } from 'international/constants'

export class RemoteHauler extends Creep {
    /**
     * Finds a remote to haul from
     */
    findRemote?(): boolean {
        if (this.memory.remote) return true

        const remoteNamesByEfficacy: string[] = Game.rooms[this.commune]?.get('remoteNamesByEfficacy')

        let roomMemory

        for (const roomName of remoteNamesByEfficacy) {
            roomMemory = Memory.rooms[roomName]

            if (roomMemory.needs[RemoteNeeds.remoteHauler] <= 0) continue

            this.memory.remote = roomName
            roomMemory.needs[RemoteNeeds.remoteHauler] -= this.parts.carry

            return true
        }

        return false
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static remoteHaulerManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RemoteHauler = Game.creeps[creepName]

            // If the creep needs resources

            if (creep.needsResources()) {
                if (!creep.findRemote()) continue

                // If the creep is in the remote

                if (room.name === creep.memory.remote) {
                    creep.reserveWithdrawEnergy()

                    if (!creep.fulfillReservation()) {
                        creep.say(creep.message)
                        continue
                    }

                    creep.reserveWithdrawEnergy()

                    if (!creep.fulfillReservation()) {
                        creep.say(creep.message)
                        continue
                    }

                    if (creep.needsResources()) continue

                    creep.message += creep.commune
                    creep.say(creep.message)

                    creep.createMoveRequest({
                        origin: creep.pos,
                        goal: {
                            pos: new RoomPosition(25, 25, creep.commune),
                            range: 20,
                        },
                        avoidEnemyRanges: true,
                    })

                    continue
                }

                creep.message += creep.memory.remote
                creep.say(creep.message)

                creep.createMoveRequest({
                    origin: creep.pos,
                    goal: {
                        pos: new RoomPosition(25, 25, creep.memory.remote),
                        range: 20,
                    },
                    avoidEnemyRanges: true,
                })

                continue
            }

            // Otherwise if the creep doesn't need resources

            // If the creep has a remoteName, delete it and delete it's fulfilled needs

            if (creep.memory.remote) {
                Memory.rooms[creep.memory.remote].needs[RemoteNeeds.remoteHauler] += creep.parts.carry
                delete creep.memory.remote
            }

            if (room.name === creep.commune) {
                // Try to renew the creep

                creep.advancedRenew()

                creep.reserveTransferEnergy()

                if (!creep.fulfillReservation()) {
                    creep.say(creep.message)
                    continue
                }

                creep.reserveTransferEnergy()

                if (!creep.fulfillReservation()) {
                    creep.say(creep.message)
                    continue
                }

                if (!creep.needsResources()) continue

                if (!creep.findRemote()) continue

                creep.message += creep.memory.remote
                creep.say(creep.message)

                creep.createMoveRequest({
                    origin: creep.pos,
                    goal: {
                        pos: new RoomPosition(25, 25, creep.memory.remote),
                        range: 20,
                    },
                    avoidEnemyRanges: true,
                })

                continue
            }

            creep.message += creep.commune
            creep.say(creep.message)

            creep.createMoveRequest({
                origin: creep.pos,
                goal: {
                    pos: new RoomPosition(25, 25, creep.commune),
                    range: 20,
                },
                avoidEnemyRanges: true,
            })
        }
    }

    preTickManager() {
        if (!this.memory.remote) return

        const role = this.role as 'remoteHauler'

        // If the creep's remote no longer is managed by its commune

        if (!Memory.rooms[this.commune].remotes.includes(this.memory.remote)) {
            // Delete it from memory and try to find a new one

            delete this.memory.remote
            if (!this.findRemote()) return
        }

        // Reduce remote need

        if (Memory.rooms[this.memory.remote].needs)
            Memory.rooms[this.memory.remote].needs[RemoteNeeds[role]] -= this.parts.carry
    }
}
