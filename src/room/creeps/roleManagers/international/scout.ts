import {
  CreepMemoryKeys,
  Result,
  RoomMemoryKeys,
  RoomTypes,
  communeSign,
  nonCommuneSigns,
} from '../../../../constants/general'
import { getRangeXY, getRange, randomOf } from 'utils/utils'
import { partial } from 'lodash'
import { RoomNameUtils } from 'room/roomNameUtils'
import { RoomOps } from 'room/roomOps'

export class Scout extends Creep {

  constructor(creepID: Id<Creep>) {
    super(creepID)
  }

  initRun() {
    if (!Memory.creeps[this.name][CreepMemoryKeys.scoutTarget]) return

    this.commune.scoutTargets.add(Memory.creeps[this.name][CreepMemoryKeys.scoutTarget])
  }

  /**
   * Finds a room name for the scout to target
   */
  findScoutTarget?(): boolean {
    const creepMemory = Memory.creeps[this.name]
    if (creepMemory[CreepMemoryKeys.scoutTarget]) return true

    const scoutTarget = this.findBestScoutTarget()
    if (!scoutTarget) return false

    this.commune.scoutTargets.add(scoutTarget)
    return true
  }

  findScoutTargets?(creepMemory: CreepMemory) {
    // Construct storage of exit information

    const scoutedRooms = []
    const unscoutedRooms = []

    // Get information about the room's exits
    const exits = Game.map.describeExits(this.room.name)

    // Loop through each adjacent room recording scouted and unscouted rooms

    for (const exitType in exits) {
      // Get the roomName using the exitType

      const roomName = exits[exitType as ExitKey]

      // If a scout already has this room as a target

      const commune = Game.rooms[creepMemory[CreepMemoryKeys.commune]]
      if (commune.scoutTargets.has(roomName)) continue

      // Iterate if the room statuses aren't the same

      const status = RoomNameUtils.getStatusForPotentialMemory(roomName)
      if (
        status !== undefined &&
        Memory.rooms[this.room.name][RoomMemoryKeys.status] !==
        status
      )
        continue

      // If the room has memory and a LST

      if (Memory.rooms[roomName] && Memory.rooms[roomName][RoomMemoryKeys.lastScout]) {
        // Add it to scoutedRooms and iterate

        scoutedRooms.push(roomName)
        continue
      }

      unscoutedRooms.push(roomName)
    }

    return {unscoutedRooms, scoutedRooms}
  }

  findBestScoutTarget?() {

    const creepMemory = Memory.creeps[this.name]
    const {unscoutedRooms, scoutedRooms} = this.findScoutTargets(creepMemory)

    // Find the closest room to the creep's commune

    if (unscoutedRooms.length) {
      let lowestRange = Infinity

      for (const roomName of unscoutedRooms) {
        const range = Game.map.getRoomLinearDistance(creepMemory[CreepMemoryKeys.commune], roomName)
        if (range >= lowestRange) continue

        lowestRange = range
        creepMemory[CreepMemoryKeys.scoutTarget] = roomName
      }

      return creepMemory[CreepMemoryKeys.scoutTarget]
    }

    // Find the room scouted longest ago

    let lowestLastScoutTick = Infinity

    for (const roomName of scoutedRooms) {
      const lastScoutTick = Memory.rooms[roomName][RoomMemoryKeys.lastScout]
      if (lastScoutTick >= lowestLastScoutTick) continue

      lowestLastScoutTick = lastScoutTick
      creepMemory[CreepMemoryKeys.scoutTarget] = roomName
    }

    return creepMemory[CreepMemoryKeys.scoutTarget]
  }

  // THIS SHOULD BE A ROOM FUNCTION BASED OFF Room.advancedScout
  /*
    recordDeposits?(): void {
        const { room } = this

        if (room.memory[RoomMemoryKeys.type] != RoomTypes.highway) return

        // Make sure the room has a commune

        if (room.memory[RoomMemoryKeys.commune]) {
            if (!CollectiveManager.communes.has(room.memory[RoomMemoryKeys.commune])) {
                room.memory[RoomMemoryKeys.commune] = findClosestCommuneName(room.name)
            }
        } else {
            room.memory[RoomMemoryKeys.commune] = findClosestCommuneName(room.name)
        }

        const communeMemory = Memory.rooms[room.memory[RoomMemoryKeys.commune]]

        const deposits = room.find(FIND_DEPOSITS)

        // Filter deposits that haven't been assigned a commune and are viable

        const unAssignedDeposits = deposits.filter(function (deposit) {
            return !communeMemory[RoomMemoryKeys.deposits][deposit.id] && deposit.lastCooldown <= 100 && deposit.ticksToDecay > 500
        })

        for (const deposit of unAssignedDeposits)
            communeMemory[RoomMemoryKeys.deposits][deposit.id] = {
                decay: deposit.ticksToDecay,
                needs: [1, 1],
            }
    }
 */
  /**
   * Tries to sign a room's controller depending on the situation
   */
  advancedSignController?(): boolean {
    const controller = this.room.controller
    if (!controller) return true

    const roomMemory = Memory.rooms[this.room.name]

    // If the room isn't a commune or our sign target, don't try to sign it
    if (Memory.creeps[this.name][CreepMemoryKeys.signTarget] !== this.room.name) {
      return true
    }

    this.message = '🔤'

    // Construct the signMessage

    let signMessage: string

    // If the room is reserved or owned by an enemy or an ally

    if (controller.owner && controller.owner.username !== Memory.me) return true
    if (controller.reservation && controller.reservation.username !== Memory.me) return true

    // If the room is a commune

    if (roomMemory[RoomMemoryKeys.type] === RoomTypes.commune) {
      // If the room already has a correct sign
      if (controller.sign && controller.sign.text === communeSign) return true

      // Otherwise assign the signMessage the commune sign
      signMessage = communeSign
    }
    // Otherwise if the room is not a commune
    else {
      // If the room already has a correct sign
      if (controller.sign && nonCommuneSigns.includes(controller.sign.text)) return true

      // And assign the message according to the index of randomSign
      signMessage = randomOf(nonCommuneSigns)
    }

    // If the controller is not in range

    if (getRange(this.pos, controller.pos) > 1) {
      // Request to move to the controller and inform false

      if (
        this.createMoveRequest({
          origin: this.pos,
          goals: [{ pos: this.room.controller.pos, range: 1 }],
          avoidEnemyRanges: true,
          plainCost: 1,
          swampCost: 1,
        }) === Result.fail
      ) {
        // The controller is ineccessible, drop the target
        delete Memory.creeps[this.name][CreepMemoryKeys.signTarget]
        return true
      }

      this.message = this.moveRequest

      return false
    }

    // Otherwise Try to sign the controller, informing the result

    return this.signController(this.room.controller, signMessage) === OK
  }

  static roleManager(room: Room, creepsOfRole: string[]) {
    // Loop through the names of the creeps of the role

    for (const creepName of creepsOfRole) {
      // Get the creep using its name

      const creep: Scout = Game.creeps[creepName]

      // Don't provide notifications for attacked scouts

      if (creep.ticksToLive === CREEP_LIFE_TIME - 1) creep.notifyWhenAttacked(false)

      const creepMemory = Memory.creeps[creepName]
      if (creepMemory[CreepMemoryKeys.scoutTarget] === room.name) {
        creep.message = '👁️'

        RoomOps.advancedScout(room, creep.commune)
        RoomNameUtils.cleanMemory(room.name)

        delete creepMemory[CreepMemoryKeys.scoutTarget]
      }

      // If there is no scoutTarget, find one

      if (!creep.findScoutTarget()) return

      // Say the scoutTarget

      creep.message = `🔭${creepMemory[CreepMemoryKeys.scoutTarget].toString()}`

      if (!creep.advancedSignController()) continue
      delete creepMemory[CreepMemoryKeys.signTarget]

      // Try to go to the scoutTarget

      if (
        creep.createMoveRequest({
          origin: creep.pos,
          goals: [
            {
              pos: new RoomPosition(25, 25, creepMemory[CreepMemoryKeys.scoutTarget]),
              range: 25,
            },
          ],
          avoidEnemyRanges: true,
          plainCost: 1,
          swampCost: 1,
        }) === Result.fail
      ) {
        let roomMemory: Partial<RoomMemory> = Memory.rooms[creepMemory[CreepMemoryKeys.scoutTarget]]
        if (!roomMemory)
          roomMemory = (Memory.rooms[
            creepMemory[CreepMemoryKeys.scoutTarget]
          ] as Partial<RoomMemory>) = {}

        roomMemory[RoomMemoryKeys.type] = RoomTypes.neutral
        roomMemory[RoomMemoryKeys.lastScout] = Game.time

        delete creepMemory[CreepMemoryKeys.scoutTarget]
      }
    }
  }
}
