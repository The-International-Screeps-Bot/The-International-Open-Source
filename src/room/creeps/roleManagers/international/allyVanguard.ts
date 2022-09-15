import { AllyCreepRequestNeeds } from 'international/constants'
import { findObjectWithID, getRange, unpackAsPos } from 'international/generalFunctions'

export class AllyVanguard extends Creep {
    findRemote?(): boolean {
        if (this.memory.RN) return true

        const { room } = this

        const exitRoomNames = Game.map.describeExits(room.name)

        for (const exitKey in exitRoomNames) {
            const roomName = exitRoomNames[exitKey as ExitKey]

            const roomMemory = Memory.rooms[roomName]

            // If the room type is not able to be harvested from

            if (
                !roomMemory ||
                roomMemory.T === 'enemy' ||
                roomMemory.T === 'enemyRemote' ||
                roomMemory.T === 'keeper' ||
                roomMemory.T === 'ally' ||
                roomMemory.T === 'allyRemote'
            )
                continue

            this.memory.RN = roomName
            return true
        }

        // No viable remote was found

        return false
    }

    getEnergyFromRemote?(): void {
        const { room } = this

        if (!this.findRemote()) return

        if (room.name !== this.memory.RN) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: new RoomPosition(25, 25, this.memory.RN), range: 25 }],
                avoidEnemyRanges: true,
            })

            return
        }

        // Define the creep's sourceName

        if (!this.findOptimalSourceIndex()) return

        const sourceIndex = this.memory.SI

        // Try to move to source. If creep moved then iterate

        if (this.travelToSource(sourceIndex)) return

        // Try to normally harvest. Iterate if creep harvested

        if (this.advancedHarvestSource(room.sources[sourceIndex])) return
    }

    getEnergyFromRoom?(): boolean {
        const { room } = this

        if (room.controller && (room.controller.owner || room.controller.reservation)) {
            if (!this.memory.reservations || !this.memory.reservations.length) this.reserveWithdrawEnergy()

            if (!this.fulfillReservation()) {
                this.say(this.message)
                return true
            }

            this.reserveWithdrawEnergy()

            if (!this.fulfillReservation()) {
                this.say(this.message)
                return true
            }

            if (this.needsResources()) return false
            return false
        }

        // Define the creep's sourceName

        if (!this.findOptimalSourceIndex()) return true

        const sourceIndex = this.memory.SI

        // Try to move to source. If creep moved then iterate

        if (this.travelToSource(sourceIndex)) return true

        // Try to normally harvest. Iterate if creep harvested

        if (this.advancedHarvestSource(room.sources[sourceIndex])) return true

        return true
    }

    /**
     *
     */
    travelToSource?(sourceIndex: number): boolean {
        const { room } = this

        this.say('FHP')

        // Try to find a harvestPosition, inform false if it failed

        if (!this.findSourcePos(sourceIndex)) return false

        this.say('🚬')

        // Unpack the harvestPos

        const harvestPos = unpackAsPos(this.memory.packedPos)

        // If the creep is at the creep's packedHarvestPos, inform false

        if (getRange(this.pos.x, harvestPos.x, this.pos.y, harvestPos.y) === 0) return false

        // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

        this.say(`⏩ ${sourceIndex}`)

        this.createMoveRequest({
            origin: this.pos,
            goals: [
                {
                    pos: new RoomPosition(harvestPos.x, harvestPos.y, room.name),
                    range: 0,
                },
            ],
            avoidEnemyRanges: true,
        })

        return true
    }

    /**
     * Builds a spawn in the creep's commune claimRequest
     */
    buildRoom?(): void {
        const { room } = this

        if (this.needsResources()) {
            if (this.memory.RN) {
                this.getEnergyFromRemote()
                return
            }

            // If there is a controller and it's owned or reserved

            if (!this.getEnergyFromRoom()) {
                this.getEnergyFromRemote()
            }

            return
        }

        const request = Memory.rooms[this.commune.name].allyCreepRequest

        if (room.name !== request) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: new RoomPosition(25, 25, request), range: 25 }],
                avoidEnemyRanges: true,
            })

            return
        }

        this.advancedBuildAllyCSite()
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static allyVanguardManager(room: Room, creepsOfRole: string[]) {
        // Loop through the names of the creeps of the role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: AllyVanguard = Game.creeps[creepName]

            const request = Memory.rooms[creep.commune.name].allyCreepRequest

            // If the creep has no claim target, stop

            if (!request) return

            Memory.allyCreepRequests[Memory.rooms[creep.commune.name].allyCreepRequest].needs[
                AllyCreepRequestNeeds.allyVanguard
            ] -= creep.parts.work

            creep.say(request)

            if (room.name === request || (creep.memory.RN && room.name === creep.memory.RN)) {
                creep.buildRoom()
                continue
            }

            // Otherwise if the creep is not in the claimTarget

            // Move to it

            creep.createMoveRequest({
                origin: creep.pos,
                goals: [{ pos: new RoomPosition(25, 25, request), range: 25 }],
                avoidEnemyRanges: true,
                typeWeights: {
                    enemy: Infinity,
                    ally: Infinity,
                    keeper: Infinity,
                    commune: 1,
                    neutral: 1,
                    highway: 1,
                },
            })
        }
    }
}
