import { CreepMemoryKeys, RoomMemoryKeys, RoomTypes, communeSign, nonCommuneSigns } from 'international/constants'
import { cleanRoomMemory, findClosestCommuneName, getRangeXY, getRange } from 'international/utils'
import { partial } from 'lodash'

export class Scout extends Creep {
    scoutedRooms?: string[]
    unscoutedRooms?: string[]

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    preTickManager() {
        if (!this.memory[CreepMemoryKeys.scoutTarget]) return

        this.commune.scoutTargets.add(this.memory[CreepMemoryKeys.scoutTarget])
    }

    /**
     * Finds a room name for the scout to target
     */
    findScoutTarget?(): boolean {
        if (this.memory[CreepMemoryKeys.scoutTarget]) return true

        const scoutTarget = this.findBestScoutTarget()
        if (!scoutTarget) return false

        this.commune.scoutTargets.add(this.memory[CreepMemoryKeys.scoutTarget])
        return true
    }

    findScoutTargets?() {
        // Construct storage of exit information

        this.scoutedRooms = []
        this.unscoutedRooms = []

        // Get information about the room's exits

        const exits = Game.map.describeExits(this.room.name)

        // Loop through each adjacent room recording scouted and unscouted rooms

        for (const exitType in exits) {
            // Get the roomName using the exitType

            const roomName = exits[exitType as ExitKey]

            // If a scout already has this room as a target

            if (this.commune.scoutTargets.has(roomName)) continue

            // Iterate if the room statuses aren't the same

            if (Game.map.getRoomStatus(roomName).status !== Game.map.getRoomStatus(this.room.name).status) continue

            // If the room has memory and a LST

            if (Memory.rooms[roomName] && Memory.rooms[roomName][RoomMemoryKeys.lastScout]) {
                // Add it to scoutedRooms and iterate

                this.scoutedRooms.push(roomName)
                continue
            }

            // Otherwise add it to unscouted rooms

            this.unscoutedRooms.push(roomName)
        }
    }

    findBestScoutTarget?() {
        this.findScoutTargets()

        // Find the closest room to the creep's commune

        if (this.unscoutedRooms.length) {
            let lowestRange = Infinity

            for (const roomName of this.unscoutedRooms) {
                const range = Game.map.getRoomLinearDistance(this.commune.name, roomName)
                if (range > lowestRange) continue

                lowestRange = range
                this.memory[CreepMemoryKeys.scoutTarget] = roomName
            }

            return this.memory[CreepMemoryKeys.scoutTarget]
        }

        // Find the room scouted longest ago

        let lowestLastScoutTick = Infinity

        for (const roomName of this.scoutedRooms) {
            const lastScoutTick = Memory.rooms[roomName][RoomMemoryKeys.lastScout]
            if (lastScoutTick > lowestLastScoutTick) continue

            lowestLastScoutTick = lastScoutTick
            this.memory[CreepMemoryKeys.scoutTarget] = roomName
        }

        return this.memory[CreepMemoryKeys.scoutTarget]
    }

    // THIS SHOULD BE A ROOM FUNCTION BASED OFF Room.advancedScout
    /*
    recordDeposits?(): void {
        const { room } = this

        if (room.memory[RoomMemoryKeys.type] != RoomTypes.highway) return

        // Make sure the room has a commune

        if (room.memory[RoomMemoryKeys.commune]) {
            if (!global.communes.has(room.memory[RoomMemoryKeys.commune])) {
                room.memory[RoomMemoryKeys.commune] = findClosestCommuneName(room.name)
            }
        } else {
            room.memory[RoomMemoryKeys.commune] = findClosestCommuneName(room.name)
        }

        const communeMemory = Memory.rooms[room.memory[RoomMemoryKeys.commune]]

        const deposits = room.find(FIND_DEPOSITS)

        // Filter deposits that haven't been assigned a commune and are viable

        const unAssignedDeposits = deposits.filter(function (deposit) {
            return !communeMemory[RoomMemoryKeys.deposits][deposit.id] && deposit.lastCooldown <= 100 && deposit.ticksToDecay > 500
        })

        for (const deposit of unAssignedDeposits)
            communeMemory[RoomMemoryKeys.deposits][deposit.id] = {
                decay: deposit.ticksToDecay,
                needs: [1, 1],
            }
    }
 */
    /**
     * Tries to sign a room's controller depending on the situation
     */
    advancedSignController?(): boolean {
        const { room } = this

        const { controller } = room

        if (!controller) return true

        if (room.name !== this.memory[CreepMemoryKeys.signTarget]) return true

        this.message = '🔤'

        // Construct the signMessage

        let signMessage: string

        // If the room is owned by an enemy or an ally

        if (room.memory[RoomMemoryKeys.type] === RoomTypes.ally || room.memory[RoomMemoryKeys.type] === RoomTypes.enemy)
            return true

        if (controller.reservation && controller.reservation.username !== Memory.me) return true

        // If the room is a commune

        if (room.memory[RoomMemoryKeys.type] === RoomTypes.commune) {
            // If the room already has a correct sign

            if (controller.sign && controller.sign.text === communeSign) return true

            // Otherwise assign the signMessage the commune sign

            signMessage = communeSign
        }

        // Otherwise if the room is not a commune
        else {
            // If the room already has a correct sign

            if (controller.sign && nonCommuneSigns.includes(controller.sign.text)) return true

            // And assign the message according to the index of randomSign

            signMessage = nonCommuneSigns[Math.floor(Math.random() * nonCommuneSigns.length)]
        }

        // If the controller is not in range

        if (getRange(this.pos, controller.pos) > 1) {
            // Request to move to the controller and inform false

            if (
                this.createMoveRequest({
                    origin: this.pos,
                    goals: [{ pos: room.controller.pos, range: 1 }],
                    avoidEnemyRanges: true,
                    plainCost: 1,
                    swampCost: 1,
                }) === 'unpathable'
            )
                return true

            this.message = this.moveRequest.toString()

            return false
        }

        // Otherwise Try to sign the controller, informing the result

        return this.signController(room.controller, signMessage) === OK
    }

    static roleManager(room: Room, creepsOfRole: string[]) {
        // Loop through the names of the creeps of the role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: Scout = Game.creeps[creepName]

            // Don't provide notifications for attacked scouts

            if (creep.ticksToLive === CREEP_LIFE_TIME - 1) creep.notifyWhenAttacked(false)

            // If the creep is in the scoutTarget

            if (creep.memory[CreepMemoryKeys.scoutTarget] === room.name) {
                creep.message = '👁️'

                // Get information about the room

                room.advancedScout(creep.commune)

                // Clean the room's memory

                cleanRoomMemory(room.name)

                // And delete the creep's scoutTarget

                delete creep.memory[CreepMemoryKeys.scoutTarget]
            }

            // If there is no scoutTarget, find one

            if (!creep.findScoutTarget()) return

            // Say the scoutTarget

            creep.message = `🔭${creep.memory[CreepMemoryKeys.scoutTarget].toString()}`

            if (!creep.advancedSignController()) continue

            creep.memory[CreepMemoryKeys.signTarget] = creep.memory[CreepMemoryKeys.scoutTarget]

            // Try to go to the scoutTarget

            if (
                creep.createMoveRequest({
                    origin: creep.pos,
                    goals: [
                        {
                            pos: new RoomPosition(25, 25, creep.memory[CreepMemoryKeys.scoutTarget]),
                            range: 25,
                        },
                    ],
                    avoidEnemyRanges: true,
                    plainCost: 1,
                    swampCost: 1,
                }) === 'unpathable'
            ) {
                let roomMemory: Partial<RoomMemory> = Memory.rooms[creep.memory[CreepMemoryKeys.scoutTarget]]
                if (!roomMemory)
                    roomMemory = (Memory.rooms[creep.memory[CreepMemoryKeys.scoutTarget]] as Partial<RoomMemory>) = {}

                roomMemory[RoomMemoryKeys.type] = RoomTypes.neutral
                roomMemory[RoomMemoryKeys.lastScout] = Game.time

                delete creep.memory[CreepMemoryKeys.scoutTarget]
            }
        }
    }
}
