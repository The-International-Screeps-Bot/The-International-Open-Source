import { customLog, findClosestObject, getRange } from 'international/generalFunctions'

export class Hauler extends Creep {

    haul?() {
        this.reserve()

        if (!this.fulfillReservation()) {
            this.say(this.message)
            return
        }

        this.reserve()

        if (!this.fulfillReservation()) {
            this.say(this.message)
            return
        }

        if (this.message.length) this.say(this.message)
    }

    reserve?() {
        if (this.memory.reservations?.length) return

        const { room } = this

        let withdrawTargets = room.MAWT.filter(target => {
            if (target instanceof Resource)
                return (
                    target.reserveAmount >= this.store.getCapacity() * 0.2 || target.reserveAmount >= this.freeStore()
                )

            return target.store.energy >= this.freeStore()
        })

        let transferTargets

        let target
        let amount

        if (this.needsResources()) {
            if (withdrawTargets.length) {
                target = findClosestObject(this.pos, withdrawTargets)

                if (target instanceof Resource) amount = target.reserveAmount
                else amount = Math.min(this.freeStore(), target.store.energy)

                this.createReservation('withdraw', target.id, amount)
                return
            }

            transferTargets = room.MATT.filter(function (target) {
                return target.freeStore() > 0
            })

            if (transferTargets.length == 0) {
                transferTargets = room.METT.filter(function (target) {
                    return target.store.getFreeCapacity(RESOURCE_ENERGY) > 0
                })
            }

            transferTargets = transferTargets.concat(
                room.MEFTT.filter(target => {
                    return (
                        (target.freeStore() >= this.store.energy && this.store.energy > 0) ||
                        target.freeSpecificStore(RESOURCE_ENERGY) >= this.store.energy + this.freeStore()
                    )
                }),
            )

            if (transferTargets.length) {
                withdrawTargets = room.OAWT.filter(target => {
                    if (target instanceof Resource)
                        return (
                            target.reserveAmount >= this.store.getCapacity() * 0.2 ||
                            target.reserveAmount >= this.freeStore()
                        )

                    return target.store.energy >= this.freeStore()
                })

                if (!withdrawTargets.length) return

                target = findClosestObject(this.pos, withdrawTargets)

                if (target instanceof Resource) amount = target.reserveAmount
                else amount = Math.min(this.freeStore(), target.store.energy)

                this.createReservation('withdraw', target.id, amount)
                return
            }
        }

        if (!transferTargets) {
            transferTargets = room.MATT.filter(function (target) {
                return target.freeSpecificStore(RESOURCE_ENERGY) > 0
            })

            transferTargets = transferTargets.concat(
                room.MEFTT.filter(target => {
                    return (
                        (target.freeStore() >= this.store.energy && this.store.energy > 0) ||
                        target.freeSpecificStore(RESOURCE_ENERGY) >= this.store.energy + this.freeStore()
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

            if (amount > 0) {
                this.createReservation('transfer', target.id, amount)
                return
            }
        }

        transferTargets = room.OATT.filter(target => {
            return target.freeStore() >= this.store.energy
        })

        if (transferTargets.length) {
            target = findClosestObject(this.pos, transferTargets)

            amount = Math.min(Math.max(this.store.energy, 0), target.freeStore())

            this.createReservation('transfer', target.id, amount)
        }

        if (this.memory.reservations?.length == 0) {
            //Empty out the creep if it has anything left by this point.
            if (this.store.getUsedCapacity() > 0) {
                let target = room.OATT[0]
                if (target)
                    for (let rsc in this.store) {
                        this.createReservation(
                            'transfer',
                            target.id,
                            this.store[rsc as ResourceConstant],
                            rsc as ResourceConstant,
                        )
                    }
            }
        }

        if (this.memory.reservations?.length == 0 && room.communeManager.labManager)
            room.communeManager.labManager.generateHaulingReservation(this)
    }

    constructor(creepID: Id<Creep>) {
        super(creepID)
    }

    static haulerManager(room: Room, creepsOfRole: string[]) {
        // Loop through creep names of this role

        for (const creepName of creepsOfRole) {
            // Get the creep using its name

            const creep: Hauler = Game.creeps[creepName]

            creep.advancedRenew()

            creep.haul()
        }
    }
}
