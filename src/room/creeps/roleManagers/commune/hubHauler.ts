import {
    CreepMemoryKeys,
    RoomMemoryKeys,
    linkReceiveTreshold,
    linkSendThreshold,
    powerSpawnRefillThreshold,
} from 'international/constants'
import { findObjectWithID, getRange, unpackNumAsPos } from 'international/utils'

//import { HubHauler } from '../../creepClasses'

export class HubHauler extends Creep {
    travelToHub?(): boolean {
        const { room } = this

        const stampAnchors = room.roomManager.stampAnchors
        if (!stampAnchors) throw Error('No stampAnchors for hubHauler ' + room.name)

        // Otherwise if the creep is on the hub, inform false

        if (getRange(this.pos, stampAnchors.hub[0]) === 0) return false

        // Otherwise move to the hub and inform true

        this.message = '⏩H'

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: new RoomPosition(stampAnchors.hub[0].x, stampAnchors.hub[0].y, room.name), range: 0 }],
        })

        return true
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
            this.createCreepRoomLogisticsRequest('transfer', (storage || terminal).id, this.store[resource], resource)
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

        if (this.reservePowerSpawnTransferPower()) return
        if (this.reservePowerSpawnTransferEnergy()) return
    }

    factoryEnergyOverfillTransfer?(): boolean {
        const { room } = this
        const { storage } = room
        const factory = room.roomManager.structures.factory[0]

        if (!storage || !factory) return false

        if (factory.store.energy > 3000 && storage.store.getFreeCapacity() > 3000) {
            this.createCreepRoomLogisticsRequest('withdraw', factory.id, 3000, RESOURCE_ENERGY)
            this.createCreepRoomLogisticsRequest('transfer', storage.id, 3000, RESOURCE_ENERGY)
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

        if (storage.freeNextStore < this.store.getCapacity()) return false

        // If the terminal exists and isn't power disabled

        if (terminal.effectsData.get(PWR_DISRUPT_TERMINAL)) return false

        for (const key in terminal.store) {
            const resourceType = key as ResourceConstant

            // If there is not sufficient resources to justify moving

            if (terminal.store[resourceType] < this.store.getCapacity()) continue

            // If the terminal is sufficiently balanced compared to the storage

            if (terminal.store[resourceType] < storage.store[resourceType] * 0.3 + this.store.getCapacity()) continue

            this.message += 'RST ' + resourceType

            let amount = this.freeNextStore

            this.createCreepRoomLogisticsRequest('withdraw', terminal.id, amount, resourceType)
            this.createCreepRoomLogisticsRequest(
                'transfer',
                storage.id,
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
    reserveTerminalTransfer?(): boolean {
        const { room } = this
        const { storage } = room
        const { terminal } = room

        if (!storage) return false
        if (!terminal) return false

        // If the terminal is sufficiently full

        if (terminal.freeNextStore < this.store.getCapacity()) return false

        for (const key in storage.store) {
            const resourceType = key as ResourceConstant

            // If there is not sufficient resources to justify moving

            if (storage.store[resourceType] < this.store.getCapacity()) continue

            // If the storage is sufficiently balanced compared to the storage

            if (storage.store[resourceType] * 0.3 < terminal.store[resourceType] + this.store.getCapacity()) continue

            this.message += 'RTT ' + resourceType

            let amount = this.freeNextStore

            this.createCreepRoomLogisticsRequest('withdraw', storage.id, amount, resourceType)
            this.createCreepRoomLogisticsRequest(
                'transfer',
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
        const { hubLink } = room

        if (!hubLink) return false

        // If there is unsufficient space to justify a fill

        if (hubLink.store.getCapacity(RESOURCE_ENERGY) * linkReceiveTreshold > hubLink.store.energy) return false

        // If the controllerLink is less than x% full

        const { controllerLink } = room.communeManager
        if (
            controllerLink &&
            controllerLink.store.getCapacity(RESOURCE_ENERGY) *
                (linkReceiveTreshold * (room.myCreeps.controllerUpgrader.length ? 2 : 1)) >
                controllerLink.store.energy
        )
            return false

        // If the fastFillerLink is less than x% full

        const { fastFillerLink } = room
        if (
            fastFillerLink &&
            fastFillerLink.store.getCapacity(RESOURCE_ENERGY) * linkReceiveTreshold > fastFillerLink.store.energy
        )
            return false

        // FInd a target

        let target
        if (terminal && terminal.freeNextStore > this.store.getCapacity()) target = terminal
        else if (storage && storage.freeNextStore > this.store.getCapacity()) target = storage

        if (!target) return false

        this.message += 'RHLW'

        let amount = Math.min(this.freeNextStore, hubLink.store.getUsedCapacity(RESOURCE_ENERGY))

        this.createCreepRoomLogisticsRequest('withdraw', hubLink.id, amount)
        this.createCreepRoomLogisticsRequest('transfer', target.id, amount + this.store.energy)
        return true
    }

    /**
     * @returns If a reservation was made or not
     */
    reserveHubLinkTransfer?(): boolean {
        const { room } = this

        const { hubLink } = room
        if (!hubLink) return false

        // If there is a sufficient cooldown (there is no point filling a link that can do nothing)

        if (hubLink.cooldown >= 6) return false

        // If there is unsufficient space to justify a fill

        if (hubLink.store.getCapacity(RESOURCE_ENERGY) * linkSendThreshold < hubLink.store.energy) return false

        const { controllerLink } = room.communeManager
        const { fastFillerLink } = room

        // If a link is less than x% full

        if (
            (!fastFillerLink ||
                fastFillerLink.store.getCapacity(RESOURCE_ENERGY) * linkReceiveTreshold <
                    fastFillerLink.store.energy) &&
            (!controllerLink ||
                controllerLink.store.getCapacity(RESOURCE_ENERGY) * linkReceiveTreshold + room.upgradeStrength * 2 <
                    controllerLink.store.energy)
        )
            return false

        const amount = Math.min(this.freeNextStore, hubLink.store.getFreeCapacity(RESOURCE_ENERGY))

        // Find a provider

        const provider = room.highestWeightedStoringStructures(RESOURCE_ENERGY)
        if (!provider) return false

        this.message += 'RHLT'

        this.createCreepRoomLogisticsRequest('withdraw', provider.id, amount)
        this.createCreepRoomLogisticsRequest(
            'transfer',
            hubLink.id,
            Math.min(this.freeNextStore + this.store.energy, hubLink.store.getFreeCapacity(RESOURCE_ENERGY)),
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
            if (resource == room.memory[RoomMemoryKeys.factoryProduct] && factory.store[resource] < this.freeNextStore)
                continue

            //I'm favoring the terminal here because it's likely going to get sold, or shipped out in late game.
            let target
            if (terminal && terminal.freeNextStore > this.store.getCapacity()) target = terminal
            else if (storage && storage.freeNextStore > this.store.getCapacity()) target = storage
            if (!target) return false

            let amount = Math.min(
                this.freeNextStore,
                target.freeNextStore,
                factory.store[resource as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY],
            )

            this.createCreepRoomLogisticsRequest(
                'withdraw',
                factory.id,
                amount,
                resource as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY,
            )
            this.createCreepRoomLogisticsRequest(
                'transfer',
                target.id,
                amount +
                    this.store[resource as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY],
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

        this.createCreepRoomLogisticsRequest('withdraw', factory.id, amount, RESOURCE_BATTERY)
        this.createCreepRoomLogisticsRequest('transfer', target.id, amount + this.store.battery, RESOURCE_BATTERY)
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

        if (room.memory[RoomMemoryKeys.factoryProduct] && room.memory[RoomMemoryKeys.factoryUsableResources]) {
            for (let resource of room.memory[RoomMemoryKeys.factoryUsableResources]) {
                //If there's enough of the component, for now it's just checking for 1000, but 1000 of a T3 resource is a lot, 1000 of a mineral isn't much...

                if (factory.store[resource] >= 1000) continue

                let provider
                if (terminal && terminal.store[resource] > 0) provider = terminal
                else if (storage && storage.store[resource] > 0) provider = storage
                if (!provider) continue

                const amount = Math.min(this.freeNextStore, provider.store[resource], 2000 - factory.store[resource])
                if (amount <= 0) continue

                // Make sure we aren't using vital energy

                if (
                    resource === RESOURCE_ENERGY &&
                    room.resourcesInStoringStructures.energy < room.communeManager.minStoredEnergy
                )
                    continue

                this.createCreepRoomLogisticsRequest('withdraw', provider.id, amount, resource)
                this.createCreepRoomLogisticsRequest('transfer', factory.id, amount + this.store[resource], resource)
                return true
            }
        }

        return false
        /*
        // If the ratio of stored batteries to energy is sufficiently high
        // 100 : 1
        if (room.resourcesInStoringStructures.battery * 100 > room.resourcesInStoringStructures.energy) return false

        // Find a provider

        let provider
        if (terminal && terminal.store.energy > this.store.getCapacity()) provider = terminal
        else if (storage && storage.store.energy > this.store.getCapacity()) provider = storage

        if (!provider) return false

        this.message += 'RFT'

        let amount = this.freeNextStore

        this.createCreepRoomLogisticsRequest('withdraw', provider.id, amount)
        this.createCreepRoomLogisticsRequest('transfer', factory.id, amount + this.store.energy)
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

        const amount = Math.min(this.freeNextStore, powerSpawn.freeSpecificStore(resource))

        // Find a provider

        const provider = room.highestWeightedStoringStructures(RESOURCE_ENERGY)
        if (!provider) return false

        this.message += 'RPSTP'

        this.createCreepRoomLogisticsRequest('withdraw', provider.id, amount, resource)
        this.createCreepRoomLogisticsRequest(
            'transfer',
            powerSpawn.id,
            Math.min(this.freeNextStore + this.store[resource], powerSpawn.freeSpecificStore(resource)),
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

        const amount = Math.min(this.freeNextStore, powerSpawn.freeSpecificStore(resource))

        // Find a provider

        const provider = room.highestWeightedStoringStructures(RESOURCE_ENERGY)
        if (!provider) return false

        this.message += 'RPSTE'

        this.createCreepRoomLogisticsRequest('withdraw', provider.id, amount, resource)
        this.createCreepRoomLogisticsRequest(
            'transfer',
            powerSpawn.id,
            Math.min(this.freeNextStore + this.store[resource], powerSpawn.freeSpecificStore(resource)),
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

            if (creep.travelToHub()) continue

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
            if (!creep.runRoomLogisticsRequests()) continue

            creep.message += '🚬'
        }
    }
}
