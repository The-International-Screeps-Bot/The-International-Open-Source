export function spawnReqs(room: Room) {

    //

    const minCreeps: {[key: string]: any} = {}

    // Find energy structures

    const energyStructures = findEnergyStructures()

    function findEnergyStructures() {

        // Get array of extensions and spawns

        let unfilteredEnergyStructures = room.find(FIND_MY_STRUCTURES, {
            filter: structure => (structure.structureType == STRUCTURE_EXTENSION
                || structure.structureType == STRUCTURE_SPAWN)
                && structure.isActive()
        })

        // Add each spawnStructures with their range to the object

        const anchorPoint = room.get("anchorPoint")

        let energyStructuresWithRanges = []

        for (let energyStructure of unfilteredEnergyStructures) {

            // Create object ideal for sorting

            let object: {[key: string]: string | number } = {
                id: energyStructure.id,
                range: energyStructure.pos.getRangeTo(anchorPoint.x, anchorPoint.y + 5)
            }

            // Add object to list

            energyStructuresWithRanges.push(object)
        }

        // Sort energyStructures by range

        let energyStructuresByClosest = energyStructuresWithRanges.sort(function(a, b) { return a.value - b.value })

        let energyStructures = []

        for (let object of energyStructuresByClosest) {

            // Add structure with id of object to energyStructures

            energyStructures.push(global.findObjectWithId(object.id))
        }

        return energyStructures
    }

    //

    let spawnEnergyAvailable = room.energyAvailable
    let spawnEnergyCapacity = room.energyCapacityAvailable

    // Configure options for spawning for each role

    interface RoleSpawningOpts {
        role: string
        body: string[]
        extraOpts: object
        tier: number
        cost: number
    }

    class RoleSpawningOpts {
        constructor(role, bodyOpts: {[key: string]: any }, memoryAdditions: object) {

            this.body = []
            this.tier = 0
            this.cost = 0

            let maxCost = spawnEnergyCapacity

            if (Object.keys(room.myCreeps.harvester).length == 0 || Object.keys(room.myCreeps.hauler).length == 0) {

                maxCost = spawnEnergyAvailable
            }

            if (bodyOpts.defaultParts.length > 0) {

                for (let part of bodyOpts.defaultParts) {

                    // Stop loop if cost is more than or equal to maxCost

                    if (this.cost >= maxCost) break

                    this.body.push(part)
                    this.cost += BODYPART_COST[part]
                }

                this.tier += 1
            }

            // Stop if the body amount is equal to maxParts or the cost of the creep is more than we can afford

            while (this.body.length != bodyOpts.maxParts && this.cost < maxCost) {

            // Loop through each part in extraParts

            for (let part of bodyOpts.extraParts) {

                // Stop function if role's body is the size of maxParts

                if (this.body.length == bodyOpts.maxParts) return

                // Add part and cost

                this.body.push(part)
                this.cost += BODYPART_COST[part]
            }}

            this.tier += 1

            // So long as cost is more than maxCost

            while (this.cost > maxCost) {

                // Take away the last part

                this.body.slice(0, this.body.length - 1)
            }

            // Construct memory

            let memory = {
                role: role,
                roomFrom: room,
            }

            // Add additions to memory

            for (let propertyName in memoryAdditions) {

                memory[propertyName] = memoryAdditions[propertyName]
            }

            this.extraOpts = {
                memory: memory,
                energyStructures: energyStructures,
            }
        }
    }

    // Config creep body opts

    interface BodyOpts {
        defaultParts: string[]
        extraParts: string[]
        maxParts: number
    }

    class BodyOpts {
        constructor() {

            this.defaultParts = []
            this.extraParts = []
            this.maxParts = 50
        }
    }

    let source1HarvestPositionsAmount = room.get("source1HarvestPositions").positions.length
    let source2HarvestPositionsAmount = room.get("source2HarvestPositions").positions.length

    class HarvesterBodyOpts extends BodyOpts {
        constructor() {

            super()

            if (spawnEnergyCapacity >= 700) {

                this.defaultParts = []
                this.extraParts = [WORK, WORK, WORK, MOVE]
                this.maxParts = 8

                minCreeps.harvester = minCreeps["harvester"] = 2

                return
            }
            if (spawnEnergyCapacity >= 300) {

                this.defaultParts = []
                this.extraParts = [WORK]
                this.maxParts = 6

                minCreeps.harvester = minCreeps["harvester"] = Math.min(source1HarvestPositionsAmount, 2) + Math.min(source2HarvestPositionsAmount, 2)

                return
            }
        }
    }

    const spawningOpts = [
        new RoleSpawningOpts('harvester', new HarvesterBodyOpts(), {}),
    ]

    return spawningOpts
}
