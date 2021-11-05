import './spawningFunctions'

export function spawnRequests(room: Room) {

    // Find energy structures

    const spawnStructures = findSpawnStructures()

    function findSpawnStructures() {

        // Get array of spawns and extensions

        const spawnsAndExtensions: Structure<STRUCTURE_SPAWN | STRUCTURE_EXTENSION>[] = room.get('spawn').concat(room.get('extension'))

        // Filter out structures that aren't active

        const unfilteredSpawnStructures = spawnsAndExtensions.filter((structure) => structure.isActive())

        // Add each spawnStructures with their range to the object

        const anchorPoint = room.get('anchorPoint')

        // Filter energy structures by distance from anchorPoint

        const filteredSpawnStructures = unfilteredSpawnStructures.sort((a, b) => a.pos.getRangeTo(anchorPoint.x, anchorPoint.y + 5) - b.pos.getRangeTo(anchorPoint.x, anchorPoint.y + 5))
        return filteredSpawnStructures
    }

    //

    let spawnEnergyAvailable = room.energyAvailable
    let spawnEnergyCapacity = room.energyCapacityAvailable

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
        constructBody(role: string, bodyOpts: {[key: string]: BodyPartConstant | any }, memoryAdditions: {[key: string]: any}) {

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

            for (let part of this.extraParts) {

                // Stop function if role's body is the size of maxParts

                if (this.body.length == this.maxParts) return

                // Add part and cost

                this.body.push(part)
                this.cost += BODYPART_COST[part]
            }}

            this.tier += 1

            // So long as cost is more than maxCost

            while (this.cost > maxCost) {

                // Take away cost of the last part

                const part = this.body[this.body.length - 1]
                this.cost -= BODYPART_COST[part]

                // Take away the last part

                this.body.slice(0, this.body.length - 1)
            }

            // Construct memory

            const memory: {[key: string]: any} = {
                role: this.role,
                roomFrom: room,
            }

            // Add additions to memory

            let propertyName: string
            for (propertyName in this.memoryAdditions) {

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

    //

    interface HarvesterSpawningOpts extends RoleSpawningOpts {

    }

    class HarvesterSpawningOpts extends RoleSpawningOpts {
        constructor() {

            super()

            this.role = 'sourceHarvester'

            if (spawnEnergyCapacity >= 700) {

                this.defaultParts = []
                this.extraParts = [WORK, WORK, WORK, MOVE]
                this.maxParts = 8

                minCreeps.sourceHarvester = minCreeps.sourceHarvester = 2
                this.memoryAdditions.moveType = 'travel'

                return
            }
            if (spawnEnergyCapacity >= 300) {

                this.defaultParts = []
                this.extraParts = [WORK]
                this.maxParts = 6

                minCreeps.sourceHarvester = minCreeps.sourceHarvester = Math.min(source1HarvestPositionsAmount, 2) + Math.min(source2HarvestPositionsAmount, 2)
                this.memoryAdditions.moveType = 'pull'

                return
            }
        }
    }

    //

    const spawningOpts: RoleSpawningOpts[] = [
        new HarvesterSpawningOpts(),
    ]

    //

    const requiredCreeps: {[key: string]: any} = {}

    // Construct requiredCreeps

    for (const role of global.creepRoles) {

        requiredCreeps[role] = minCreeps[role] - room.creepCount[role]
    }

    //

    return {
        spawningOpts,
        requiredCreeps,
    }
}
