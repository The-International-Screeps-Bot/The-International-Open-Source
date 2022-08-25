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
                target.reserveAmount >= this.store.getCapacity() * 0.2 ||
                target.reserveAmount >= this.freeStore()
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

        if(amount > 0) {
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

    let creep = this;

    function setupInputLab(inputLab : StructureLab, inputRsc : MineralConstant | MineralCompoundConstant, isReverse: boolean) : boolean {
        if(inputLab.mineralType == inputRsc || inputLab.mineralType == null) {
            let source = room?.storage.store[inputRsc] > room?.terminal.store[inputRsc] ? room.storage : room.terminal;

            //This logic isn't quite correct, but it works, but I need to debug this at some point.
            //  If the creep starts with any of the desired resources, send the resources to it to free up the creep.
            //  Only if we have a creepful, should we withdraw from the source container.  This works, but isn't the minimum code to do it.
            let amount = Math.min(creep.store.getFreeCapacity(), source.store[inputRsc], inputLab.store.getFreeCapacity(inputRsc));
            amount = Math.max(amount, 0)
            if(inputLab.store.getFreeCapacity(inputRsc) >= creep.store.getCapacity() && amount - creep.store[inputRsc] > 0)
                creep.createReservation('withdraw', source.id, amount, inputRsc)
            if(amount + creep.store[inputRsc] > 0)
                creep.createReservation('transfer', inputLab.id, amount + creep.store[inputRsc], inputRsc)
        } else {
            let amount = Math.min(creep.store.getFreeCapacity(), inputLab.store[inputLab.mineralType])
            console.log(inputRsc +  ": " + amount)
            creep.createReservation('withdraw', inputLab.id, amount, inputLab.mineralType)
            creep.createReservation('transfer', room.storage?.id, amount + creep.store[inputLab.mineralType], inputLab.mineralType)
        }

        if(creep.memory.reservations?.length > 0)
            return true
        return false
    }

    function setupOutputLab(outputLab : StructureLab, outputRsc : MineralConstant | MineralCompoundConstant, isReverse: boolean) : boolean {
        if((outputLab.mineralType != null && outputLab.mineralType != outputRsc) || outputLab.usedStore(outputRsc) >= creep.freeStore()) {
            let amount = Math.min(creep.freeStore(), outputLab.store[outputLab.mineralType]);

            if(amount != 0)
                creep.createReservation('withdraw', outputLab.id, amount, outputLab.mineralType)
            if(amount + creep.usedStore(outputLab.mineralType) != 0)
                creep.createReservation('transfer', room.storage?.id, amount + creep.store[outputLab.mineralType], outputLab.mineralType)
        }

        if(creep.memory.reservations?.length > 0)
            return true
        return false
    }

    if(this.room.name == "W21N8") {
        const outputRsc = RESOURCE_GHODIUM;
        const input1Rsc = RESOURCE_ZYNTHIUM_KEANITE;
        const input2Rsc = RESOURCE_UTRIUM_LEMERGITE;
        const isReverse = false;

        const room = this.room;
        const input1 = _.find(room.structures.lab, lab => lab.id == "6300bba6fa5d294c1e1763a1");
        const input2 = _.find(room.structures.lab, lab => lab.id == "6300838274ce72369e571442");
        const outputs = _.filter(room.structures.lab, lab => lab != input1 && lab != input2);

        //Priortize the worstly loaded lab.
        if(input2.store[input2Rsc] > input1.store[input1Rsc]) {
            if(setupInputLab(input1, input1Rsc, isReverse)) return;
            if(setupInputLab(input2, input2Rsc, isReverse)) return;
        } else {
            if(setupInputLab(input2, input2Rsc, isReverse)) return;
            if(setupInputLab(input1, input1Rsc, isReverse)) return;
        }
        for(const output of outputs)
            if(setupOutputLab(output, outputRsc, isReverse)) return;
    }
}
