import { customLog, findClosestObject, getRange } from 'international/generalFunctions'
import { creepClasses, Hauler } from '../../creepClasses'

export function haulerManager(room: Room, creepsOfRole: string[]) {
    // Loop through creep names of this role

    for (const creepName of creepsOfRole) {
        // Get the creep using its name

        const creep: Hauler = Game.creeps[creepName]

        creep.advancedRenew()

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

        if (creep.message.length) creep.say(creep.message)
    }
}

Hauler.prototype.reserve = function () {

    if (this.memory.reservations?.length) return

    const { room } = this

    let withdrawTargets = room.MAWT.filter(target => {
        if (target instanceof Resource)
            return (
                target.reserveAmount >= this.store.getCapacity(RESOURCE_ENERGY) * 0.2 ||
                target.reserveAmount >= this.freeStore(RESOURCE_ENERGY)
            )

        return target.store.energy >= this.freeStore(RESOURCE_ENERGY)
    })

    let transferTargets

    let target
    let amount

    if (this.needsResources()) {
        if (withdrawTargets.length) {
            target = findClosestObject(this.pos, withdrawTargets)

            if (target instanceof Resource) amount = target.reserveAmount
            else amount = Math.min(this.freeStore(RESOURCE_ENERGY), target.store.energy)

            this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY)
            return
        }

        transferTargets = room.MATT.filter(function (target) {
            return target.freeStore(RESOURCE_ENERGY) > 0
        })

        transferTargets = transferTargets.concat(
            room.MEFTT.filter(target => {
                return (
                    (target.freeStore(RESOURCE_ENERGY) >= this.store.energy && this.store.energy > 0) ||
                    target.freeSpecificStore(RESOURCE_ENERGY) >= this.store.energy + this.freeStore(RESOURCE_ENERGY)
                )
            }),
        )

        if (transferTargets.length) {
            withdrawTargets = room.OAWT.filter(target => {
                if (target instanceof Resource)
                    return (
                        target.reserveAmount >= this.store.getCapacity(RESOURCE_ENERGY) * 0.2 ||
                        target.reserveAmount >= this.freeStore(RESOURCE_ENERGY)
                    )

                return target.store.energy >= this.freeStore(RESOURCE_ENERGY)
            })

            if (!withdrawTargets.length) return

            target = findClosestObject(this.pos, withdrawTargets)

            if (target instanceof Resource) amount = target.reserveAmount
            else amount = Math.min(this.freeStore(RESOURCE_ENERGY), target.store.energy)

            this.createReservation('withdraw', target.id, amount, RESOURCE_ENERGY)
            return
        }

        return
    }

    if (!transferTargets) {
        transferTargets = room.MATT.filter(function (target) {
            return target.freeSpecificStore(RESOURCE_ENERGY) > 0
        })

        transferTargets = transferTargets.concat(
            room.MEFTT.filter(target => {
                return (
                    (target.freeStore(RESOURCE_ENERGY) >= this.store.energy && this.store.energy > 0) ||
                    target.freeSpecificStore(RESOURCE_ENERGY) >= this.store.energy + this.freeStore(RESOURCE_ENERGY)
                )
            }),
        )
    }

    if (transferTargets.length) {
        target = transferTargets.sort((a, b) => {
            return (
                getRange(this.pos.x, a.pos.x, this.pos.y, a.pos.y) +
                a.store.energy * 0.05 -
                (getRange(this.pos.x, b.pos.x, this.pos.y, b.pos.y) + b.store.energy * 0.05)
            )
        })[0]

        amount = Math.min(Math.max(this.store.energy, 0), target.freeSpecificStore(RESOURCE_ENERGY))

        this.createReservation('transfer', target.id, amount, RESOURCE_ENERGY)
        return
    }

    transferTargets = room.OATT.filter(target => {
        return target.freeStore(RESOURCE_ENERGY) >= this.store.energy
    })

    if (!transferTargets.length) return

    target = findClosestObject(this.pos, transferTargets)

    amount = Math.min(Math.max(this.store.energy, 0), target.freeStore(RESOURCE_ENERGY))

    this.createReservation('transfer', target.id, amount, RESOURCE_ENERGY)
    return
}
