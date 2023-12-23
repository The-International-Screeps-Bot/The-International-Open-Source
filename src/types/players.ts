import { PlayerMemoryKeys } from "international/constants"

export type PlayerRelationship = 'ally' | 'enemy'

export interface PlayerMemory {
    [PlayerMemoryKeys.offensiveThreat]: number
    [PlayerMemoryKeys.defensiveStrength]: number
    [PlayerMemoryKeys.hate]: number
    [PlayerMemoryKeys.lastAttackedBy]: number
    [PlayerMemoryKeys.rangeFromExitWeight]: number
    [PlayerMemoryKeys.relationship]: PlayerRelationship
    [PlayerMemoryKeys.reputation]: number
    [PlayerMemoryKeys.lastSeen]: number
}
