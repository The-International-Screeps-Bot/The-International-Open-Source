import { ClaimRequestNeeds } from 'international/constants'
import { findObjectWithID, getRange, unpackAsPos } from 'international/generalFunctions'

export class Vanguard extends Creep {
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
            goal: {
                pos: new RoomPosition(harvestPos.x, harvestPos.y, room.name),
                range: 0,
            },
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
            // Define the creep's sourceName

            if (!this.findOptimalSourceName()) return

            const sourceIndex = this.memory.SI

            // Try to move to source. If creep moved then iterate

            if (this.travelToSource(sourceIndex)) return

            // Try to normally harvest. Iterate if creep harvested

            if (this.advancedHarvestSource(room.sources[sourceIndex])) return
            return
        }

        this.advancedBuildCSite()
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static vanguardManager(room: Room, creepsOfRole: string[]) {
        // Loop through the names of the creeps of the role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: Vanguard = Game.creeps[creepName]

            const claimTarget = Memory.rooms[creep.commune].claimRequest

            // If the creep has no claim target, stop

            if (!claimTarget) return

            Memory.claimRequests[Memory.rooms[creep.commune].claimRequest].needs[ClaimRequestNeeds.vanguard] -=
                creep.parts.work

            creep.say(claimTarget)

            if (room.name === claimTarget) {
                creep.buildRoom()
                continue
            }

            // Otherwise if the creep is not in the claimTarget

            // Move to it

            creep.createMoveRequest({
                origin: creep.pos,
                goal: { pos: new RoomPosition(25, 25, claimTarget), range: 25 },
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
