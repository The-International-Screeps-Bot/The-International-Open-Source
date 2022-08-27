import { Commune } from './communeManager'
import { Hauler } from './creeps/roleManagers/commune/hauler'

export class LabManager {
    commune: Commune
    outputRsc: MineralConstant | MineralCompoundConstant
    input1Rsc: MineralConstant | MineralCompoundConstant
    input2Rsc: MineralConstant | MineralCompoundConstant
    isReverse: boolean
    lab1Id: string
    lab2Id: string
    lastLayoutCheck: number

    constructor(commune: Commune) {
        this.commune = commune

        this.outputRsc = RESOURCE_GHODIUM
        this.input1Rsc = RESOURCE_ZYNTHIUM_KEANITE
        this.input2Rsc = RESOURCE_UTRIUM_LEMERGITE
        // this.outputRsc = RESOURCE_ZYNTHIUM_KEANITE
        // this.input1Rsc = RESOURCE_ZYNTHIUM
        // this.input2Rsc = RESOURCE_KEANIUM
        this.isReverse = false
    }

    private labsInRange(thisLab: StructureLab, otherLab: StructureLab = null): number {
        return _.filter(
            this.commune.structures.lab,
            lab => lab != thisLab && lab != otherLab && lab.pos.getRangeTo(thisLab.pos) <= 2,
        ).length
    }

    // Checks to ensure all of the internal data is valid, populate it if it's not.
    private doLayoutCheck(): void {
        if (this.lastLayoutCheck + 1000 > Game.time) return

        if (!this.lab1Id || !this.lab2Id || !this.input1 || !this.input2) {
            this.lab1Id = null
            this.lab2Id = null

            if (this.commune.structures.lab.length >= 3) {
                //Sort the labs by the distance to the terminal, so that labs on the side of the hub are favored.
                let sorted = _.sortBy(this.commune.structures.lab, lab =>
                    lab.pos.getRangeTo(this.commune.room.terminal?.pos),
                )
                let bestLab = sorted[0]
                //Starting at 2 intentally, to skip the first two records, which will be the default best labs...
                //  then we see if there's a lab that's better.
                //I'm not 100% sure this logic is perfect, but it's decent, but I think there may be an error in here.
                for (let i = 2; i < sorted.length; i++) {
                    let thisLab = sorted[i]
                    if (this.labsInRange(thisLab) > this.labsInRange(bestLab)) bestLab = thisLab
                }
                this.lab1Id = bestLab.id
                let lab1 = bestLab

                bestLab = sorted[1]
                for (let i = 2; i < sorted.length; i++) {
                    let thisLab = sorted[i]
                    if (this.labsInRange(thisLab, lab1) > this.labsInRange(bestLab, lab1)) bestLab = thisLab
                }
                this.lab2Id = bestLab.id
                //Make sure that both the sending labs are valid.... technically this should check to see how many labs overlap both labs.
                if (this.labsInRange(bestLab) == 0 || this.labsInRange(lab1) == 0) {
                    this.lab1Id = null
                    this.lab2Id = null
                }
            }
        }

        this.lastLayoutCheck = Game.time
    }

    public get input1(): StructureLab {
        return _.find(this.commune.structures.lab, lab => lab.id == this.lab1Id)
    }

    public get input2(): StructureLab {
        return _.find(this.commune.structures.lab, lab => lab.id == this.lab2Id)
    }

    public get outputs(): StructureLab[] {
        return _.filter(this.commune.structures.lab, lab => lab.id != this.lab1Id && lab.id != this.lab2Id)
    }

    private isProperlyLoaded(): boolean {
        if (
            (this.input1.mineralType == this.input1Rsc || this.input1.mineralType == null) &&
            (this.input2.mineralType == this.input2Rsc || this.input2.mineralType == null)
        )
            return true
        return false
    }

    run() {
        if (!this.commune.room.storage || !this.commune.room.terminal) return

        this.doLayoutCheck()
        if (this.isProperlyLoaded) {
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
            if (amount == creep.store.getCapacity()) {
                creep.createReservation('withdraw', source.id, amount, inputRsc)
                creep.createReservation('transfer', inputLab.id, amount, inputRsc)
            }
        } else {
            let amount = Math.min(creep.store.getFreeCapacity(), inputLab.store[inputLab.mineralType])
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
            outputLab.usedStore(this.outputRsc) >= creep.store.getFreeCapacity()
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
        if (!this.lab1Id || !this.lab2Id) return

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
