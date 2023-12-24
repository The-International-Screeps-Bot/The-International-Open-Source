import { DeepPartial } from "./utilityTypes"

export interface SpawnRequestArgs {
    type: SpawnRequestTypes
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
     * The amount of parts we want spawned at a minimum
     */
    partsQuota?: number
    /**
     * The number of times to attempt to duplicate extraParts
     */
    partsMultiplier: number
    /**
     * The absolute minimum cost the creep may be spawned with
     */
    minCostPerCreep: number
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
    creepsQuota?: number | undefined
    /**
     *
     */
    maxCreeps?: number | undefined
    /**
     * The absolute max cost a creep may be applied with
     */
    maxCostPerCreep?: number | undefined
    /**
     * The position for which the spawning creep would like to be closest too
     */
    spawnTarget?: Coord
}

export interface SpawnRequestSkeleton {
    role: CreepRoles
    priority: number
    defaultParts: number
    bodyPartCounts: { [key in PartsByPriority]: number }
}

export type BodyPartCounts = { [key in PartsByPriority]: number }

export interface SpawnRequest {
    role: CreepRoles
    priority: number
    defaultParts: number
    bodyPartCounts: { [key in PartsByPriority]: number }
    spawnTarget?: Coord
    tier: number
    cost: number
    extraOpts: SpawnOptions
}

export enum SpawnRequestTypes {
    /**
     * Spawn a set number of creeps at a set size
     */
    individualUniform,
    /**
     * Spawn enough parts to exactly fulfill the defined need, given a treshold has been passed
     */
    groupDiverse,
    /**
     * Has no above 0 threshold. If there is need for a creep, spawn the biggest one(s) we can given our max cost and need
     */
    groupUniform,
}
