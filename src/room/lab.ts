import { Commune } from './communeManager'
import { Hauler } from './creeps/creepClasses'

export class LabManager {
    commune: Commune
    constructor(commune: Commune) {
        this.commune = commune
    }

    outputRsc = RESOURCE_GHODIUM
    input1Rsc = RESOURCE_ZYNTHIUM_KEANITE
    input2Rsc = RESOURCE_UTRIUM_LEMERGITE
    isReverse = false

    lab1Id = '6300bba6fa5d294c1e1763a1'
    lab2Id = '6300838274ce72369e571442'

    public get input1(): StructureLab {
        return _.find(this.commune.structures.lab, lab => lab.id == this.lab1Id)
    }

    public get input2(): StructureLab {
        return _.find(this.commune.structures.lab, lab => lab.id == this.lab2Id)
    }

    public get outputs(): StructureLab[] {
        return _.filter(this.commune.structures.lab, lab => lab.id != this.lab1Id && lab.id != this.lab2Id)
    }

    run() {
        if (this.commune.room.name == 'W21N8') {
            for (const output of this.outputs) {
                if (output.cooldown) continue
                output.runReaction(this.input1, this.input2)
            }
        }
    }

    private setupInputLab(
        creep: Hauler,
        inputLab: StructureLab,
        inputRsc: MineralConstant | MineralCompoundConstant,
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

    private setupOutputLab(creep: Hauler, outputLab: StructureLab): boolean {
        if (
            (outputLab.mineralType != null && outputLab.mineralType != this.outputRsc) ||
            outputLab.usedStore(this.outputRsc) >= creep.freeStore()
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
            //Priortize the worstly loaded lab.
            if (this.input2.store[this.input2Rsc] > this.input1.store[this.input1Rsc]) {
                if (this.setupInputLab(creep, this.input1, this.input1Rsc)) return
                if (this.setupInputLab(creep, this.input2, this.input2Rsc)) return
            } else {
                if (this.setupInputLab(creep, this.input2, this.input2Rsc)) return
                if (this.setupInputLab(creep, this.input1, this.input1Rsc)) return
            }
            for (const output of this.outputs) if (this.setupOutputLab(creep, output)) return
        }
    }
}
