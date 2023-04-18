import { WorkRequestKeys, CreepMemoryKeys, RoomMemoryKeys, RoomTypes } from 'international/constants'
import { findObjectWithID, getRangeXY, getRange } from 'international/utils'
import { unpackCoord } from 'other/codec'

export class AllyVanguard extends Creep {
    preTickManager() {
        const request = Memory.workRequests[this.memory[CreepMemoryKeys.taskRoom]]

        if (!request) return

        request[WorkRequestKeys.allyVanguard] -= this.parts.work
    }

    findRemote?(): boolean {
        if (this.memory[CreepMemoryKeys.remote]) return true

        const { room } = this

        const exitRoomNames = Game.map.describeExits(room.name)

        for (const exitKey in exitRoomNames) {
            const roomName = exitRoomNames[exitKey as ExitKey]

            const roomMemory = Memory.rooms[roomName]

            // If the room type is not able to be harvested from

            if (
                !roomMemory ||
                roomMemory[RoomMemoryKeys.type] === RoomTypes.enemy ||
                roomMemory[RoomMemoryKeys.type] === RoomTypes.enemyRemote ||
                roomMemory[RoomMemoryKeys.type] === RoomTypes.keeper ||
                roomMemory[RoomMemoryKeys.type] === RoomTypes.ally ||
                roomMemory[RoomMemoryKeys.type] === RoomTypes.allyRemote
            )
                continue

            this.memory[CreepMemoryKeys.remote] = roomName
            return true
        }

        // No viable remote was found

        return false
    }

    getEnergyFromRemote?(): void {
        const { room } = this

        if (!this.findRemote()) return

        if (room.name !== this.memory[CreepMemoryKeys.remote]) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: new RoomPosition(25, 25, this.memory[CreepMemoryKeys.remote]), range: 25 }],
                avoidEnemyRanges: true,
            })

            return
        }

        // Define the creep's sourceName

        if (!this.findSourceIndex()) return

        const sourceIndex = this.memory[CreepMemoryKeys.sourceIndex]

        // Try to move to source. If creep moved then iterate

        if (this.travelToSource(sourceIndex)) return

        // Try to normally harvest. Iterate if creep harvested

        if (this.advancedHarvestSource(room.find(FIND_SOURCES)[sourceIndex])) return
    }

    getEnergyFromRoom?(): boolean {
        if (this.room.controller.owner) return false

        if (
            this.runRoomLogisticsRequestsAdvanced({
                resourceTypes: new Set([RESOURCE_ENERGY]),
            })
        )
            return true

        if (!this.needsResources()) return true

        // Define the creep's sourceName

        if (!this.findSourceIndex()) return true

        const sourceIndex = this.memory[CreepMemoryKeys.sourceIndex]

        // Try to move to source. If creep moved then iterate

        if (this.travelToSource(sourceIndex)) return true

        // Try to normally harvest. Iterate if creep harvested

        if (this.advancedHarvestSource(this.room.find(FIND_SOURCES)[sourceIndex])) return true

        return true
    }

    /**
     *
     */
    travelToSource?(sourceIndex: number): boolean {
        this.message = '🚬'

        const harvestPos = this.findSourceHarvestPos(this.memory[CreepMemoryKeys.sourceIndex])
        if (!harvestPos) return true

        // If the creep is at the creep's packedHarvestPos, inform false

        if (getRange(this.pos, harvestPos) === 0) return false

        // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

        this.message = `⏩ ${sourceIndex}`

        this.createMoveRequest({
            origin: this.pos,
            goals: [
                {
                    pos: harvestPos,
                    range: 0,
                },
            ],
        })

        return true
    }

    /**
     * Builds a spawn in the creep's commune workRequest
     */
    buildRoom?(): void {
        const { room } = this

        if (this.needsResources()) {
            if (this.memory[CreepMemoryKeys.remote]) {
                this.getEnergyFromRemote()
                return
            }

            if (!this.getEnergyFromRoom()) {
                this.getEnergyFromRemote()
            }

            return
        }

        if (room.name !== this.memory[CreepMemoryKeys.taskRoom]) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: new RoomPosition(25, 25, this.memory[CreepMemoryKeys.taskRoom]), range: 25 }],
                avoidEnemyRanges: true,
            })

            return
        }

        this.advancedBuildAllyCSite()
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static roleManager(room: Room, creepsOfRole: string[]) {
        // Loop through the names of the creeps of the role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: AllyVanguard = Game.creeps[creepName]

            const request = creep.memory[CreepMemoryKeys.taskRoom]

            creep.message = request

            if (
                room.name === request ||
                (creep.memory[CreepMemoryKeys.remote] && room.name === creep.memory[CreepMemoryKeys.remote])
            ) {
                creep.buildRoom()
                continue
            }

            // Otherwise if the creep is not in the claimTarget

            // Move to it

            if (
                creep.createMoveRequest({
                    origin: creep.pos,
                    goals: [{ pos: new RoomPosition(25, 25, creep.memory[CreepMemoryKeys.taskRoom]), range: 25 }],
                    avoidEnemyRanges: true,
                    typeWeights: {
                        enemy: Infinity,
                        ally: Infinity,
                        keeper: Infinity,
                    },
                }) === 'unpathable'
            ) {
                const request = Memory.workRequests[creep.memory[CreepMemoryKeys.taskRoom]]
                if (request) request[WorkRequestKeys.abandon] = 20000
            }
        }
    }
}
