import { ClaimRequestData } from 'international/constants'
import { findObjectWithID, getRange, getRangeOfCoords } from 'international/utils'
import { unpackCoord } from 'other/packrat'

export class Vanguard extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    preTickManager() {

        if (this.dying) return

        if (this.memory.SI !== undefined) this.room.creepsOfSourceAmount[this.memory.SI] += 1

        const request = Memory.claimRequests[this.memory.TRN]
        if (!request) return

        request.data[ClaimRequestData.vanguard] -=
            this.parts.work
    }

    /**
     *
     */
    travelToSource?(sourceIndex: number): boolean {
        const { room } = this

        this.say('🚬')

        const harvestPos = this.findSourcePos(this.memory.SI)
        if (!harvestPos) return true

        // If the creep is at the creep's packedHarvestPos, inform false

        if (getRangeOfCoords(this.pos, harvestPos) === 0) return false

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

    static vanguardManager(room: Room, creepsOfRole: string[]) {
        // Loop through the names of the creeps of the role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: Vanguard = Game.creeps[creepName]

            creep.say(creep.memory.TRN)

            if (room.name === creep.memory.TRN || !creep.memory.TRN) {
                if (creep.needsResources()) {
                    // Define the creep's sourceName

                    if (!creep.findOptimalSourceIndex()) continue

                    const sourceIndex = creep.memory.SI

                    // Try to move to source. If creep moved then iterate

                    if (creep.travelToSource(sourceIndex)) continue

                    // Try to normally harvest. Iterate if creep harvested

                    if (creep.advancedHarvestSource(room.sources[sourceIndex])) continue
                    continue
                }

                delete creep.memory.SI
                delete creep.memory.PC

                if (creep.upgradeRoom()) continue
                if (creep.repairRampart()) continue
                if (creep.advancedBuildCSite()) continue
                continue
            }

            // Otherwise if the creep is not in the claimTarget

            if (
                creep.createMoveRequest({
                    origin: creep.pos,
                    goals: [{ pos: new RoomPosition(25, 25, creep.memory.TRN), range: 25 }],
                    avoidEnemyRanges: true,
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
