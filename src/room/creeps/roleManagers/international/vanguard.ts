import { ClaimRequestData } from 'international/constants'
import { findObjectWithID, getRange, getRangeOfCoords } from 'international/utils'
import { unpackCoord } from 'other/codec'

export class Vanguard extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    preTickManager() {
        if (this.dying) return

        if (this.memory.SI !== undefined) this.room.creepsOfSource[this.memory.SI].push(this.name)

        const request = Memory.claimRequests[this.memory.TRN]
        if (!request) return

        request.data[ClaimRequestData.vanguard] -= this.parts.work
    }

    /**
     *
     */
    travelToSource?(sourceIndex: number): boolean {
        const { room } = this

        this.message = '🚬'

        const harvestPos = this.findSourcePos(this.memory.SI)
        if (!harvestPos) return true

        // If the creep is at the creep's packedHarvestPos, inform false

        if (getRangeOfCoords(this.pos, harvestPos) === 0) return false

        // Otherwise say the intention and create a moveRequest to the creep's harvestPos, and inform the attempt

        this.message = `⏩ ${sourceIndex}`

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

    upgradeRoom?() {
        const { controller } = this.room

        if (controller.level >= 2 && controller.ticksToDowngrade > 5000) return false

        if (getRangeOfCoords(this.pos, controller.pos) > 3) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: controller.pos, range: 3 }],
            })

            return true
        }

        this.upgradeController(controller)
        return true
    }

    repairRampart?() {
        if (this.room.cSites.rampart.length) {
            const cSite = this.room.cSites.rampart[0]

            if (getRangeOfCoords(this.pos, cSite.pos) > 3) {
                this.createMoveRequest({
                    origin: this.pos,
                    goals: [{ pos: cSite.pos, range: 3 }],
                })

                return true
            }

            this.build(cSite)
            return true
        }

        const rampartTarget = this.room.structures.rampart.find(rampart => rampart.hits < 20000)
        if (!rampartTarget) return false

        if (getRangeOfCoords(this.pos, rampartTarget.pos) > 3) {
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: rampartTarget.pos, range: 3 }],
            })

            return true
        }

        this.repair(rampartTarget)
        return true
    }

    run?() {
        this.message = this.memory.TRN

        if (this.room.name === this.memory.TRN || !this.memory.TRN) {
            if (this.needsResources()) {
                // Define the creep's sourceName

                if (!this.findOptimalSourceIndex()) return

                const sourceIndex = this.memory.SI

                // Try to move to source. If creep moved then iterate

                if (this.travelToSource(sourceIndex)) return

                // Try to normally harvest. Iterate if creep harvested

                if (this.advancedHarvestSource(this.room.sources[sourceIndex])) return
                return
            }

            delete this.memory.SI
            delete this.memory.PC

            if (this.upgradeRoom()) return
            if (this.repairRampart()) return
            if (this.room.cSiteTarget && this.advancedBuildCSite(this.room.cSiteTarget)) return
            return
        }

        // Otherwise if the creep is not in the claimTarget

        if (
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: new RoomPosition(25, 25, this.memory.TRN), range: 25 }],
                avoidEnemyRanges: true,
                typeWeights: {
                    enemy: Infinity,
                    ally: Infinity,
                    keeper: Infinity,
                },
            }) === 'unpathable'
        ) {
            const request = Memory.claimRequests[this.memory.TRN]
            if (request) request.data[ClaimRequestData.abandon] = 20000
        }
    }

    static vanguardManager(room: Room, creepsOfRole: string[]) {
        // Loop through the names of the creeps of the role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: Vanguard = Game.creeps[creepName]
            creep.run()
        }
    }
}
