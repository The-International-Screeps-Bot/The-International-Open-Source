import { Commune } from './communeManager'
import { Hauler } from './creeps/creepClasses'

export class LabManager {
    commune: Commune
    constructor(commune: Commune) {
        this.commune = commune
    }

    run() {
        if (this.commune.room.name == 'W21N8') {
            const input1 = _.find(this.commune.structures.lab, lab => lab.id == '6300bba6fa5d294c1e1763a1')
            const input2 = _.find(this.commune.structures.lab, lab => lab.id == '6300838274ce72369e571442')
            const outputs = _.filter(this.commune.structures.lab, lab => lab != input1 && lab != input2)

            for (const output of outputs) {
                if (output.cooldown) continue
                output.runReaction(input1, input2)
            }
        }
    }

    private setupInputLab(
        creep: Hauler,
        inputLab: StructureLab,
        inputRsc: MineralConstant | MineralCompoundConstant,
        isReverse: boolean,
    ): boolean {
        if (inputLab.mineralType == inputRsc || inputLab.mineralType == null) {
            let source =
                this.commune.room?.storage.store[inputRsc] > this.commune.room?.terminal.store[inputRsc]
                    ? this.commune.room.storage
                    : this.commune.room.terminal

            //This logic isn't quite correct, but it works, but I need to debug this at some point.
            //  If the creep starts with any of the desired resources, send the resources to it to free up the creep.
            //  Only if we have a creepful, should we withdraw from the source container.  This works, but isn't the minimum code to do it.
            let amount = Math.min(
                creep.store.getFreeCapacity(),
                source.store[inputRsc],
                inputLab.store.getFreeCapacity(inputRsc),
            )
            amount = Math.max(amount, 0)
            if (
                inputLab.store.getFreeCapacity(inputRsc) >= creep.store.getCapacity() &&
                amount - creep.store[inputRsc] > 0
            )
                creep.createReservation('withdraw', source.id, amount, inputRsc)
            if (amount + creep.store[inputRsc] > 0)
                creep.createReservation('transfer', inputLab.id, amount + creep.store[inputRsc], inputRsc)
        } else {
            let amount = Math.min(creep.store.getFreeCapacity(), inputLab.store[inputLab.mineralType])
            console.log(inputRsc + ': ' + amount)
            creep.createReservation('withdraw', inputLab.id, amount, inputLab.mineralType)
            creep.createReservation(
                'transfer',
                this.commune.room.storage?.id,
                amount + creep.store[inputLab.mineralType],
                inputLab.mineralType,
            )
        }

        if (creep.memory.reservations?.length > 0) return true
        return false
    }

    private setupOutputLab(
        creep: Hauler,
        outputLab: StructureLab,
        outputRsc: MineralConstant | MineralCompoundConstant,
        isReverse: boolean,
    ): boolean {
        if (
            (outputLab.mineralType != null && outputLab.mineralType != outputRsc) ||
            outputLab.usedStore(outputRsc) >= creep.freeStore()
        ) {
            let amount = Math.min(creep.freeStore(), outputLab.store[outputLab.mineralType])

            if (amount != 0) creep.createReservation('withdraw', outputLab.id, amount, outputLab.mineralType)
            if (amount + creep.usedStore(outputLab.mineralType) != 0)
                creep.createReservation(
                    'transfer',
                    this.commune.room.storage?.id,
                    amount + creep.store[outputLab.mineralType],
                    outputLab.mineralType,
                )
        }

        if (creep.memory.reservations?.length > 0) return true
        return false
    }

    generateHaulingReservation(creep: Hauler) {
        if (this.commune.room.name == 'W21N8') {
            const outputRsc = RESOURCE_GHODIUM
            const input1Rsc = RESOURCE_ZYNTHIUM_KEANITE
            const input2Rsc = RESOURCE_UTRIUM_LEMERGITE
            const isReverse = false

            const room = this.commune.room
            const input1 = _.find(room.structures.lab, lab => lab.id == '6300bba6fa5d294c1e1763a1')
            const input2 = _.find(room.structures.lab, lab => lab.id == '6300838274ce72369e571442')
            const outputs = _.filter(room.structures.lab, lab => lab != input1 && lab != input2)

            //Priortize the worstly loaded lab.
            if (input2.store[input2Rsc] > input1.store[input1Rsc]) {
                if (this.setupInputLab(creep, input1, input1Rsc, isReverse)) return
                if (this.setupInputLab(creep, input2, input2Rsc, isReverse)) return
            } else {
                if (this.setupInputLab(creep, input2, input2Rsc, isReverse)) return
                if (this.setupInputLab(creep, input1, input1Rsc, isReverse)) return
            }
            for (const output of outputs) if (this.setupOutputLab(creep, output, outputRsc, isReverse)) return
        }
    }
}
