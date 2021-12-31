import { constants } from '../../international/constants'

import './spawnFunctions'

export function spawnRequests(room: Room) {

    // Find energy structures

    const spawnStructures: StructureSpawn | StructureExtension = room.get('structuresForSpawning')

    //

    const spawnEnergyAvailable = room.energyAvailable
    const spawnEnergyCapacity = room.energyCapacityAvailable

    // Configure options for spawning for each role

    interface BodyProps {
        body: BodyPartConstant[]
        tier: number
        cost: number
    }

    interface BodyOpts {
        defaultParts: BodyPartConstant[]
        extraParts: BodyPartConstant[]
        maxParts: number
    }

    interface SpawningObj extends Partial<BodyProps & BodyOpts> {
        role: string

        extraOpts: {[key: string]: any}
    }

    //

    function constructBody(opts: Partial<BodyOpts>): BodyProps {

        let body: BodyPartConstant[] = []
        let tier = 0
        let cost = 0

        let maxCost = spawnEnergyCapacity

        if (room.creepCount.harvester == 0 || room.creepCount.hauler == 0) {

            maxCost = spawnEnergyAvailable
        }

        if (opts.defaultParts.length > 0) {

            for (const part of opts.defaultParts) {

                // Stop loop if cost is more than or equal to maxCost

                if (cost >= maxCost) break

                body.push(part)
                cost += BODYPART_COST[part]
            }

            tier += 1
        }

        // Stop if the body amount is equal to maxParts or the cost of the creep is more than we can afford

        while (body.length != opts.maxParts && cost < maxCost) {

        // Loop through each part in extraParts

        for (const part of opts.extraParts) {

            // Stop loop if role's body is the size of maxParts

            if (body.length == opts.maxParts) break

            // Add part and cost

            body.push(part)
            cost += BODYPART_COST[part]
        }}

        tier += 1

        // So long as cost is more than maxCost

        while (cost > maxCost) {

            // Find last part and take away its cost

            const part = body[body.length - 1]
            cost -= BODYPART_COST[part]

            // Take away the last part from body

            body.splice(-1, 1)
        }

        return {
            body,
            tier,
            cost
        }
    }

    //

    const minCreeps: {[key: string]: any} = {}

    //

    const source1HarvestPositionsAmount = room.get('source1HarvestPositions').length
    const source2HarvestPositionsAmount = room.get('source2HarvestPositions').length

    // Harvester spawning opts

    function harvesterSpawningObj(): SpawningObj {

        const role = 'sourceHarvester'

        const bodyOpts: Partial<BodyOpts> = {}

        const extraOpts: {[key: string | number]: any} = {
            memory: {
                role: role,
                roomFrom: room.name,
            },
            energyStructures: spawnStructures
        }

        constructBodyOpts()

        function constructBodyOpts() {

            if (spawnEnergyCapacity >= 700) {

                bodyOpts.defaultParts = [CARRY]
                bodyOpts.extraParts = [WORK, WORK, WORK, MOVE]
                bodyOpts.maxParts = 8

                minCreeps.sourceHarvester = room.get('sources').length

                extraOpts.memory.moveType = 'travel'

                return
            }

            if (spawnEnergyCapacity >= 550) {

                bodyOpts.defaultParts = [CARRY]
                bodyOpts.extraParts = [WORK]
                bodyOpts.maxParts = 7

                minCreeps.sourceHarvester = room.get('sources').length

                extraOpts.memory.moveType = 'pull'

                return
            }

            // Default

            bodyOpts.defaultParts = []
            bodyOpts.extraParts = [WORK]
            bodyOpts.maxParts = 6

            const maxCreepsPerSource: number = 2
            minCreeps.sourceHarvester = Math.min(source1HarvestPositionsAmount, maxCreepsPerSource) + Math.min(source2HarvestPositionsAmount, maxCreepsPerSource)

            extraOpts.memory.moveType = 'pull'

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

        extraOpts.memory.sourceName = findSourceToHarvest()

        // Use previously constructed opts to produce a viable spawning body

        const {
            body,
            tier,
            cost
        } = constructBody(bodyOpts)

        // Inform information required to spawn the creep

        return {
            role,
            extraOpts,
            body,
            tier,
            cost
        }
    }

    // Construct spawning opts for each role

    const spawningObjs: Partial<Record<string, SpawningObj>> = {}

    spawningObjs.harvester = harvesterSpawningObj()

    // Construct requiredCreeps

    const requiredCreeps: {[key: string]: number} = {}

    // Loop through each role

    for (const role of constants.creepRoles) {

        // Define requiredCreeps for the role as minCreeps - existing creeps

        requiredCreeps[role] = minCreeps[role] - room.creepCount[role]
    }

    // return info on the structure of new creeps and what amount of them to spawn

    return {
        spawningObjs,
        requiredCreeps,
    }
}
