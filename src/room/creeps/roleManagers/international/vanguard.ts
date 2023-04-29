import { WorkRequestKeys, CreepMemoryKeys } from 'international/constants'
import { findObjectWithID, getRangeXY, getRange } from 'international/utils'
import { unpackCoord } from 'other/codec'

export class Vanguard extends Creep {
    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    preTickManager() {
        if (this.isDying()) return

        if (this.memory[CreepMemoryKeys.sourceIndex] !== undefined)
            this.room.creepsOfSource[this.memory[CreepMemoryKeys.sourceIndex]].push(this.name)

        const request = Memory.workRequests[this.memory[CreepMemoryKeys.taskRoom]]
        if (!request) return

        request[WorkRequestKeys.vanguard] -= this.parts.work
    }

    /**
     *
     */
    travelToSource?(sourceIndex: number): boolean {
        const { room } = this

        this.message = '🚬'

        const harvestPos = this.findCommuneSourceHarvestPos(this.memory[CreepMemoryKeys.sourceIndex])
        if (!harvestPos) return true

        // If the creep is at the creep's packedHarvestPos, inform false

        if (getRange(this.pos, harvestPos) === 0) return false

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

        if (getRange(this.pos, controller.pos) > 3) {
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
        if (this.room.roomManager.cSites.rampart.length) {
            const cSite = this.room.roomManager.cSites.rampart[0]

            if (getRange(this.pos, cSite.pos) > 3) {
                this.createMoveRequest({
                    origin: this.pos,
                    goals: [{ pos: cSite.pos, range: 3 }],
                })

                return true
            }

            this.build(cSite)
            return true
        }

        const rampartTarget = this.room.roomManager.structures.rampart.find(rampart => rampart.hits < 20000)
        if (!rampartTarget) return false

        if (getRange(this.pos, rampartTarget.pos) > 3) {
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
        this.message = this.memory[CreepMemoryKeys.taskRoom]

        if (this.room.name === this.memory[CreepMemoryKeys.taskRoom] || !this.memory[CreepMemoryKeys.taskRoom]) {
            if (this.needsResources()) {
                // Define the creep's sourceName

                if (!this.findCommuneSourceIndex()) return

                const sourceIndex = this.memory[CreepMemoryKeys.sourceIndex]

                // Try to move to source. If creep moved then iterate

                if (this.travelToSource(sourceIndex)) return

                // Try to normally harvest. Iterate if creep harvested

                if (this.advancedHarvestSource(this.room.roomManager.communeSources[sourceIndex])) return
                return
            }

            delete this.memory[CreepMemoryKeys.sourceIndex]
            delete this.memory[CreepMemoryKeys.packedCoord]

            if (this.upgradeRoom()) return
            if (this.repairRampart()) return
            if (this.room.roomManager.cSiteTarget && this.advancedBuildCSite(this.room.roomManager.cSiteTarget)) return
            return
        }

        // Otherwise if the creep is not in the claimTarget

        if (
            this.createMoveRequest({
                origin: this.pos,
                goals: [{ pos: new RoomPosition(25, 25, this.memory[CreepMemoryKeys.taskRoom]), range: 25 }],
                avoidEnemyRanges: true,
                typeWeights: {
                    enemy: Infinity,
                    ally: Infinity,
                    keeper: Infinity,
                },
            }) === 'unpathable'
        ) {
            const request = Memory.workRequests[this.memory[CreepMemoryKeys.taskRoom]]
            if (request) request[WorkRequestKeys.abandon] = 20000
        }
    }

    static roleManager(room: Room, creepsOfRole: string[]) {
        // Loop through the names of the creeps of the role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: Vanguard = Game.creeps[creepName]
            creep.run()
        }
    }
}
