import { ClaimRequestData } from 'international/constants'

export class Claimer extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    preTickManager() {
        if (this.dying) return

        const request = Memory.claimRequests[this.memory.TRN]
        if (!request) return

        request.data[ClaimRequestData.claimer] -= 1
    }

    /**
     * Claims a room specified in the creep's commune claimRequest
     */
    claimRoom?(): void {
        const creep = this
        const { room } = creep

        if (room.controller.my) return

        // If the creep is not in range to claim the controller

        if (creep.pos.getRangeTo(room.controller) > 1) {
            // Move to the controller and stop

            creep.createMoveRequest({
                origin: creep.pos,
                goals: [{ pos: room.controller.pos, range: 1 }],
                avoidEnemyRanges: true,
                plainCost: 1,
                swampCost: creep.parts.move >= 5 ? 1 : undefined,
            })

            return
        }

        // If the owner or reserver isn't me

        if (
            room.controller.owner ||
            (room.controller.reservation && room.controller.reservation.username !== Memory.me)
        ) {
            creep.attackController(room.controller)
            return
        }

        // Otherwise, claim the controller. If the successful, remove claimerNeed

        creep.claimController(room.controller)
    }

    static claimerManager(room: Room, creepsOfRole: string[]) {
        // Loop through the names of the creeps of the role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: Claimer = Game.creeps[creepName]

            creep.message = creep.memory.TRN

            if (room.name === creep.memory.TRN) {
                creep.claimRoom()
                continue
            }

            // Otherwise if the creep is not in the claimTarget

            if (
                creep.createMoveRequest({
                    origin: creep.pos,
                    goals: [{ pos: new RoomPosition(25, 25, creep.memory.TRN), range: 25 }],
                    avoidEnemyRanges: true,
                    plainCost: 1,
                    swampCost: creep.parts.move >= 5 ? 1 : undefined,
                    typeWeights: {
                        enemy: Infinity,
                        ally: Infinity,
                        keeper: Infinity,
                    },
                }) === 'unpathable'
            ) {
                const request = Memory.claimRequests[creep.memory.TRN]
                if (request) request.data[ClaimRequestData.abandon] = 20000
            }
        }
    }
}
