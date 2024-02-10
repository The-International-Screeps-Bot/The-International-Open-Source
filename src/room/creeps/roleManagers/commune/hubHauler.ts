import {
  CreepMemoryKeys,
  ReservedCoordTypes,
  Result,
  RoomLogisticsRequestTypes,
  RoomMemoryKeys,
  linkReceiveTreshold,
  linkSendThreshold,
  powerSpawnRefillThreshold,
} from '../../../../constants/general'
import { packCoord, unpackCoord } from 'other/codec'
import { CommuneUtils } from 'room/commune/communeUtils'
import { CreepOps } from 'room/creeps/creepOps'
import { findObjectWithID, getRange, unpackNumAsPos } from 'utils/utils'

//import { HubHauler } from '../../creepClasses'

export class HubHauler extends Creep {
  update() {
    const packedCoord = Memory.creeps[this.name][CreepMemoryKeys.packedCoord]
    if (packedCoord) {
      this.room.roomManager.reserveCoord(packedCoord, ReservedCoordTypes.important)
    }
  }

  findReservedCoord?() {
    const creepMemory = Memory.creeps[this.name]
    if (creepMemory[CreepMemoryKeys.packedCoord]) {
      return unpackCoord(creepMemory[CreepMemoryKeys.packedCoord])
    }

    const stampAnchors = this.room.roomManager.stampAnchors
    if (!stampAnchors) throw Error('No stampAnchors for hubHauler ' + this.room.name)

    creepMemory[CreepMemoryKeys.packedCoord] = packCoord(stampAnchors.hub[0])
    return stampAnchors.hub[0]
  }

  travelToHub?(): Result {
    const reservedCoord = this.findReservedCoord()

    // If we are at the reservedCoord
    if (getRange(this.pos, reservedCoord) === 0) return Result.success

    // Otherwise move to the reserved coord

    this.message = '⏩H'

    this.createMoveRequest({
      origin: this.pos,
      goals: [
        {
          pos: new RoomPosition(reservedCoord.x, reservedCoord.y, this.room.name),
          range: 0,
        },
      ],
    })

    return Result.action
  }

  /**
   * @returns If a reservation was made or not
   */
  createCreepRoomLogisticsRequests?(): void {
    if (this.memory[CreepMemoryKeys.roomLogisticsRequests].length) return

    const { room } = this
    const { storage } = room
    const { terminal } = room

    if (!storage && !terminal) return

    // Whenever we have a reservation, we should have a matching withdraw and transfer, so we should never
    // get here with anything.  If we do, it'll never be gotten rid of, so just transfer anything we have to the store
    /*
        if (this.store.getFreeCapacity() === 0) {
            const resource = Object.keys(this.store)[0] as ResourceConstant
            CreepProcs.createCreepRoomLogisticsRequest(this,  'transfer', (storage || terminal).id, this.store[resource], resource)
            return
        }
 */
    //Factory-overfill is at the top of this list because it can be feeding energy to the rest of the base
    // by breaking down batteries... this is the only case it should have more then 10k energy in the factory.
    if (this.factoryEnergyOverfillTransfer()) return

    //Fill the Link before the storage/terminal because the storage transfers can take a long time,
    // the link transfers are just 2 or 4 ticks long.

    if (this.reserveHubLinkTransfer()) return
    if (this.reserveHubLinkWithdraw()) return

    if (this.reserveStorageTransfer()) return
    if (this.reserveTerminalTransfer()) return

    if (this.reserveFactoryWithdraw()) return
    if (this.reserveFactoryTransfer()) return

    /* if (this.reservePowerSpawnTransferPower()) return
        if (this.reservePowerSpawnTransferEnergy()) return */
  }

  factoryEnergyOverfillTransfer?(): boolean {
    const { room } = this
    const { storage } = room
    const factory = room.roomManager.structures.factory[0]

    if (!storage || !factory) return false

    if (factory.store.energy > 3000 && storage.store.getFreeCapacity() > 3000) {
      CreepOps.createCreepRoomLogisticsRequest(
        this,
        RoomLogisticsRequestTypes.withdraw,
        factory.id,
        3000,
        RESOURCE_ENERGY,
      )
      CreepOps.createCreepRoomLogisticsRequest(
        this,
        RoomLogisticsRequestTypes.transfer,
        storage.id,
        3000,
        RESOURCE_ENERGY,
      )
      return true
    }

    return false
  }

  /**
   * @returns If a reservation was made or not
   */
  reserveStorageTransfer?(): boolean {
    const { room } = this
    const { storage } = room
    const { terminal } = room

    if (!storage) return false
    if (!terminal) return false

    // If the storage is sufficiently full
    if (storage.store.getFreeCapacity() < this.store.getCapacity()) return false

    // If the terminal exists and isn't power disabled
    if (terminal.effectsData.get(PWR_DISRUPT_TERMINAL)) return false

    for (const key in terminal.store) {
      const resourceType = key as ResourceConstant

      // If there is not sufficient resources to justify moving
      if (terminal.store[resourceType] < this.store.getCapacity()) continue

      // If the weighted storage store is more than the terminal's, stop
      if (
        storage.store[resourceType] / 3 + this.store.getCapacity() * 2 >
        terminal.store[resourceType]
      )
        continue

      this.message += 'RST ' + resourceType

      let amount = this.store.getFreeCapacity()

      CreepOps.createCreepRoomLogisticsRequest(
        this,
        RoomLogisticsRequestTypes.withdraw,
        terminal.id,
        amount,
        resourceType,
      )
      CreepOps.createCreepRoomLogisticsRequest(
        this,
        RoomLogisticsRequestTypes.transfer,
        storage.id,
        amount + this.store[resourceType],
        resourceType,
      )
      return true
    }

    return false
  }

  /**
   * storage -> terminal
   * @returns If a reservation was made or not
   */
  reserveTerminalTransfer?(): boolean {
    const { room } = this
    const { storage } = room
    const { terminal } = room

    if (!storage) return false
    if (!terminal) return false

    // If the terminal is sufficiently full
    if (terminal.store.getFreeCapacity() < this.store.getCapacity()) return false

    for (const key in storage.store) {
      const resourceType = key as ResourceConstant

      // If there is not sufficient resources to justify moving
      if (storage.store[resourceType] < this.store.getCapacity()) continue

      // If the weighted storage store is less than the terminal's, stop
      if (
        storage.store[resourceType] / 3 <
        terminal.store[resourceType] + this.store.getCapacity() * 2
      )
        continue

      this.message += 'RTT ' + resourceType

      let amount = this.store.getFreeCapacity()

      CreepOps.createCreepRoomLogisticsRequest(
        this,
        RoomLogisticsRequestTypes.withdraw,
        storage.id,
        amount,
        resourceType,
      )
      CreepOps.createCreepRoomLogisticsRequest(
        this,
        RoomLogisticsRequestTypes.transfer,
        terminal.id,
        amount + this.store[resourceType],
        resourceType,
      )
      return true
    }

    return false
  }

  /**
   * @returns If a reservation was made or not
   */
  reserveHubLinkWithdraw?(): boolean {
    const { room } = this
    const { storage } = room
    const { terminal } = room
    const hubLink = this.room.roomManager.hubLink

    if (!hubLink) return false

    // If there is unsufficient space to justify a fill

    if (hubLink.store.getCapacity(RESOURCE_ENERGY) * linkReceiveTreshold > hubLink.store.energy)
      return false

    // If the controllerLink is less than x% full

    const { controllerLink } = room.communeManager
    if (
      controllerLink &&
      controllerLink.store.getCapacity(RESOURCE_ENERGY) *
        (linkReceiveTreshold * (room.myCreepsByRole.controllerUpgrader.length ? 2 : 1)) >
        controllerLink.store.energy
    )
      return false

    // If the fastFillerLink is less than x% full

    const fastFillerLink = this.room.roomManager.fastFillerLink
    if (
      fastFillerLink &&
      fastFillerLink.store.getCapacity(RESOURCE_ENERGY) * linkReceiveTreshold >
        fastFillerLink.store.energy
    )
      return false

    // FInd a target

    let target
    if (terminal && terminal.freeNextStore > this.store.getCapacity()) target = terminal
    else if (storage && storage.freeNextStore > this.store.getCapacity()) target = storage

    if (!target) return false

    this.message += 'RHLW'

    let amount = Math.min(this.freeNextStore, hubLink.store.getUsedCapacity(RESOURCE_ENERGY))

    CreepOps.createCreepRoomLogisticsRequest(
      this,
      RoomLogisticsRequestTypes.withdraw,
      hubLink.id,
      amount,
    )
    CreepOps.createCreepRoomLogisticsRequest(
      this,
      RoomLogisticsRequestTypes.transfer,
      target.id,
      amount + this.store.energy,
    )
    return true
  }

  /**
   * @returns If a reservation was made or not
   */
  reserveHubLinkTransfer?(): boolean {
    const { room } = this

    const hubLink = this.room.roomManager.hubLink
    if (!hubLink) return false

    // If there is a sufficient cooldown (there is no point filling a link that can do nothing)
    if (hubLink.cooldown >= 6) return false

    // If there is unsufficient space to justify a fill
    if (
      hubLink.store.getCapacity(RESOURCE_ENERGY) * linkSendThreshold <
      hubLink.store.getUsedCapacity(RESOURCE_ENERGY)
    ) {
      return false
    }

    const { controllerLink } = room.communeManager
    const fastFillerLink = this.room.roomManager.fastFillerLink

    // If a link is less than x% full

    if (
      (!fastFillerLink ||
        fastFillerLink.store.getCapacity(RESOURCE_ENERGY) * linkReceiveTreshold <
          fastFillerLink.store.energy) &&
      (!controllerLink ||
        controllerLink.store.getCapacity(RESOURCE_ENERGY) * linkReceiveTreshold +
          this.room.communeManager.upgradeStrength * 2 <
          controllerLink.store.energy)
    )
      return false

    const amount = Math.min(
      this.store.getFreeCapacity(),
      hubLink.store.getFreeCapacity(RESOURCE_ENERGY),
    )

    // Find a provider

    const provider = room.highestWeightedStoringStructures(RESOURCE_ENERGY)
    if (!provider) return false

    this.message += 'RHLT'

    CreepOps.createCreepRoomLogisticsRequest(
      this,
      RoomLogisticsRequestTypes.withdraw,
      provider.id,
      amount,
    )
    CreepOps.createCreepRoomLogisticsRequest(
      this,
      RoomLogisticsRequestTypes.transfer,
      hubLink.id,
      Math.min(
        this.freeNextStore + this.store.getUsedCapacity(RESOURCE_ENERGY),
        hubLink.store.getFreeCapacity(RESOURCE_ENERGY),
      ),
    )
    return true
  }
  /**
   * @returns If a reservation was made or not
   */
  reserveFactoryWithdraw?(): boolean {
    const { room } = this
    const { storage } = room
    const { terminal } = room

    const factory = room.roomManager.structures.factory[0]
    if (!factory) return false

    for (let resource in factory.store) {
      //if it's needed for production, we need it.
      if (
        room.memory[RoomMemoryKeys.factoryUsableResources].includes(
          resource as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY,
        )
      )
        continue

      //Batteries are handled elsewhere in the code.
      if (resource == RESOURCE_BATTERY) continue

      //We don't want to remove the output if there's less then a full creep's worth.
      if (
        resource == room.memory[RoomMemoryKeys.factoryProduct] &&
        factory.store[resource] < this.freeNextStore
      )
        continue

      //I'm favoring the terminal here because it's likely going to get sold, or shipped out in late game.
      let target
      if (terminal && terminal.freeNextStore > this.store.getCapacity()) target = terminal
      else if (storage && storage.freeNextStore > this.store.getCapacity()) target = storage
      if (!target) return false

      let amount = Math.min(
        this.freeNextStore,
        target.freeNextStore,
        factory.store[
          resource as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY
        ],
      )

      CreepOps.createCreepRoomLogisticsRequest(
        this,
        RoomLogisticsRequestTypes.withdraw,
        factory.id,
        amount,
        resource as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY,
      )
      CreepOps.createCreepRoomLogisticsRequest(
        this,
        RoomLogisticsRequestTypes.transfer,
        target.id,
        amount +
          this.store[
            resource as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY
          ],
        resource as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY,
      )
      return true
    }

    // If there are not enough batteries to justify a withdrawl
    if (factory.store.battery < this.store.getCapacity()) return false

    // Find a target

    let target
    if (terminal && terminal.freeNextStore > this.store.getCapacity()) target = terminal
    else if (storage && storage.freeNextStore > this.store.getCapacity()) target = storage

    if (!target) return false

    this.message += 'RFW'

    let amount = this.freeNextStore

    CreepOps.createCreepRoomLogisticsRequest(
      this,
      RoomLogisticsRequestTypes.withdraw,
      factory.id,
      amount,
      RESOURCE_BATTERY,
    )
    CreepOps.createCreepRoomLogisticsRequest(
      this,
      RoomLogisticsRequestTypes.transfer,
      target.id,
      amount + this.store.battery,
      RESOURCE_BATTERY,
    )
    return true
  }

  /**
   * @returns If a reservation was made or not
   */
  reserveFactoryTransfer?(): boolean {
    const { room } = this
    const { storage } = room
    const { terminal } = room

    if (!storage && !terminal) return false

    const factory = room.roomManager.structures.factory[0]
    if (!factory) return false

    // If there is not enough free store in the factory

    if (factory.freeNextStore < this.store.getCapacity()) return false

    if (
      room.memory[RoomMemoryKeys.factoryProduct] &&
      room.memory[RoomMemoryKeys.factoryUsableResources]
    ) {
      for (let resource of room.memory[RoomMemoryKeys.factoryUsableResources]) {
        //If there's enough of the component, for now it's just checking for 1000, but 1000 of a T3 resource is a lot, 1000 of a mineral isn't much...

        if (factory.store[resource] >= 1000) continue

        let provider
        if (terminal && terminal.store[resource] > 0) provider = terminal
        else if (storage && storage.store[resource] > 0) provider = storage
        if (!provider) continue

        const amount = Math.min(
          this.freeNextStore,
          provider.store[resource],
          2000 - factory.store[resource],
        )
        if (amount <= 0) continue

        // Make sure we aren't using vital energy

        if (
          resource === RESOURCE_ENERGY &&
          room.roomManager.resourcesInStoringStructures.energy < CommuneUtils.minStoredEnergy(room)
        )
          continue

        CreepOps.createCreepRoomLogisticsRequest(
          this,
          RoomLogisticsRequestTypes.withdraw,
          provider.id,
          amount,
          resource,
        )
        CreepOps.createCreepRoomLogisticsRequest(
          this,
          RoomLogisticsRequestTypes.transfer,
          factory.id,
          amount + this.store[resource],
          resource,
        )
        return true
      }
    }

    return false
    /*
        // If the ratio of stored batteries to energy is sufficiently high
        // 100 : 1
        if (room.roomManager.resourcesInStoringStructures.battery * 100 > room.roomManager.resourcesInStoringStructures.energy) return false

        // Find a provider

        let provider
        if (terminal && terminal.store.energy > this.store.getCapacity()) provider = terminal
        else if (storage && storage.store.energy > this.store.getCapacity()) provider = storage

        if (!provider) return false

        this.message += 'RFT'

        let amount = this.freeNextStore

        CreepProcs.createCreepRoomLogisticsRequest(this,  'withdraw', provider.id, amount)
        CreepProcs.createCreepRoomLogisticsRequest(this,  'transfer', factory.id, amount + this.store.energy)
        return true
         */
  }

  /**
   * @returns If a reservation was made or not
   */
  reservePowerSpawnTransferPower?(): boolean {
    const { room } = this
    const powerSpawn = room.roomManager.structures.powerSpawn[0]
    const resource = RESOURCE_POWER

    if (!powerSpawn) return false

    const { storage } = room
    const { terminal } = room

    if (!storage && !terminal) return false

    // If there is unsufficient space to justify a fill

    if (
      powerSpawn.store.getCapacity(resource) * powerSpawnRefillThreshold <
      powerSpawn.store.getUsedCapacity(resource)
    )
      return false

    const amount = Math.min(this.freeNextStore, powerSpawn.store.getFreeCapacity(resource))

    // Find a provider

    const provider = room.highestWeightedStoringStructures(RESOURCE_ENERGY)
    if (!provider) return false

    this.message += 'RPSTP'

    CreepOps.createCreepRoomLogisticsRequest(
      this,
      RoomLogisticsRequestTypes.withdraw,
      provider.id,
      amount,
      resource,
    )
    CreepOps.createCreepRoomLogisticsRequest(
      this,
      RoomLogisticsRequestTypes.transfer,
      powerSpawn.id,
      Math.min(
        this.freeNextStore + this.store[resource],
        powerSpawn.store.getFreeCapacity(resource),
      ),
      resource,
    )
    return true
  }

  /**
   * @returns If a reservation was made or not
   */
  reservePowerSpawnTransferEnergy?(): boolean {
    const { room } = this
    const powerSpawn = room.roomManager.structures.powerSpawn[0]
    const resource = RESOURCE_ENERGY

    if (!powerSpawn) return false
    if (!powerSpawn.store.getCapacity(RESOURCE_POWER)) return false

    const { storage } = room
    const { terminal } = room

    if (!storage && !terminal) return false

    // If there is unsufficient space to justify a fill

    if (
      powerSpawn.store.getCapacity(resource) * powerSpawnRefillThreshold <
      powerSpawn.store.getUsedCapacity(resource)
    )
      return false

    const amount = Math.min(this.freeNextStore, powerSpawn.store.getFreeCapacity(resource))

    // Find a provider

    const provider = room.highestWeightedStoringStructures(RESOURCE_ENERGY)
    if (!provider) return false

    this.message += 'RPSTE'

    CreepOps.createCreepRoomLogisticsRequest(
      this,
      RoomLogisticsRequestTypes.withdraw,
      provider.id,
      amount,
      resource,
    )
    CreepOps.createCreepRoomLogisticsRequest(
      this,
      RoomLogisticsRequestTypes.transfer,
      powerSpawn.id,
      Math.min(
        this.freeNextStore + this.store[resource],
        powerSpawn.store.getFreeCapacity(resource),
      ),
      resource,
    )
    return true
  }

  constructor(creepID: Id<Creep>) {
    super(creepID)
  }

  public static roleManager(room: Room, creepsOfRole: string[]) {
    for (const creepName of creepsOfRole) {
      const creep: HubHauler = Game.creeps[creepName]

      // Try to travel to the hub, iterate if there was movement

      if (creep.travelToHub() !== Result.success) continue

      creep.createCreepRoomLogisticsRequests()
      /*
            // If the creep has no reservations but is full

            if (!creep.memory[CreepMemoryKeys.roomLogisticsRequests].length && creep.store.getFreeCapacity() === 0) {

                for (const key in creep.store) {
                    const resourceType = key as ResourceConstant

                    creep.drop(resourceType)
                    break
                }

                continue
            }
 */
      if (!CreepOps.runRoomLogisticsRequests(creep)) continue

      creep.message += '🚬'
    }
  }
}
