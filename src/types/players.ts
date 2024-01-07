import { PlayerRelationships } from 'international/constants'
import { PlayerMemoryKeys } from 'international/constants'

export interface PlayerMemory {
  [PlayerMemoryKeys.offensiveThreat]: number
  [PlayerMemoryKeys.defensiveStrength]: number
  [PlayerMemoryKeys.hate]: number
  [PlayerMemoryKeys.lastAttackedBy]: number
  [PlayerMemoryKeys.rangeFromExitWeight]: number
  [PlayerMemoryKeys.relationship]: PlayerRelationships
  [PlayerMemoryKeys.reputation]: number
  [PlayerMemoryKeys.lastSeen]: number
}
