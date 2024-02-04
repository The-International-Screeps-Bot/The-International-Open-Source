import {
  CombatRequestKeys,
  DepositRequestKeys,
  HaulRequestKeys,
  NukeRequestKeys,
  WorkRequestKeys,
} from '../constants/general'

export interface WorkRequest {
  [WorkRequestKeys.claimer]?: number
  [WorkRequestKeys.vanguard]?: number
  [WorkRequestKeys.abandon]?: number
  [WorkRequestKeys.responder]?: string
  [WorkRequestKeys.priority]?: number
  [WorkRequestKeys.allyVanguard]?: number
  [WorkRequestKeys.forAlly]?: boolean
  [WorkRequestKeys.hauler]?: boolean
}

export type CombatRequestTypes = 'attack' | 'harass' | 'defend'

export interface CombatRequest {
  [CombatRequestKeys.abandon]: number
  [CombatRequestKeys.rangedAttack]: number
  [CombatRequestKeys.abandon]: number
  [CombatRequestKeys.dismantle]: number
  [CombatRequestKeys.downgrade]: number
  [CombatRequestKeys.minDamage]: number
  [CombatRequestKeys.minMeleeHeal]: number
  [CombatRequestKeys.minRangedHeal]: number
  [CombatRequestKeys.maxTowerDamage]: number
  [CombatRequestKeys.quads]: number
  [CombatRequestKeys.priority]: number
  [CombatRequestKeys.quadQuota]: number
  [CombatRequestKeys.inactionTimerMax]: number
  [CombatRequestKeys.inactionTimer]: number
  [CombatRequestKeys.maxThreat]: number
  [CombatRequestKeys.abandonments]: number
  [CombatRequestKeys.type]: CombatRequestTypes
  [CombatRequestKeys.responder]: string
  [CombatRequestKeys.dynamicSquads]: number
  [CombatRequestKeys.dynamicSquadQuota]: number
}

export interface NukeRequest {
  [NukeRequestKeys.y]: number
  [NukeRequestKeys.x]: number
  [NukeRequestKeys.responder]: string
  [NukeRequestKeys.priority]: number
}

export interface HaulRequest {
  [HaulRequestKeys.type]: 'transfer' | 'withdraw'
  [HaulRequestKeys.distance]: number
  [HaulRequestKeys.timer]: number
  [HaulRequestKeys.priority]: number
  [HaulRequestKeys.abandon]: number
  [HaulRequestKeys.responder]: string
}

export interface DepositRequest {
  [DepositRequestKeys.depositHarvester]: number
  [DepositRequestKeys.depositHauler]: number
  [DepositRequestKeys.abandon]: number
  [DepositRequestKeys.responder]: string
  [DepositRequestKeys.type]: DepositConstant
}
