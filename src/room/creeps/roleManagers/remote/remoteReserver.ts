import {
    CreepMemoryKeys,
    ReservedCoordTypes,
    Result,
    RoomMemoryKeys,
    RoomTypes,
    packedPosLength,
} from 'international/constants'
import { getRange, randomTick } from 'utils/utils'
import {
    packCoord,
    reversePosList,
    unpackCoordAsPos,
    unpackPosAt,
    unpackPosList,
} from 'other/codec'

export class RemoteReserver extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    public isDying(): boolean {
        // Stop if creep is spawning

        if (this.spawning) return false

        if (this.memory[CreepMemoryKeys.remote]) {
            if (
                this.ticksToLive >
                this.body.length * CREEP_SPAWN_TIME +
                    Memory.rooms[this.memory[CreepMemoryKeys.remote]][
                        RoomMemoryKeys.remoteControllerPath
                    ].length /
                        packedPosLength
            )
                return false
        } else if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

        return true
    }

    update() {
        const packedCoord = Memory.creeps[this.name][CreepMemoryKeys.packedCoord]
        if (packedCoord) {
            if (this.isDying()) {
                this.room.roomManager.reserveCoord(packedCoord, ReservedCoordTypes.dying)
            } else {
                this.room.roomManager.reserveCoord(packedCoord, ReservedCoordTypes.important)
            }
        }
    }

    initRun() {
        if (randomTick() && !this.getActiveBodyparts(MOVE)) {
            this.suicide()
            return
        }

        if (!this.hasValidRemote()) {
            this.removeRemote()
            return
        }

        // We have a valid remote

        this.applyRemote()
        this.controllerAction()
    }

    /**
     * Finds a remote to harvest in
     */
    findRemote?() {
        if (this.hasValidRemote()) return true

        const remoteNamesByEfficacy = this.commune.roomManager.remoteNamesByEfficacy
        for (const remoteName of remoteNamesByEfficacy) {
            const remoteMemory = Memory.rooms[remoteName]
            if (remoteMemory[RoomMemoryKeys.type] !== RoomTypes.remote) continue
            if (remoteMemory[RoomMemoryKeys.commune] !== this.commune.name) continue

            if (remoteMemory[RoomMemoryKeys.abandonRemote]) continue
            if (remoteMemory[RoomMemoryKeys.remoteReserver] <= 0) continue

            this.assignRemote(remoteName)
            return true
        }

        return false
    }

    hasValidRemote?() {
        const creepMemory = Memory.creeps[this.name]
        if (!creepMemory[CreepMemoryKeys.remote]) return false

        const remoteMemory = Memory.rooms[creepMemory[CreepMemoryKeys.remote]]

        if (remoteMemory[RoomMemoryKeys.type] !== RoomTypes.remote) return false
        if (remoteMemory[RoomMemoryKeys.commune] !== this.commune.name) return false
        if (remoteMemory[RoomMemoryKeys.abandonRemote]) return false

        return true
    }

    assignRemote?(remoteName: string) {
        const creepMemory = Memory.creeps[this.name]
        creepMemory[CreepMemoryKeys.remote] = remoteName

        this.applyRemote()
    }

    applyRemote?() {
        const creepMemory = Memory.creeps[this.name]
        const commune = this.commune
        const remoteName = creepMemory[CreepMemoryKeys.remote]

        if (commune.creepsOfRemote[remoteName])
            commune.creepsOfRemote[remoteName][this.role].push(this.name)

        if (this.isDying()) return

        Memory.rooms[creepMemory[CreepMemoryKeys.remote]][RoomMemoryKeys.remoteReserver] -=
            this.parts.claim
    }

    removeRemote?() {
        const creepMemory = Memory.creeps[this.name]

        delete creepMemory[CreepMemoryKeys.remote]
    }

    controllerAction?() {
        if (this.room.name !== Memory.creeps[this.name][CreepMemoryKeys.remote]) return Result.fail
        if (getRange(this.room.controller.pos, this.pos) > 1) return Result.fail

        // The controller is reserved by someone else
        if (
            this.room.controller.reservation &&
            this.room.controller.reservation.username !== Memory.me
        ) {
            this.attackController(this.room.controller)
            return Result.action
        }

        // Nobody is reserving - we should
        this.reserveController(this.room.controller)
        return Result.success
    }

    findControllerPos?() {
        const creepMemory = Memory.creeps[this.name]
        let packedCoord = creepMemory[CreepMemoryKeys.packedCoord]
        if (packedCoord) {
            return unpackCoordAsPos(packedCoord, this.room.name)
        }

        const reservedCoords = this.room.roomManager.reservedCoords
        const usePos = this.room.roomManager.remoteControllerPositions.find(pos => {
            return reservedCoords.get(packCoord(pos)) !== ReservedCoordTypes.important
        })
        if (!usePos) return false

        packedCoord = packCoord(usePos)

        creepMemory[CreepMemoryKeys.packedCoord] = packedCoord
        this.room.roomManager.reservedCoords.set(packedCoord, ReservedCoordTypes.important)

        return usePos
    }

    travelToController?() {
        const usePos = this.findControllerPos()
        if (!usePos) return Result.fail

        this.actionCoord = this.room.controller.pos
        if (getRange(this.pos, usePos) === 0) return Result.success

        this.createMoveRequestByPath(
            {
                origin: this.pos,
                goals: [
                    {
                        pos: usePos,
                        range: 0,
                    },
                ],
            },
            {
                packedPath: reversePosList(
                    Memory.rooms[this.memory[CreepMemoryKeys.remote]][
                        RoomMemoryKeys.remoteControllerPath
                    ],
                ),
                remoteName: this.memory[CreepMemoryKeys.remote],
            },
        )

        return Result.action
    }

    runRemote?() {
        if (this.travelToController() !== Result.success) return
    }

    outsideRemote?() {
        const controllerPos = unpackPosAt(
            Memory.rooms[Memory.creeps[this.name][CreepMemoryKeys.remote]][
                RoomMemoryKeys.remoteControllerPositions
            ],
        )

        this.createMoveRequestByPath(
            {
                origin: this.pos,
                goals: [
                    {
                        pos: controllerPos,
                        range: 0,
                    },
                ],
            },
            {
                packedPath: reversePosList(
                    Memory.rooms[this.memory[CreepMemoryKeys.remote]][
                        RoomMemoryKeys.remoteControllerPath
                    ],
                ),
                remoteName: this.memory[CreepMemoryKeys.remote],
            },
        )
    }

    static roleManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: RemoteReserver = Game.creeps[creepName]

            // Try to find a remote

            if (!creep.findRemote()) {
                // If the room is the creep's commune

                creep.message = '❌ Remote'

                /*
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
 */
                continue
            }

            creep.message = creep.memory[CreepMemoryKeys.remote]

            // If the creep is in the remote

            if (room.name === creep.memory[CreepMemoryKeys.remote]) {
                creep.runRemote()
                continue
            }

            creep.outsideRemote()
        }
    }
}
