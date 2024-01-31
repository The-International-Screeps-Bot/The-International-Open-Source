import { PlayerRelationships } from '../constants/general'
import { PlayerMemoryKeys } from '../constants/general'

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
