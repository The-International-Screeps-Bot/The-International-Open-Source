import { CollectiveManager } from '../collective'
import { maxSegmentsOpen } from '../../constants/general'
import {
  AllyRequests,
  AttackRequest,
  DefenseRequest,
  EconInfo,
  FunnelRequest,
  PlayerRequest,
  ResourceRequest,
  RoomRequest,
  SimpleAlliesSegment,
  WorkRequest,
} from './types'

/**
 * Represents the goal type enum for javascript
 */
export const EFunnelGoal = {
  GCL: 0,
  RCL7: 1,
  RCL8: 2,
}

/**
 * Represents the goal type enum for javascript
 */
export const EWorkType = {
  BUILD: 'build',
  REPAIR: 'repair',
}

export class SimpleAllies {
  /**
   * State
   */
  private myRequests: AllyRequests = {
    resource: [],
    defense: [],
    attack: [],
    player: [],
    work: [],
    funnel: [],
    room: [],
  }
  private myEconInfo?: EconInfo
  public allySegmentData?: SimpleAlliesSegment
  public currentAlly?: string

  /**
   * To call before any requests are made or responded to. Configures some required values and gets ally requests
   */
  initRun() {
    // Reset requests
    this.myRequests = {
      resource: [],
      defense: [],
      attack: [],
      player: [],
      work: [],
      funnel: [],
      room: [],
    }

    // Reset econ info
    this.myEconInfo = undefined

    // Read ally segment data
    this.allySegmentData = this.readAllySegment()
  }

  /**
   * Try to get segment data from our current ally. If successful, assign to the instane
   */
  readAllySegment() {
    if (!global.settings.allies.length) {
      throw Error('Failed to find an ally for simpleAllies, you probably have none :(')
    }

    this.currentAlly = global.settings.allies[Game.time % global.settings.allies.length]

    // Make a request to read the data of the next ally in the list, for next tick
    const nextAllyName = global.settings.allies[(Game.time + 1) % global.settings.allies.length]
    RawMemory.setActiveForeignSegment(nextAllyName, global.settings.allySegmentID)

    // Maybe the code didn't run last tick, so we didn't set a new read segment
    if (!RawMemory.foreignSegment) return
    if (RawMemory.foreignSegment.username !== this.currentAlly) return

    // Protect from errors as we try to get ally segment data
    try {
      return JSON.parse(RawMemory.foreignSegment.data)
    } catch (err) {
      ;`[simpleAllies] Error reading ${this.currentAlly} segment ${global.settings.allySegmentID}`
    }
  }

  /**
   * To call after requests have been made, to assign requests to the next ally
   */
  endRun() {
    // Make sure we don't have too many segments open
    if (Object.keys(RawMemory.segments).length >= maxSegmentsOpen) {
      throw Error('[simpleAllies] Too many segments open')
    }

    this.allyRequestsFromMyTerminalRequests()

    const newSegmentData: SimpleAlliesSegment = {
      requests: this.myRequests as AllyRequests,
      // commands: CollectiveManager.myCommands,
      updated: Game.time,
    }

    RawMemory.segments[global.settings.allySegmentID] = JSON.stringify(newSegmentData)
    RawMemory.setPublicSegments([global.settings.allySegmentID])
  }

  /**
   * Convert unfilfilled terminal requests to ally requests, so they can respond to them. The goal is to prioritize internal sending over ally sending
   */
  private allyRequestsFromMyTerminalRequests() {
    for (const ID in CollectiveManager.terminalRequests) {
      const request = CollectiveManager.terminalRequests[ID]

      this.myRequests.resource.push({
        roomName: request.roomName,
        resourceType: request.resource,
        amount: request.amount,
        terminal: true,
        priority: request.priority,
      })
    }
  }

  // Request methods

  requestResource(args: ResourceRequest) {
    this.myRequests.resource.push(args)
  }

  requestDefense(args: DefenseRequest) {
    this.myRequests.defense.push(args)
  }

  requestAttack(args: AttackRequest) {
    this.myRequests.attack.push(args)
  }

  requestPlayer(args: PlayerRequest) {
    this.myRequests.player.push(args)
  }

  requestWork(args: WorkRequest) {
    this.myRequests.work.push(args)
  }

  requestFunnel(args: FunnelRequest) {
    this.myRequests.funnel.push(args)
  }

  requestEcon(args: EconInfo) {
    this.myEconInfo = args
  }

  requestRoom(args: RoomRequest) {
    this.myRequests.room.push(args)
  }
}

export const simpleAllies = new SimpleAllies()
