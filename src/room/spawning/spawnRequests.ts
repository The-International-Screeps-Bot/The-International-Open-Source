import { constants } from '../../international/constants'

import './spawnFunctions'

export function spawnRequests(room: Room) {

    // Find energy structures

    const spawnStructures: (StructureSpawn | StructureExtension)[] = room.get('structuresForSpawning')

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

    interface ExtraOptsMemory {
        [key: string | number]: any
        role: CreepRoles
        roomFrom: string
    }

    interface ExtraOpts {
        memory: ExtraOptsMemory
        energyStructures: (StructureSpawn | StructureExtension)[]
        dryRun?: boolean
    }

    interface SpawningObj extends Partial<BodyProps & BodyOpts> {
        role: CreepRoles

        extraOpts: ExtraOpts
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

        //

        if (maxCost < 300) return {
            body,
            tier,
            cost
        }

        //

        if (opts.defaultParts.length > 0) {

            for (const part of opts.defaultParts) {

                // Stop loop if cost is more than or equal to maxCost

                if (cost >= maxCost) break

                // Add part and cost

                body.push(part)
                cost += BODYPART_COST[part]
            }

            tier++
        }

        let partIndex = 0

        // So long as body amount is less than maxParts and the cost of the creep is below maxCost

        while (body.length < opts.maxParts && cost < maxCost) {

            // Get the part based on the partIndex

            const part = opts.extraParts[partIndex]

            // Add part and cost

            body.push(part)
            cost += BODYPART_COST[part]

            // If the partIndex is at the last element of extraParts

            if (partIndex == opts.extraParts.length - 1) {

                // Reset partIndex, increment tier and iterate

                partIndex = 0
                tier++
                continue
            }

            // Otherwise incrememt partIndex

            partIndex++
        }

        // So long as cost is more than maxCost

        while (cost > maxCost) {

            // Find last part and take away its cost

            const part = body[body.length - 1]
            cost -= BODYPART_COST[part]

            // Take away the last part from body

            body.pop()
        }

        return {
            body,
            tier,
            cost
        }
    }

    // Record how many creeps should be spawned for each role

    const minCreeps: Partial<Record<CreepRoles, number>> = {}

    // Record spawning opts

    const spawningObjs: Partial<Record<CreepRoles, SpawningObj>> = {}

    // Source harvester spawning opts

    spawningObjs.sourceHarvester = sourceHarvesterSpawningObj()

    function sourceHarvesterSpawningObj(): SpawningObj {

        const role: CreepRoles = 'sourceHarvester'

        const bodyOpts: Partial<BodyOpts> = {}

        const extraOpts: ExtraOpts = {
            memory: {
                role: role,
                roomFrom: room.name,
            },
            energyStructures: spawnStructures
        }

        // Get the number of positions that are harvest positions for each source

        const source1HarvestPositionsAmount = room.get('source1HarvestPositions').length
        const source2HarvestPositionsAmount = room.get('source2HarvestPositions').length

        constructBodyOpts()

        function constructBodyOpts() {

            if (spawnEnergyCapacity >= 700) {

                bodyOpts.defaultParts = [CARRY]
                bodyOpts.extraParts = [WORK, WORK, MOVE, WORK]
                bodyOpts.maxParts = 8

                minCreeps.sourceHarvester = room.get('sources').length

                return
            }

            if (spawnEnergyCapacity >= 550) {

                bodyOpts.defaultParts = [CARRY]
                bodyOpts.extraParts = [WORK]
                bodyOpts.maxParts = 7

                minCreeps.sourceHarvester = room.get('sources').length

                extraOpts.memory.getPulled = true

                return
            }

            // Default

            bodyOpts.defaultParts = []
            bodyOpts.extraParts = [WORK]
            bodyOpts.maxParts = 6

            const maxCreepsPerSource: number = 2
            minCreeps.sourceHarvester = Math.min(source1HarvestPositionsAmount, maxCreepsPerSource) + Math.min(source2HarvestPositionsAmount, maxCreepsPerSource)

            extraOpts.memory.getPulled = true

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

            return false
        }
        minCreeps.sourceHarvester = 1
        // Assign ideal sourceName to creep

        const findSourceToHarvestResult = findSourceToHarvest()

        // Stop if a source to harvest couldn't be found

        if (!findSourceToHarvestResult) return undefined

        // Otherwise assign the source's name to the creep's memory sourceName

        extraOpts.memory.sourceName = findSourceToHarvestResult

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

    // Hauler spawning opts

    spawningObjs.hauler = haulerSpawningObj()

    function haulerSpawningObj(): SpawningObj {

        const role: CreepRoles = 'hauler'

        const bodyOpts: Partial<BodyOpts> = {}

        const extraOpts: ExtraOpts = {
            memory: {
                role: role,
                roomFrom: room.name,
            },
            energyStructures: spawnStructures
        }

        constructBodyOpts()

        function constructBodyOpts() {

            // Default

            bodyOpts.defaultParts = []
            bodyOpts.extraParts = [CARRY, MOVE]
            bodyOpts.maxParts = 6

            minCreeps.hauler = 4

            return
        }
        minCreeps.hauler = 2
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

    // Controller upgrader spawning opts

    spawningObjs.controllerUpgrader = controllerUpgraderSpawningObj()

    function controllerUpgraderSpawningObj(): SpawningObj {

        const role: CreepRoles = 'controllerUpgrader'

        const bodyOpts: Partial<BodyOpts> = {}

        const extraOpts: ExtraOpts = {
            memory: {
                role: role,
                roomFrom: room.name,
            },
            energyStructures: spawnStructures
        }

        constructBodyOpts()

        function constructBodyOpts() {

            if (room.get('controllerContainer')) {

                bodyOpts.defaultParts = [CARRY]
                bodyOpts.extraParts = [WORK, WORK, WORK, MOVE]
                bodyOpts.maxParts = 9

                minCreeps.controllerUpgrader = 3

                extraOpts.memory.getPulled = true

                return
            }

            // Default

            bodyOpts.defaultParts = []
            bodyOpts.extraParts = [WORK, MOVE, CARRY, MOVE]
            bodyOpts.maxParts = 4

            minCreeps.controllerUpgrader = 3

            return
        }

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

    // Construct requiredCreeps

    const requiredCreeps: Partial<Record<CreepRoles, number>> = {}

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
