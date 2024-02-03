// import { Command } from '../collectivizer'

/**
 * Represents the segment data for simpleAllies.
 */
export interface SimpleAlliesSegment {
  econ?: EconInfo
  requests: AllyRequests
  updated: number
  // commands: Command[]
}

/**
 * Represents the collection of ally requests.
 */
export interface AllyRequests {
  resource: ResourceRequest[]
  defense: DefenseRequest[]
  attack: AttackRequest[]
  player: PlayerRequest[]
  work: WorkRequest[]
  funnel: FunnelRequest[]
  room: RoomRequest[]
}

/**
 * Represents the goal type for a funnel request.
 */
export const enum FunnelGoal {
  GCL = 0,
  RCL7 = 1,
  RCL8 = 2,
}

/**
 * Represents the type of work needed in a work request.
 */
export const enum WorkType {
  BUILD = 'build',
  REPAIR = 'repair',
}

/**
 * Request resource
 */
export interface ResourceRequest {
  /**
   * The name of the room where the resource is needed.
   */
  roomName: string
  /**
   * The type of resource needed.
   */
  resourceType: ResourceConstant
  /**
   * The amount of the resource needed.
   */
  amount: number
  /**
   * The priority of the resource request, ranging from 0 to 1 where 1 is the highest consideration.
   */
  priority: number
  /**
   * If set to false, allies can haul resources to us.
   */
  terminal?: boolean
  /**
   * Tick after which the request should be ignored.
   */
  timeout?: number
}

/**
 * Request help in defending a room
 */
export interface DefenseRequest {
  /**
   * The name of the room where the defense is needed.
   */
  roomName: string
  /**
   * The priority of the defense request, ranging from 0 to 1 where 1 is the highest consideration.
   */
  priority: number
  /**
   * Tick after which the request should be ignored.
   */
  timeout?: number
}

/**
 * Request an attack on a specific room
 */
export interface AttackRequest {
  /**
   * The name of the room where the attack is needed.
   */
  roomName: string
  /**
   * The priority of the attack request, ranging from 0 to 1 where 1 is the highest consideration.
   */
  priority: number
  /**
   * Tick after which the request should be ignored.
   */
  timeout?: number
}

/**
 * Influence allies aggresion score towards a player
 */
export interface PlayerRequest {
  /**
   * The name of the player.
   */
  playerName: string
  /**
   * The level of hatred towards the player, ranging from 0 to 1 where 1 is the highest consideration.
   * This value affects combat aggression and targeting.
   */
  hate?: number
  /**
   * The last time this player has attacked you.
   */
  lastAttackedBy?: number
  /**
   * Tick after which the request should be ignored.
   */
  timeout?: number
}

/**
 * Request help in building/fortifying a room
 */
export interface WorkRequest {
  /**
   * The name of the room where the work is needed.
   */
  roomName: string
  /**
   * The priority of the work request, ranging from 0 to 1 where 1 is the highest consideration.
   */
  priority: number
  /**
   * The type of work needed.
   */
  workType: WorkType
  /**
   * Tick after which the request should be ignored.
   */
  timeout?: number
}

/**
 * Request energy to a room for a purpose of making upgrading faster.
 */
export interface FunnelRequest {
  /**
   * The amount of energy needed. Should be equal to the energy that needs to be put into the controller for achieving the goal.
   */
  maxAmount: number
  /**
   * The type of goal that the energy will be spent on. The room receiving energy should focus solely on achieving this goal.
   */
  goalType: FunnelGoal
  /**
   * The name of the room to which the energy should be sent. If undefined, resources can be sent to any of the requesting player's rooms.
   */
  roomName: string
  /**
   * Tick after which the request should be ignored.
   */
  timeout?: number
}

/**
 * Share scouting data about hostile owned rooms
 */
export interface RoomRequest {
  /**
   * The name of the room.
   */
  roomName: string
  /**
   * The player who owns this room. If there is no owner, the room probably isn't worth making a request about.
   */
  playerName: string
  /**
   * The last tick when you scouted this room to acquire the data you are now sharing.
   */
  lastScout: number
  /**
   * The level of the room's controller.
   */
  rcl: number
  /**
   * The amount of stored energy the room has. The sum of storage, terminal, and factory should be sufficient.
   */
  energy: number
  /**
   * The number of towers in the room.
   */
  towers: number
  /**
   * Indicates whether the room has a terminal.
   */
  terminal: boolean
  /**
   * The average rampart hits in the room.
   */
  avgRamprtHits?: number
  /**
   * Tick after which the request should be ignored.
   */
  timeout?: number
}

/**
 * Share how your bot is doing economically
 */
export interface EconInfo {
  /**
   * The total credits the bot has. Should be 0 if there is no market on the server.
   */
  credits?: number
  /**
   * The amount of energy in storage that the bot is willing to share with allies.
   */
  sharableEnergy?: number
  /**
   * The average energy income the bot has calculated over the last 100 ticks.
   */
  energyIncome?: number
  /**
   * The number of mineral nodes the bot has access to, probably used to inform expansion.
   */
  mineralNodes?: { [mineral in MineralConstant]?: number }
}
