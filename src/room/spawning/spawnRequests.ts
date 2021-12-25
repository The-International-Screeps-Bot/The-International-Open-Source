import { constants } from '../../international/constants'

import './spawnFunctions'

export function spawnRequests(room: Room) {

    // Find energy structures

    const spawnStructures = room.get('structuresForSpawning')

    //

    const spawnEnergyAvailable = room.energyAvailable
    const spawnEnergyCapacity = room.energyCapacityAvailable

    // Configure options for spawning for each role

    interface RoleSpawningOpts {
        role: string
        defaultParts: BodyPartConstant[]
        extraParts: BodyPartConstant[]
        maxParts: number
        memoryAdditions: {[key: string]: any}

        body: BodyPartConstant[]
        extraOpts: {[key: string]: any}
        tier: number
        cost: number
    }

    class RoleSpawningOpts {
        constructor() {

            this.memoryAdditions = {}

            this.defaultParts = []
            this.extraParts = []
            this.maxParts = 50
        }
        constructBody() {

            this.body = []
            this.tier = 0
            this.cost = 0

            let maxCost = spawnEnergyCapacity

            if (room.creepCount.harvester == 0 || room.creepCount.hauler == 0) {

                maxCost = spawnEnergyAvailable
            }

            if (this.defaultParts.length > 0) {

                for (const part of this.defaultParts) {

                    // Stop loop if cost is more than or equal to maxCost

                    if (this.cost >= maxCost) break

                    this.body.push(part)
                    this.cost += BODYPART_COST[part]
                }

                this.tier += 1
            }

            // Stop if the body amount is equal to maxParts or the cost of the creep is more than we can afford

            while (this.body.length != this.maxParts && this.cost < maxCost) {

            // Loop through each part in extraParts

            for (const part of this.extraParts) {

                // Stop function if role's body is the size of maxParts

                if (this.body.length == this.maxParts) return

                // Add part and cost

                this.body.push(part)
                this.cost += BODYPART_COST[part]
            }}

            this.tier += 1

            // So long as cost is more than maxCost

            while (this.cost > maxCost) {

                // Find last part and take away its cost

                const part = this.body[this.body.length - 1]
                this.cost -= BODYPART_COST[part]

                // Take away the last part from body

                this.body.splice(-1, 1)
            }

            // Construct memory

            const memory: {[key: string]: any} = {
                role: this.role,
                roomFrom: room.name,
            }

            // Add additions to memory

            for (const propertyName in this.memoryAdditions) {

                memory[propertyName] = this.memoryAdditions[propertyName]
            }

            this.extraOpts = {
                memory: memory,
                energyStructures: spawnStructures,
            }
        }
    }

    //

    const minCreeps: {[key: string]: any} = {}

    //

    const source1HarvestPositionsAmount = room.get('source1HarvestPositions').length
    const source2HarvestPositionsAmount = room.get('source2HarvestPositions').length

    // Harvester spawning opts

    class HarvesterSpawningOpts extends RoleSpawningOpts {
        constructor() {

            super()

            const opts = this

            this.role = 'sourceHarvester'

            bodyOpts()

            function bodyOpts() {

                if (spawnEnergyCapacity >= 700) {

                    opts.defaultParts = [CARRY]
                    opts.extraParts = [WORK, WORK, WORK, MOVE]
                    opts.maxParts = 8

                    minCreeps.sourceHarvester = room.get('sources').length

                    opts.memoryAdditions.moveType = 'travel'

                    return
                }

                if (spawnEnergyCapacity >= 550) {

                    opts.defaultParts = [CARRY]
                    opts.extraParts = [WORK]
                    opts.maxParts = 7

                    minCreeps.sourceHarvester = room.get('sources').length

                    opts.memoryAdditions.moveType = 'pull'

                    return
                }

                // Default

                opts.defaultParts = []
                opts.extraParts = [WORK]
                opts.maxParts = 6

                const maxCreepsPerSource: number = 2
                minCreeps.sourceHarvester = Math.min(source1HarvestPositionsAmount, maxCreepsPerSource) + Math.min(source2HarvestPositionsAmount, maxCreepsPerSource)

                opts.memoryAdditions.moveType = 'pull'

                return
            }

            function findSourceToHarvest() {

                // Structure data on sources that relates to spawning

                const spawningDataForSources: {[key: string]: any} = {
                    source1: {
                        amount: room.creepsOfSourceAmount.source1,
                        max: Math.min(source1HarvestPositionsAmount, minCreeps.sourceHarvester / 2),
                    },
                    source2: {
                        amount: room.creepsOfSourceAmount.source2,
                        max: Math.min(source2HarvestPositionsAmount, minCreeps.sourceHarvester / 2),
                    }
                }

                // Loop through each sourceName

                for (const sourceName in spawningDataForSources) {

                    const sourceData = spawningDataForSources[sourceName]

                    // Select sourceData with less creeps than max

                    if (sourceData.amount < sourceData.max) return sourceName
                }

                return 'noSourceFound'
            }

            // Assign ideal sourceName to creep

            opts.memoryAdditions.sourceName = findSourceToHarvest()

            // Use previously constructed opts to produce a viable spawning body

            this.constructBody()
        }
    }

    // Construct spawning opts for each role

    const spawningOpts: RoleSpawningOpts[] = []

    spawningOpts.push(new HarvesterSpawningOpts())

    // Construct requiredCreeps

    const requiredCreeps: {[key: string]: number} = {}

    // Loop through each role

    for (const role of constants.creepRoles) {

        // Define requiredCreeps for the role as minCreeps - existing creeps

        requiredCreeps[role] = minCreeps[role] - room.creepCount[role]
    }

    // return info on the structure of new creeps and what amount of them to spawn

    return {
        spawningOpts,
        requiredCreeps,
    }
}
