import { ClaimRequestNeeds } from 'international/constants'

export class Claimer extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
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
                swampCost: 1,
                typeWeights: {
                    keeper: Infinity,
                },
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

            const claimTarget = Memory.rooms[creep.commune.name].claimRequest

            // If the creep has no claim target, stop

            if (!claimTarget) return

            creep.say(claimTarget)

            Memory.claimRequests[Memory.rooms[creep.commune.name].claimRequest].needs[ClaimRequestNeeds.claimer] = 0

            if (room.name === claimTarget) {
                creep.claimRoom()
                continue
            }

            // Otherwise if the creep is not in the claimTarget

            // Move to it

            creep.createMoveRequest({
                origin: creep.pos,
                goals: [{ pos: new RoomPosition(25, 25, claimTarget), range: 25 }],
                avoidEnemyRanges: true,
                swampCost: creep.parts.move >= 5 ? 1 : undefined,
                typeWeights: {
                    enemy: Infinity,
                    ally: Infinity,
                    keeper: Infinity,
                    enemyRemote: Infinity,
                    allyRemote: Infinity
                },
            })
        }
    }
}
