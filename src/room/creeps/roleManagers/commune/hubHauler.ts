import { linkReceiveTreshold, linkSendThreshold, powerSpawnRefillThreshold } from 'international/constants'
import { findObjectWithID, getRangeOfCoords, unpackNumAsPos } from 'international/utils'

//import { HubHauler } from '../../creepClasses'

export class HubHauler extends Creep {
    travelToHub?(): boolean {
        const { room } = this

        // Get the hub, informing false if it's undefined

        const hubAnchor = unpackNumAsPos(room.memory.stampAnchors.hub[0], room.name)
        if (!hubAnchor) return true

        // Otherwise if the creep is on the hub, inform false

        if (getRangeOfCoords(this.pos, hubAnchor) === 0) return false

        // Otherwise move to the hub and inform true

        this.say('⏩H')

        this.createMoveRequest({
            origin: this.pos,
            goals: [{ pos: hubAnchor, range: 0 }],
        })

        return true
    }

    /**
     * @returns If a reservation was made or not
     */
    reserve?(): void {
        if (this.memory.Rs?.length) return

        const { room } = this
        const { storage } = room
        const { terminal } = room

        if (!storage && !terminal) return

        //Whenever we have a reservation, we should have a matching withdraw and transfer, so we should never
        // get here with anything.  If we do, it'll never be gotten rid of, so just transfer anything we have to the store
        if (this.store.getUsedCapacity() > 0) {
            const resource = Object.keys(this.store)[0] as ResourceConstant
            this.createReservation('transfer', storage.id, this.store[resource], resource)
            return
        }

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
        const factory = room.structures.factory[0]

        if (!storage || !factory) return false

        if (factory.store.energy > 3000 && storage.store.getFreeCapacity() > 3000) {
            this.createReservation('withdraw', factory.id, 3000, RESOURCE_ENERGY)
            this.createReservation('transfer', storage.id, 3000, RESOURCE_ENERGY)
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

        // If the storage is sufficiently full

        if (storage.freeStore() < this.store.getCapacity()) return false

        // If the terminal exists and isn't power disabled

        if (terminal && (!terminal.effects || !terminal.effects[PWR_DISRUPT_TERMINAL])) {
            for (const key in terminal.store) {
                const resourceType = key as ResourceConstant

                // If there is not sufficient resources to justify moving

                if (terminal.store[resourceType] < this.store.getCapacity()) continue

                // If the terminal is sufficiently balanced compared to the storage

                if (terminal.store[resourceType] < storage.store[resourceType] * 0.3 + this.store.getCapacity())
                    continue

                this.message += 'RST'

                let amount = this.freeStore()

                this.createReservation('withdraw', terminal.id, amount, resourceType)
                this.createReservation('transfer', storage.id, amount + this.store[resourceType], resourceType)
                return true
            }
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

        if (!storage || !terminal) return false

        // If the terminal is sufficiently full

        if (terminal.freeStore() < this.store.getCapacity()) return false

        if (storage) {
            for (const key in storage.store) {
                const resourceType = key as ResourceConstant

                // If there is not sufficient resources to justify moving

                if (storage.store[resourceType] < this.store.getCapacity()) continue

                // If the storage is sufficiently balanced compared to the storage

                if (storage.store[resourceType] * 0.3 < terminal.store[resourceType] + this.store.getCapacity())
                    continue

                this.message += 'RTT'

                let amount = this.freeStore()

                this.createReservation('withdraw', storage.id, amount, resourceType)
                this.createReservation('transfer', terminal.id, amount + this.store[resourceType], resourceType)
                return true
            }
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

        const { controllerLink } = room
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
        if (terminal && terminal.freeStore() > this.store.getCapacity()) target = terminal
        else if (storage && storage.freeStore() > this.store.getCapacity()) target = storage

        if (!target) return false

        this.message += 'RHLW'

        let amount = Math.min(this.freeStore(), hubLink.store.getUsedCapacity(RESOURCE_ENERGY))

        this.createReservation('withdraw', hubLink.id, amount)
        this.createReservation('transfer', target.id, amount + this.store.energy)
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

        if (hubLink.cooldown > 6) return false

        // If there is unsufficient space to justify a fill

        if (hubLink.store.getCapacity(RESOURCE_ENERGY) * linkSendThreshold < hubLink.store.energy) return false

        const { controllerLink } = room
        const { fastFillerLink } = room

        // If a link is less than x% full

        if (
            (!fastFillerLink ||
                fastFillerLink.store.getCapacity(RESOURCE_ENERGY) * linkReceiveTreshold <
                    fastFillerLink.store.energy) &&
            (!controllerLink ||
                controllerLink.store.getCapacity(RESOURCE_ENERGY) *
                    (linkReceiveTreshold * (room.myCreeps.controllerUpgrader.length ? 2 : 1)) <
                    controllerLink.store.energy)
        )
            return false

        const amount = Math.min(this.freeStore(), hubLink.store.getFreeCapacity(RESOURCE_ENERGY))

        // Find a provider

        const provider = room.highestWeightedStoringStructures(RESOURCE_ENERGY)
        if (!provider) return false

        this.message += 'RHLT'

        this.createReservation('withdraw', provider.id, amount)
        this.createReservation(
            'transfer',
            hubLink.id,
            Math.min(this.freeStore() + this.store.energy, hubLink.store.getFreeCapacity(RESOURCE_ENERGY)),
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

        const factory = room.structures.factory[0]
        if (!factory) return false

        for (let resource in factory.store) {
            //if it's needed for production, we need it.
            if (
                room.memory.factoryUsableResources.includes(
                    resource as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY,
                )
            )
                continue

            //Batteries are handled elsewhere in the code.
            if (resource == RESOURCE_BATTERY) continue

            //We don't want to remove the output if there's less then a full creep's worth.
            if (resource == room.memory.factoryProduct && factory.store[resource] < this.freeStore()) continue

            //I'm favoring the terminal here because it's likely going to get sold, or shipped out in late game.
            let target
            if (terminal && terminal.freeStore() > this.store.getCapacity()) target = terminal
            else if (storage && storage.freeStore() > this.store.getCapacity()) target = storage
            if (!target) return false

            let amount = Math.min(
                this.freeStore(),
                target.freeStore(),
                factory.store[resource as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY],
            )

            this.createReservation(
                'withdraw',
                factory.id,
                amount,
                resource as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY,
            )
            this.createReservation(
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
        if (terminal && terminal.freeStore() > this.store.getCapacity()) target = terminal
        else if (storage && storage.freeStore() > this.store.getCapacity()) target = storage

        if (!target) return false

        this.message += 'RFW'

        let amount = this.freeStore()

        this.createReservation('withdraw', factory.id, amount, RESOURCE_BATTERY)
        this.createReservation('transfer', target.id, amount + this.store.battery, RESOURCE_BATTERY)
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

        const factory = room.structures.factory[0]
        if (!factory) return false

        // If there is not enough free store in the factory

        if (factory.freeStore() < this.store.getCapacity()) return false

        if (room.memory.factoryProduct && room.memory.factoryUsableResources) {
            for (let resource of room.memory.factoryUsableResources) {

                //If there's enough of the component, for now it's just checking for 1000, but 1000 of a T3 resource is a lot, 1000 of a mineral isn't much...

                if (factory.store[resource] >= 1000) continue

                let provider
                if (terminal && terminal.store[resource] > 0) provider = terminal
                else if (storage && storage.store[resource] > 0) provider = storage
                if (!provider) continue

                const amount = Math.min(this.freeStore(), provider.store[resource], 2000 - factory.store[resource])
                if (amount <= 0) continue

                // Make sure we aren't using vital energy

                if (resource === RESOURCE_ENERGY && room.resourcesInStoringStructures.energy < room.communeManager.minStoredEnergy) continue

                this.createReservation('withdraw', provider.id, amount, resource)
                this.createReservation('transfer', factory.id, amount + this.store[resource], resource)
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

        let amount = this.freeStore()

        this.createReservation('withdraw', provider.id, amount)
        this.createReservation('transfer', factory.id, amount + this.store.energy)
        return true
         */
    }

    /**
     * @returns If a reservation was made or not
     */
    reservePowerSpawnTransferPower?(): boolean {
        const { room } = this
        const powerSpawn = room.structures.powerSpawn[0]
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

        const amount = Math.min(this.freeStore(), powerSpawn.freeSpecificStore(resource))

        // Find a provider

        const provider = room.highestWeightedStoringStructures(RESOURCE_ENERGY)
        if (!provider) return false

        this.message += 'RPSTP'

        this.createReservation('withdraw', provider.id, amount, resource)
        this.createReservation(
            'transfer',
            powerSpawn.id,
            Math.min(this.freeStore() + this.store[resource], powerSpawn.freeSpecificStore(resource)),
            resource,
        )
        return true
    }

    /**
     * @returns If a reservation was made or not
     */
    reservePowerSpawnTransferEnergy?(): boolean {
        const { room } = this
        const powerSpawn = room.structures.powerSpawn[0]
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

        const amount = Math.min(this.freeStore(), powerSpawn.freeSpecificStore(resource))

        // Find a provider

        const provider = room.highestWeightedStoringStructures(RESOURCE_ENERGY)
        if (!provider) return false

        this.message += 'RPSTE'

        this.createReservation('withdraw', provider.id, amount, resource)
        this.createReservation(
            'transfer',
            powerSpawn.id,
            Math.min(this.freeStore() + this.store[resource], powerSpawn.freeSpecificStore(resource)),
            resource,
        )
        return true
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    public static hubHaulerManager(room: Room, creepsOfRole: string[]) {
        for (const creepName of creepsOfRole) {
            const creep: HubHauler = Game.creeps[creepName]

            // Try to travel to the hub, iterate if there was movement

            if (creep.travelToHub()) continue

            // If the creep has no reservations but is full

            if ((!creep.memory.Rs || !creep.memory.Rs.length) && creep.freeStore() === 0) {
                for (const key in creep.store) {
                    const resourceType = key as ResourceConstant

                    creep.drop(resourceType)
                    break
                }

                continue
            }

            creep.reserve()

            if (!creep.fulfillReservation()) {
                creep.say(creep.message)
                continue
            }

            creep.reserve()

            if (!creep.fulfillReservation()) {
                creep.say(creep.message)
                continue
            }

            creep.say(creep.message)

            /*
            // Try balancing storing structures, iterating if there were resources moved

            if (creep.balanceStoringStructures()) continue

            // Try filling the hubLink, iterating if there were resources moved

            if (creep.fillHubLink()) continue
     */
            creep.say('🚬')
        }
    }
}
