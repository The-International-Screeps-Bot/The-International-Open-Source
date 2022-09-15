import { communeSigns, nonCommuneSigns } from 'international/constants'
import { findClosestCommuneName, getRange } from 'international/generalFunctions'

export class Scout extends Creep {
    /**
     * Finds a room name for the scout to target
     */
    findScoutTarget?(): boolean {
        if (this.memory.scoutTarget) return true

        const commune = this.commune

        // Construct storage of exit information

        const scoutedRooms: string[] = []
        const unscoutedRooms: string[] = []

        // Get information about the room's exits

        const exits = Game.map.describeExits(this.room.name)

        // Loop through each exit type

        for (const exitType in exits) {
            // Get the roomName using the exitType

            const roomName = exits[exitType as ExitKey]

            // Iterate if the room statuses aren't the same

            if (Game.map.getRoomStatus(roomName).status !== Game.map.getRoomStatus(this.room.name).status) continue

            // If a scout already has this room as a target

            if (commune.scoutTargets.has(roomName)) continue

            // If the room has memory and a LST

            if (Memory.rooms[roomName] && Memory.rooms[roomName].LST) {
                // Add it to scoutedRooms and iterate

                scoutedRooms.push(roomName)
                continue
            }

            // Otherwise add it to unscouted rooms

            unscoutedRooms.push(roomName)
        }

        const scoutTarget = unscoutedRooms.length
            ? unscoutedRooms.sort(
                  (a, b) =>
                      Game.map.getRoomLinearDistance(this.commune.name, a) -
                      Game.map.getRoomLinearDistance(this.commune.name, b),
              )[0]
            : scoutedRooms.sort((a, b) => Memory.rooms[a].LST - Memory.rooms[b].LST)[0]

        if (!scoutTarget) return false

        this.memory.scoutTarget = scoutTarget
        commune.scoutTargets.add(scoutTarget)

        return true
    }

    recordDeposits?(): void {
        const { room } = this

        if (room.memory.T != 'highway') return

        // Make sure the room has a commune

        if (room.memory.commune) {
            if (!global.communes.has(room.memory.commune)) {
                room.memory.commune = findClosestCommuneName(room.name)
            }
        } else {
            room.memory.commune = findClosestCommuneName(room.name)
        }

        const communeMemory = Memory.rooms[room.memory.commune]

        const deposits = room.find(FIND_DEPOSITS)

        // Filter deposits that haven't been assigned a commune and are viable

        const unAssignedDeposits = deposits.filter(function (deposit) {
            return !communeMemory.deposits[deposit.id] && deposit.lastCooldown <= 100 && deposit.ticksToDecay > 500
        })

        for (const deposit of unAssignedDeposits)
            communeMemory.deposits[deposit.id] = {
                decay: deposit.ticksToDecay,
                needs: [1, 1],
            }
    }

    /**
     * Tries to sign a room's controller depending on the situation
     */
    advancedSignController?(): boolean {
        const { room } = this

        const { controller } = room

        if (!controller) return true

        if (room.name !== this.memory.signTarget) return true

        // Construct the signMessage

        let signMessage: string

        // If the room is owned by an enemy or an ally

        if (room.memory.T === 'ally' || room.memory.T === 'enemy') return true

        if (controller.reservation && controller.reservation.username != Memory.me) return true

        // If the room is a commune

        if (room.memory.T === 'commune') {
            // If the room already has a correct sign

            if (controller.sign && communeSigns.includes(controller.sign.text)) return true

            // Otherwise assign the signMessage the commune sign

            signMessage = communeSigns[0]
        }

        // Otherwise if the room is not a commune
        else {
            // If the room already has a correct sign

            if (controller.sign && nonCommuneSigns.includes(controller.sign.text)) return true

            // And assign the message according to the index of randomSign

            signMessage = nonCommuneSigns[Math.floor(Math.random() * nonCommuneSigns.length)]
        }

        // If the controller is not in range

        if (getRange(this.pos.x, controller.pos.x, this.pos.y, controller.pos.y) > 1) {
            // Request to move to the controller and inform false

            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: room.controller.pos, range: 1 }],
                avoidEnemyRanges: true,
                plainCost: 1,
                swampCost: 1,
            })

            if (!this.moveRequest) return true

            this.say(this.moveRequest.toString())

            return false
        }

        // Otherwise Try to sign the controller, informing the result

        this.signController(room.controller, signMessage)
        return true
    }

    preTickManager() {
        if (!this.memory.scoutTarget) return

        const commune = this.commune
        if (!commune) return

        commune.scoutTargets.add(this.memory.scoutTarget)
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static scoutManager(room: Room, creepsOfRole: string[]) {
        // Loop through the names of the creeps of the role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: Scout = Game.creeps[creepName]

            // Don't provide notifications for attacked scouts

            if (creep.ticksToLive === CREEP_LIFE_TIME - 1) creep.notifyWhenAttacked(false)

            const commune = creep.commune
            if (!commune) continue

            // If the creep is in the scoutTarget

            if (creep.memory.scoutTarget === room.name) {
                creep.say('👁️')

                // Get information about the room

                room.findType(commune)

                // Clean the room's memory

                room.cleanMemory()

                // And delete the creep's scoutTarget

                delete creep.memory.scoutTarget
            }

            // If there is no scoutTarget, find one

            if (!creep.findScoutTarget()) return

            // Say the scoutTarget

            creep.say(`🔭${creep.memory.scoutTarget.toString()}`)

            if (!creep.advancedSignController()) continue

            creep.memory.signTarget = creep.memory.scoutTarget

            // Try to go to the scoutTarget

            creep.createMoveRequest({
                origin: creep.pos,
                goals: [
                    {
                        pos: new RoomPosition(25, 25, creep.memory.scoutTarget),
                        range: 25,
                    },
                ],
                avoidEnemyRanges: true,
                plainCost: 1,
                swampCost: 1,
            })
        }
    }
}
