import { RemoteData, RESULT_ACTION, RESULT_FAIL, RESULT_SUCCESS } from 'international/constants'
import { getRange, randomTick } from 'international/utils'
import { packCoord, reversePosList, unpackCoordAsPos, unpackPosList } from 'other/codec'

export class RemoteReserver extends Creep {

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    public isDying(): boolean {
        // Stop if creep is spawning

        if (this.spawning) return false

        if (this.memory.RN) {
            if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME + Memory.rooms[this.memory.RN].RE) return false
        } else if (this.ticksToLive > this.body.length * CREEP_SPAWN_TIME) return false

        return true
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

        const remoteName = this.memory.RN
        if (this.room.name === remoteName && getRange(this.room.controller.pos, this.pos) <= 1) {

            this.reserveController(this.room.controller)
        }

        if (this.isDying()) return

        // Reduce remote need

        Memory.rooms[remoteName].data[RemoteData[role]] -= this.parts.claim

        const commune = this.commune

        // Add the creep to creepsOfRemote relative to its remote

        if (commune.creepsOfRemote[remoteName]) commune.creepsOfRemote[remoteName][role].push(this.name)
    }

    findControllerPos?() {

        let packedCoord = this.memory.PC
        if (packedCoord) {

            return unpackCoordAsPos(packedCoord, this.room.name)
        }

        const usedControllerCoords = this.room.roomManager.usedControllerCoords

        const usePos = this.room.roomManager.remoteControllerPositions.find(pos => !usedControllerCoords.has(packCoord(pos)))
        if (!usePos) return false

        packedCoord = packCoord(usePos)

        this.memory.PC = packedCoord
        this.room.roomManager._usedControllerCoords.add(packedCoord)

        return usePos
    }

    travelToController?() {

        const usePos = this.findControllerPos()
        if (!usePos) return RESULT_FAIL

        this.actionCoord = this.room.controller.pos

        if (getRange(this.pos, usePos) === 0) return RESULT_SUCCESS

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
                packedPath: reversePosList(Memory.rooms[this.memory.RN].RCPa),
                remoteName: this.memory.RN,
            },
        )

        return RESULT_ACTION
    }

    inRemote?() {

        if (this.travelToController() !== RESULT_SUCCESS) return

    }

    outsideRemote?() {

        const remoteControllerPositions = unpackPosList(Memory.rooms[this.memory.RN].RCP)

        this.createMoveRequestByPath(
            {
                origin: this.pos,
                goals: [
                    {
                        pos: remoteControllerPositions[0],
                        range: 0,
                    },
                ],
            },
            {
                packedPath: reversePosList(Memory.rooms[this.memory.RN].RCPa),
                remoteName: this.memory.RN,
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

            creep.message = creep.memory.RN

            // If the creep is in the remote

            if (room.name === creep.memory.RN) {

                creep.inRemote()
                continue
            }

            creep.outsideRemote()
        }
    }
}
