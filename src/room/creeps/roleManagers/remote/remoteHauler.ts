import { remoteNeedsIndex } from 'international/constants'
import { RemoteHauler } from '../../creepClasses'

export function remoteHaulerManager(room: Room, creepsOfRole: string[]) {
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

        // Otherwise if creep doesn't need resources

        if (room.name === creep.commune) {
            // Try to renew the creep

            creep.advancedRenew()

            // If the creep has a remoteName, delete it and delete it's fulfilled needs so the creep has a chance to find a better target

            if (creep.memory.remote) {
                Memory.rooms[creep.memory.remote].needs[remoteNeedsIndex.remoteHauler] += creep.parts.carry
                delete creep.memory.remote
            }

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

RemoteHauler.prototype.findRemote = function () {
    if (this.memory.remote) return true

    const remoteNamesByEfficacy: string[] = Game.rooms[this.commune]?.get('remoteNamesByEfficacy')

    let roomMemory

    for (const roomName of remoteNamesByEfficacy) {
        roomMemory = Memory.rooms[roomName]

        if (roomMemory.needs[remoteNeedsIndex.remoteHauler] <= 0) continue

        this.memory.remote = roomName
        roomMemory.needs[remoteNeedsIndex.remoteHauler] -= this.parts.carry

        return true
    }

    return false
}
