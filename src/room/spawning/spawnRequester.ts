/**
 * Creates spawn requests for the commune
 */
export function spawnRequester(room: Room) {

    // If there is no spawn que, make one

    if (!global[room.name].spawnQueue) global[room.name].spawnQueue = {}

    //

    const spawnRequests: {[key: string]: SpawnRequest} = {}

    // Record how many creeps should be spawned for each role

    const minCreeps: Partial<Record<CreepRoles, number>> = {}

    // Get the room's extensions and spawns

    const spawnStructures: (StructureSpawn | StructureExtension)[] = room.get('structuresForSpawning')

    // Structure info about the room's spawn energy

    const spawnEnergyAvailable = room.energyAvailable
    const spawnEnergyCapacity = room.energyCapacityAvailable

    //

    class SpawnRequest {
        constructor() {


        }
    }

    function constructSpawnRequests(opts: SpawnRequestOpts) {


    }

    // Construct requests for sourceHarvesters

    constructSpawnRequests((function(): SpawnRequestOpts {

        if (spawnEnergyCapacity >= 800) {

            return {
                defaultParts: [CARRY],
                extraParts: [WORK, MOVE, WORK, WORK],
                partsMultiplier: 2,
                minCreeps: 2,
                maxCreeps: Infinity,
                minCost: 200,
                priority: room.creepsFromRoom.sourceHarvester,
                memoryAdditions: {
                    role: 'sourceHarvester',
                    getPulled: true,
                }
            }
        }
        if (spawnEnergyCapacity >= 650) {

            return {
                defaultParts: [CARRY],
                extraParts: [WORK],
                partsMultiplier: 12,
                minCreeps: 2,
                maxCreeps: Infinity,
                minCost: 250,
                priority: room.creepsFromRoom.sourceHarvester,
                memoryAdditions: {
                    role: 'sourceHarvester',
                    getPulled: true,
                }
            }
        }

        return {
            defaultParts: [],
            extraParts: [WORK],
            partsMultiplier: 12,
            minCreeps: undefined,
            maxCreeps: Math.max(2, room.get('source1HarvestPositions').length) + Math.max(2, room.get('source2HarvestPositions')),
            minCost: 200,
            priority: room.creepsFromRoom.sourceHarvester,
            memoryAdditions: {
                role: 'sourceHarvester',
                getPulled: true,
            }
        }

    })())

    return spawnRequests
}
