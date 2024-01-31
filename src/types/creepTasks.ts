import { CreepPowerTaskKeys, CreepTaskKeys, CreepTaskNames } from '../constants/general'

export type CreepTaskTargets = Structure | Creep | Tombstone | Ruin | Resource

export interface CreepTask {
  [CreepTaskKeys.taskName]: CreepTaskNames
  [CreepTaskKeys.target]?: Id<CreepTaskTargets>
  [CreepTaskKeys.roomName]?: string
}

export type CreepPowerTaskTargets = Source | Creep | Structure

export interface CreepPowerTask {
  [CreepPowerTaskKeys.target]: Id<CreepPowerTaskTargets>
  [CreepPowerTaskKeys.power]: PowerConstant
  [CreepPowerTaskKeys.roomName]?: string
}

/**
 * A request for a power creep to fulfill
 */
export interface PowerRequest {
  taskID: string
  targetID: Id<CreepPowerTaskTargets>
  power: PowerConstant
  packedCoord: string
  cooldown: number
  priority: number
}
