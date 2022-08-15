import { findObjectWithID, unpackAsRoomPos } from 'international/generalFunctions'
import { HubHauler } from '../../creepClasses'

export function hubHaulerManager(room: Room, creepsOfRole: string[]) {
    for (const creepName of creepsOfRole) {
        const creep: HubHauler = Game.creeps[creepName]

        // Try to travel to the hub, iterate if there was movement

        if (creep.travelToHub()) continue

        // If the creep has no reservations but is full

        if (
            (!creep.memory.reservations || !creep.memory.reservations.length) &&
            creep.freeStore(RESOURCE_ENERGY) === 0
        ) {
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

HubHauler.prototype.travelToHub = function () {
    const { room } = this

    // Get the hub, informing false if it's undefined

    const hubAnchor = unpackAsRoomPos(room.memory.stampAnchors.hub[0], room.name)
    if (!hubAnchor) return true

    // Otherwise if the creep is on the hub, inform false

    if (this.pos.getRangeTo(hubAnchor) === 0) return false

    // Otherwise move to the hub and inform true

    this.say('⏩H')

    this.createMoveRequest({
        origin: this.pos,
        goal: { pos: hubAnchor, range: 0 },
    })

    return true
}

HubHauler.prototype.reserve = function () {
    if (this.memory.reservations?.length) return

    const { room } = this
    const { storage } = room
    const { terminal } = room

    if (!storage && !terminal) return

    if (this.reserveStorageTransfer()) return
    if (this.reserveTerminalTransfer()) return
    if (this.reserverHubLinkTransfer()) return
    if (this.reserveFactoryWithdraw()) return
    if (this.reserveFactoryTransfer()) return
}

HubHauler.prototype.reserveStorageTransfer = function () {
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

            if (terminal.store[resourceType] < storage.store[resourceType] * 0.3 + this.store.getCapacity()) continue

            this.message += 'RST'

            let amount = this.freeStore()

            this.createReservation('withdraw', terminal.id, amount, resourceType)
            this.createReservation('transfer', storage.id, amount + this.store[resourceType], resourceType)
            return true
        }
    }

    return false
}

HubHauler.prototype.reserveTerminalTransfer = function () {
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

            if (storage.store[resourceType] * 0.3 < terminal.store[resourceType] + this.store.getCapacity()) continue

            this.message += 'RTT'

            let amount = this.freeStore()

            this.createReservation('withdraw', storage.id, amount, resourceType)
            this.createReservation('transfer', terminal.id, amount + this.store[resourceType], resourceType)
            return true
        }
    }

    return false
}

HubHauler.prototype.reserverHubLinkTransfer = function () {
    const { room } = this
    const { storage } = room
    const { terminal } = room
    const { hubLink } = room

    if (!hubLink) return false

    // If there is a sufficient cooldown (there is no point filling a link that can do nothing)

    if (hubLink.cooldown > 4) return false

    // If there is unsufficient space to justify a fill

    if (hubLink.store.getCapacity(RESOURCE_ENERGY) - hubLink.store.energy < 100) return false

    const amount = Math.min(this.freeStore(), hubLink.freeSpecificStore())

    // FInd a provider

    let provider
    if (storage && storage.store.energy >= amount) provider = storage
    else if (terminal && terminal.store.energy >= amount) provider = terminal

    if (!provider) return false

    this.message += 'RHT'

    this.createReservation('withdraw', provider.id, amount)
    this.createReservation(
        'transfer',
        hubLink.id,
        Math.min(this.freeStore() + this.store.energy, hubLink.freeSpecificStore()),
    )
    return true
}

HubHauler.prototype.reserveFactoryWithdraw = function () {
    const { room } = this
    const { storage } = room
    const { terminal } = room

    const factory = room.structures.factory[0]
    if (!factory) return false

    // If there are not enough batteries to justify a withdrawl

    if (factory.store.battery < this.store.getCapacity()) return false

    // Find a target

    let target
    if (storage && storage.freeStore() > this.store.getCapacity()) target = storage
    else if (terminal && terminal.freeStore() > this.store.getCapacity()) target = terminal

    if (!target) return false

    this.message += 'RFW'

    let amount = this.freeStore()

    this.createReservation('withdraw', factory.id, amount, RESOURCE_BATTERY)
    this.createReservation('transfer', target.id, amount + this.store.battery, RESOURCE_BATTERY)
    return true
}

HubHauler.prototype.reserveFactoryTransfer = function () {
    const { room } = this
    const { storage } = room
    const { terminal } = room

    const factory = room.structures.factory[0]
    if (!factory) return false

    // If there is not enough free store in the factory

    if (factory.freeStore() < this.store.getCapacity()) return false

    // If the ratio of stored batteries to energy is sufficiently high
    // 100 : 1
    if (room.findStoredResourceAmount(RESOURCE_BATTERY) * 100 > room.findStoredResourceAmount(RESOURCE_ENERGY))
        return false

    // Find a provider

    let provider
    if (storage && storage.store.energy > this.store.getCapacity()) provider = storage
    else if (terminal && terminal.store.energy > this.store.getCapacity()) provider = terminal

    if (!provider) return false

    this.message += 'RFT'

    let amount = this.freeStore()

    this.createReservation('withdraw', provider.id, amount)
    this.createReservation('transfer', factory.id, amount + this.store.energy)
    return true
}
/*
HubHauler.prototype.balanceStoringStructures = function () {
    const creep = this
    const { room } = creep

    // Define the storage and termina

    const { storage } = room
    const { terminal } = room

    // If there is no terminal or storage, inform false

    if (!storage || !terminal) return false

    creep.say('BSS')

    // If the creep has a taskTarget

    if (creep.memory.taskTarget) {
        // If the taskTarget isn't the storage or terminal, inform false

        if (creep.memory.taskTarget !== storage.id && creep.memory.taskTarget !== terminal.id) return false

        // Otherwise transfer to the taskTarget. If a success, delete the taskTarget

        if (creep.advancedTransfer(findObjectWithID(creep.memory.taskTarget), RESOURCE_ENERGY))
            delete creep.memory.taskTarget

        // And inform true

        return true
    }

    // If the terminal is unbalanced and the storage has free capacity

    if (
        terminal.store.getUsedCapacity(RESOURCE_ENERGY) >
            storage.store.getUsedCapacity(RESOURCE_ENERGY) * 0.3 + creep.store.getCapacity() &&
        storage.store.getFreeCapacity() > creep.store.getCapacity()
    ) {
        // Withdraw from the unbalanced structure

        creep.withdraw(terminal, RESOURCE_ENERGY)

        // Assign the taskTarget as the reciever

        creep.memory.taskTarget = storage.id

        // And inform true

        return true
    }

    // If the storage is unbalanced and the terminal has free capacity

    if (
        storage.store.getUsedCapacity(RESOURCE_ENERGY) * 0.3 >
            terminal.store.getUsedCapacity(RESOURCE_ENERGY) + creep.store.getCapacity() &&
        terminal.store.getFreeCapacity() > creep.store.getCapacity()
    ) {
        // Withdraw from the unbalanced structure

        creep.withdraw(storage, RESOURCE_ENERGY)

        // Assign the taskTarget as the reciever

        creep.memory.taskTarget = terminal.id

        // And inform true

        return true
    }

    // Inform false

    return false
}

HubHauler.prototype.fillHubLink = function () {
    const creep = this
    const { room } = creep

    // Define the storage and hubLink

    const { storage } = room
    const hubLink = room.hubLink

    // If there is no terminal or hubLink, inform false

    if (!storage || !hubLink) return false

    creep.say('FHL')

    // If the creep has a taskTarget

    if (creep.memory.taskTarget) {
        // If the taskTarget isn't the storage or terminal, inform false

        if (creep.memory.taskTarget !== storage.id && creep.memory.taskTarget !== hubLink.id) return false

        // Otherwise transfer to the taskTarget. If a success, delete the taskTarget

        if (creep.advancedTransfer(findObjectWithID(creep.memory.taskTarget), RESOURCE_ENERGY))
            delete creep.memory.taskTarget

        // And inform true

        return true
    }

    // Get the fastFillerLink

    const fastFillerLink = room.fastFillerLink

    // If the controller is near to downgrade, the fastFillerLink is insufficiently full, or the storage is sufficiently full and the hubLink is not full

    if (
        (room.controller.ticksToDowngrade < 10000 ||
            (fastFillerLink &&
                fastFillerLink.store.getUsedCapacity(RESOURCE_ENERGY) <
                    fastFillerLink.store.getCapacity(RESOURCE_ENERGY) * 0.25) ||
            storage.store.getUsedCapacity(RESOURCE_ENERGY) > creep.store.getCapacity(RESOURCE_ENERGY)) &&
        hubLink.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    ) {
        // Withdraw from the unbalanced structure

        creep.withdraw(storage, RESOURCE_ENERGY)

        // Assign the taskTarget as the reciever

        creep.memory.taskTarget = hubLink.id

        // And inform true

        return true
    }

    // Inform false

    return false
}
 */
