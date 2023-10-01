export interface SpawnRequestArgs {
    role: CreepRoles
    /**
     * Parts that should be attempted to be implemented once
     */
    defaultParts: BodyPartConstant[]
    /**
     * Parts that should be attempted to be implemented based on the partsMultiplier
     */
    extraParts: BodyPartConstant[]
    /**
     * The number of times to attempt to duplicate extraParts
     */
    partsMultiplier: number
    /**
     * The absolute minimum cost the creep may be spawned with
     */
    minCost: number
    /**
     * The priority of spawning, where 0 is greatest, and Infinity is least
     */
    priority: number
    /**
     * Properties to apply to the creep on top of the defaults
     */
    memoryAdditions: Partial<CreepMemory>
    /**
     * The specific group of which to compare the creep amount to
     */
    spawnGroup?: string[]
    /**
     *
     */
    threshold?: number
    /**
     *
     */
    minCreeps?: number | undefined
    /**
     *
     */
    maxCreeps?: number | undefined
    /**
     * The absolute max cost a creep may be applied with
     */
    maxCostPerCreep?: number | undefined
}

export interface SpawnRequestSkeleton {
    role: CreepRoles
    priority: number
    defaultParts: number
    bodyPartCounts: { [key in PartsByPriority]: number }
}

export interface SpawnRequest {
    role: CreepRoles
    priority: number
    defaultParts: number
    bodyPartCounts: { [key in PartsByPriority]: number }
    body?: BodyPartConstant[]
    tier: number
    cost: number
    extraOpts: SpawnOptions
}
