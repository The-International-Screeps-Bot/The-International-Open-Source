import { minerals } from 'international/constants'
import { CommuneManager } from './commune'
import { Hauler } from '../creeps/roleManagers/commune/hauler'
import { findObjectWithID, getRange, randomTick, scalePriority } from 'international/utils'

const reactionCycleAmount = 5000

const reverseReactions: {
    [key in MineralCompoundConstant]?: (MineralConstant | MineralCompoundConstant)[]
} = {
    G: ['ZK', 'UL'],

    ZK: ['Z', 'K'],
    UL: ['U', 'L'],
    OH: ['H', 'O'],
    LH: ['L', 'H'],
    LO: ['L', 'O'],
    KO: ['K', 'O'],
    KH: ['K', 'H'],
    GH: ['G', 'H'],
    GO: ['G', 'O'],
    UO: ['U', 'O'],
    UH: ['U', 'H'],
    ZH: ['Z', 'H'],
    ZO: ['Z', 'O'],

    LH2O: ['LH', 'OH'],
    LHO2: ['LO', 'OH'],
    GH2O: ['GH', 'OH'],
    GHO2: ['GO', 'OH'],
    KHO2: ['KO', 'OH'],
    KH2O: ['KH', 'OH'],
    UH2O: ['UH', 'OH'],
    UHO2: ['UO', 'OH'],
    ZH2O: ['ZH', 'OH'],
    ZHO2: ['ZO', 'OH'],

    XLH2O: ['X', 'LH2O'],
    XLHO2: ['X', 'LHO2'],
    XGH2O: ['X', 'GH2O'],
    XGHO2: ['X', 'GHO2'],
    XKHO2: ['X', 'KHO2'],
    XKH2O: ['X', 'KH2O'],
    XUH2O: ['X', 'UH2O'],
    XUHO2: ['X', 'UHO2'],
    XZH2O: ['X', 'ZH2O'],
    XZHO2: ['X', 'ZHO2'],
}

const allCompounds: (MineralConstant | MineralCompoundConstant)[] = [...Object.keys(reverseReactions), ...minerals] as (
    | MineralConstant
    | MineralCompoundConstant
)[]

function decompose(compound: MineralConstant | MineralCompoundConstant): (MineralConstant | MineralCompoundConstant)[] {
    return reverseReactions[compound as MineralCompoundConstant]
}

const boostsInOrder: MineralBoostConstant[] = [
    // fatigue decrease speed

    RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE,
    RESOURCE_ZYNTHIUM_ALKALIDE,
    RESOURCE_ZYNTHIUM_OXIDE,

    // damage taken

    RESOURCE_CATALYZED_GHODIUM_ALKALIDE,
    RESOURCE_GHODIUM_ALKALIDE,
    RESOURCE_GHODIUM_OXIDE,

    // heal and rangedHeal effectiveness

    RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE,
    RESOURCE_LEMERGIUM_ALKALIDE,
    RESOURCE_LEMERGIUM_OXIDE,

    // attack effectiveness

    RESOURCE_CATALYZED_UTRIUM_ACID,
    RESOURCE_UTRIUM_ACID,
    RESOURCE_UTRIUM_HYDRIDE,

    // rangedAttack and rangedMassAttack effectiveness

    RESOURCE_CATALYZED_KEANIUM_ALKALIDE,
    RESOURCE_KEANIUM_ALKALIDE,
    RESOURCE_KEANIUM_OXIDE,

    // dismantle effectiveness

    RESOURCE_CATALYZED_ZYNTHIUM_ACID,
    RESOURCE_ZYNTHIUM_ACID,
    RESOURCE_ZYNTHIUM_HYDRIDE,

    // upgradeController effectiveness

    RESOURCE_CATALYZED_GHODIUM_ACID,
    RESOURCE_GHODIUM_ACID,
    RESOURCE_GHODIUM_HYDRIDE,

    // capacity

    RESOURCE_CATALYZED_KEANIUM_ACID,
    RESOURCE_KEANIUM_ACID,
    RESOURCE_KEANIUM_HYDRIDE,

    // repair and build effectiveness

    RESOURCE_CATALYZED_LEMERGIUM_ACID,
    RESOURCE_LEMERGIUM_ACID,
    RESOURCE_LEMERGIUM_HYDRIDE,

    // harvest effectiveness

    RESOURCE_CATALYZED_UTRIUM_ALKALIDE,
    RESOURCE_UTRIUM_ALKALIDE,
    RESOURCE_UTRIUM_OXIDE,
]

export class LabManager {
    targetCompounds: { [key in MineralConstant | MineralCompoundConstant]?: number } = {
        KH: 15000,
        G: 10000,
        [RESOURCE_CATALYZED_UTRIUM_ACID]: 10000,
        [RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE]: 10000,
        [RESOURCE_CATALYZED_KEANIUM_ALKALIDE]: 10000,
        [RESOURCE_CATALYZED_ZYNTHIUM_ALKALIDE]: 10000,
        [RESOURCE_CATALYZED_LEMERGIUM_ACID]: 10000,
        [RESOURCE_CATALYZED_GHODIUM_ALKALIDE]: 10000,
        [RESOURCE_CATALYZED_ZYNTHIUM_ACID]: 10000,
        [RESOURCE_CATALYZED_GHODIUM_ACID]: 10000,
    }

    communeManager: CommuneManager
    outputResource: MineralConstant | MineralCompoundConstant
    inputResources: (MineralConstant | MineralCompoundConstant)[] = []
    isReverse: boolean
    targetAmount: number
    inputLab1: StructureLab
    inputLab2: StructureLab
    private requestedBoosts: MineralBoostConstant[] = []
    private labsByBoost: { [key in MineralBoostConstant]?: Id<StructureLab> }

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    /**
     * Boost stuff
     */
    preTickRun() {}

    inputLabIDs: Id<StructureLab>[]

    _inputLabs: StructureLab[]

    /**
     * Finds the input labs we need to opperate production
     */
    public get inputLabs() {
        if (this._inputLabs) return this._inputLabs

        this._inputLabs = []

        // We need at least 3 labs to opperate

        const labs = this.communeManager.room.roomManager.structures.lab
        if (labs.length < 3) return this._inputLabs

        // We need a storage or terminal

        const storingStructure = this.communeManager.room.terminal || this.communeManager.room.storage
        if (!storingStructure) return this._inputLabs

        // Try to use cached lab IDs if valid

        if (this.inputLabIDs && this.inputLabIDs.length >= 2) {
            if (this.unpackLabIDsByType()) return this._inputLabs

            // Reset labs in case any were added

            this._inputLabs = []
        }

        // Reset lab IDs

        this.inputLabIDs = []

        // Prefer labs closer to the hub to be inputs

        labs.sort((a, b) => {
            return getRange(a.pos, storingStructure.pos) - getRange(b.pos, storingStructure.pos)
        })

        for (const lab of labs) {
            // We have enough inputs

            if (this._inputLabs.length >= 2) break

            // Tzhe lab isn't in range of all labs

            if (labs.filter(otherLab => getRange(lab.pos, otherLab.pos) <= 2).length < labs.length) continue

            // Make the lab an input

            this._inputLabs.push(lab)
            this.inputLabIDs.push(lab.id)
        }

        return this._inputLabs
    }

    private unpackLabIDsByType() {
        for (const ID of this.inputLabIDs) {
            const lab = findObjectWithID(ID)
            if (!lab) return false

            this._inputLabs.push(lab)
        }

        return true
    }

    _outputLabs: StructureLab[]

    public get outputLabs() {
        if (this._outputLabs) return this._outputLabs

        let boostingLabs = Object.values(this.labsByBoost)

        return (this._outputLabs = this.communeManager.room.roomManager.structures.lab.filter(
            lab => !this.inputLabIDs.includes(lab.id) && !boostingLabs.includes(lab.id),
        ))
    }

    run() {
        if (!this.communeManager.room.storage) return
        if (!this.communeManager.room.terminal) return

        delete this._inputLabs
        delete this._outputLabs
        this.inputLab1 = this.inputLabs[0]
        this.inputLab2 = this.inputLabs[1]

        this.assignBoosts()
        this.manageReactions()
    }

    //This is much like demand boost, but will return false if we don't have it, it can't be applied, etc.
    public acceptBoost(creep: Creep, boost: MineralBoostConstant): boolean {
        if (creep.ticksToLive < CREEP_LIFE_TIME - 100) return false

        if (creep.boosts[boost] > 0) return false

        const labId = this.labsByBoost[boost]
        if (!labId) return false

        const lab = this.communeManager.room.roomManager.structures.lab.find(lab => lab.id == labId)

        //See if the lab is ready to boost...
        if (lab.mineralType != boost) return false

        if (lab.mineralAmount < LAB_BOOST_MINERAL || lab.store.getUsedCapacity(RESOURCE_ENERGY) < LAB_BOOST_ENERGY)
            return false

        //This needs to see if the lab is fully ready to boost the creep.  This will work
        //  even if it partially boosts the creep.
        let result = lab.boostCreep(creep)

        if (result == OK) return false

        if (result == ERR_NOT_IN_RANGE) {
            creep.createMoveRequest({
                origin: creep.pos,
                goals: [
                    {
                        pos: lab.pos,
                        range: 1,
                    },
                ],
                avoidEnemyRanges: true,
            })
        } else {
            creep.message += 'BE' + result
        }

        return true
    }

    public demandBoost(creep: Creep, boost: MineralBoostConstant): boolean {
        if (creep.ticksToLive < CREEP_LIFE_TIME - 100) return false

        if (creep.boosts[boost] > 0) return false

        const labId = this.labsByBoost[boost]
        if (!labId) return true

        const lab = this.communeManager.room.roomManager.structures.lab.find(lab => lab.id == labId)

        //See if the lab is ready to boost...
        if (lab.mineralType != boost) return true

        //This needs to see if the lab is fully ready to boost the creep.  This will work
        //  even if it partially boosts the creep.
        let result = lab.boostCreep(creep)

        if (result == OK) return false

        if (result == ERR_NOT_IN_RANGE) {
            creep.createMoveRequest({
                origin: creep.pos,
                goals: [
                    {
                        pos: lab.pos,
                        range: 1,
                    },
                ],
                avoidEnemyRanges: true,
            })
        } else {
            creep.message += 'BE' + result
        }

        return true
    }

    private manageReactions() {
        if (this.inputLabs.length < 2) return
        if (!this.outputLabs.length) return

        if (Memory.roomVisuals) {
            this.communeManager.room.visual.resource(
                this.inputResources[0],
                this.inputLabs[0].pos.x,
                this.inputLabs[0].pos.y,
            )
            this.communeManager.room.visual.resource(
                this.inputResources[1],
                this.inputLabs[1].pos.x,
                this.inputLabs[1].pos.y,
            )
        }

        if (randomTick(100)) delete this._deficits
        this.setCurrentReaction()
        this.createRoomLogisticsRequests()

        if (!this.outputResource) return

        this.runReactions()
    }

    private canReact() {
        if (this.outputLabs[0].cooldown) return false

        const inputLabs = this.inputLabs
        for (let i = 0; i < inputLabs.length; i++) {
            const lab = inputLabs[i]

            if (lab.mineralType !== this.inputResources[i]) return false
        }

        return true
    }

    private runReactions() {
        if (!this.canReact()) return false

        for (const output of this.outputLabs) {
            if (this.isReverse) {
                if (
                    output.mineralType == this.outputResource &&
                    output.store[this.outputResource] >= LAB_REACTION_AMOUNT
                )
                    output.reverseReaction(this.inputLab1, this.inputLab2) //Reverse is here so the outputLabs line up with the expected locations
            } else {
                output.runReaction(this.inputLab1, this.inputLab2)
            }
        }

        return true
    }

    assignBoosts() {
        this.labsByBoost = {}
        for (let compund of boostsInOrder) {
            if (this.requestedBoosts.includes(compund)) {
                // Input labs can act as boosting labs too

                if (this.inputResources[0] === compund) {
                    this.labsByBoost[compund] = this.inputLabs[0].id
                    continue
                }
                if (this.inputResources[1] === compund) {
                    this.labsByBoost[compund] = this.inputLabs[1].id
                    continue
                }

                // Otherwise grab a lab that's not the input labs, and not a boosting lab

                let boostingLabs = Object.values(this.labsByBoost)
                let freelabs = this.communeManager.room.roomManager.structures.lab.filter(
                    lab => !this.inputLabIDs.includes(lab.id) && !boostingLabs.includes(lab.id),
                )

                if (freelabs.length == 0 && this.inputLabIDs[1] && !boostingLabs.includes(this.inputLabIDs[1])) {
                    freelabs = [this.inputLab1]
                }

                if (freelabs.length == 0 && this.inputLabIDs[1] && !boostingLabs.includes(this.inputLabIDs[1])) {
                    freelabs = [this.inputLab2]
                }

                if (freelabs.length > 0) {
                    //If there's a free lab that already has the correct compound, that'll be our boosting lab.
                    let pickedLab = freelabs.find(lab => lab.mineralType == compund)
                    if (!pickedLab) pickedLab = freelabs[0]

                    this.labsByBoost[compund] = pickedLab.id
                } else {
                    //We needed a free lab, and couldn't find one.  Give up on assigning additional boosts.
                    return
                }
            }
        }
    }

    get reactionAmountRemaining() {
        if (this.isReverse) {
            return this.resourceAmount(this.outputResource) - this.targetAmount
        } else {
            let minMaterial = _.min(_.map(decompose(this.outputResource), comp => this.resourceAmount(comp)))
            return Math.min(minMaterial, this.targetAmount - this.resourceAmount(this.outputResource))
        }
    }

    inputFull(inputLab: StructureLab) {
        if (!inputLab) return false
        if (!inputLab.mineralType) return false
        return (
            inputLab.store.getFreeCapacity(inputLab.mineralType) === 0 &&
            inputLab.store.getUsedCapacity(inputLab.mineralType) >= this.reactionAmountRemaining
        )
    }

    chainDecompose(compound: MineralConstant | MineralCompoundConstant, amount: number) {
        this.deficits[compound] = amount + (this.deficits[compound] || 0)
        amount = Math.min(amount, this.deficits[compound])
        amount = Math.max(amount, 0)

        let decomps = decompose(compound)

        for (var c in decomps) {
            this.chainDecompose(decomps[c], amount)
        }
    }

    _deficits: { [key in MineralConstant | MineralCompoundConstant]?: number }
    /**
     * Figures out what we have
     */
    get deficits() {
        if (this._deficits) return this._deficits

        this._deficits = {}
        for (const key of allCompounds) {
            this._deficits[key as MineralConstant | MineralCompoundConstant] = -this.resourceAmount(
                key as MineralConstant | MineralCompoundConstant,
            )
        }
        for (const compound in this.targetCompounds) {
            var amount = Math.max(0, this.targetCompounds[compound as MineralConstant | MineralCompoundConstant]) // this.communeManager.roomai.trading.maxStorageAmount(compound))
            /* console.log('updateDeficits ' + this.communeManager.room.name + ': ' + compound + ', ' + amount) */
            this.chainDecompose(compound as MineralConstant | MineralCompoundConstant, amount)
        }

        for (const key in this._deficits) {
            Math.max(this._deficits[key as MineralConstant | MineralCompoundConstant], 0)
        }

        return this._deficits
    }

    /**
     * Assigns input resources based on the output, alongside reaction settings
     */
    private assignReaction(outputResource: MineralCompoundConstant, targetAmount: number, reverse: boolean) {
        this.outputResource = outputResource

        this.inputResources[0] = reverseReactions[outputResource][0]
        this.inputResources[1] = reverseReactions[outputResource][1]

        this.isReverse = reverse
        this.targetAmount = targetAmount
    }

    assignNoReaction() {
        this.outputResource = null
        this.inputResources[0] = null
        this.inputResources[1] = null
        this.targetAmount = 0
    }

    snoozeUntil: number
    replanAt: number

    private setCurrentReaction() {
        if (this.snoozeUntil && this.snoozeUntil > Game.time) return
        if (!this.isCurrentReactionFinished() && this.replanAt > Game.time) return

        const nextReaction = this.findNextReaction()

        // was...   But I kept getting negative values in the targetAmount.  I think I jusut need to get to the cycleAmount instead.
        //  Even then, that doesn't seem quite right.  Maybe it's correct for intermediates, but not for the end products.
        //  The second argtument is what amount level will cause the reactor to stop.
        /* this.assignReaction(nextReaction, reactionCycleAmount - this.resourceAmount(nextReaction)); */

        if (nextReaction) {
            this.assignReaction(
                nextReaction.type,
                this.resourceAmount(nextReaction.type) + Math.min(reactionCycleAmount, nextReaction.amount),
                false,
            )

            // Prevents continious reactions that take a long time, like breaking down 10000's of a compound

            this.replanAt = Game.time + 3000
            return
        }

        this.assignNoReaction()
        this.snoozeUntil = Game.time + 30
    }

    private isCurrentReactionFinished(): boolean {
        if (!this.outputResource) return true

        if (this.isReverse) {
            if (this.resourceAmount(this.outputResource) <= this.targetAmount) return true
            return false
        }

        if (_.any(decompose(this.outputResource), r => this.resourceAmount(r) < LAB_REACTION_AMOUNT)) return true
        return this.resourceAmount(this.outputResource) >= this.targetAmount
    }

    private chainFindNextReaction(
        target: MineralConstant | MineralCompoundConstant,
        targetAmount: number,
    ): { type: MineralCompoundConstant; amount: number } {
        const nextReaction = target
        let missing = decompose(nextReaction).filter(
            r => this.resourceAmount(r) < targetAmount * (0.25 + 0.05 * this.outputLabs.length),
        )

        console.log(target + ':' + targetAmount + ' missing: ' + JSON.stringify(missing))

        if (!missing.length) return { type: target as MineralCompoundConstant, amount: targetAmount }

        // filter uncookable resources (e.g. H). Can't get those using reactions

        missing = decompose(nextReaction).filter(r => this.resourceAmount(r) < targetAmount)
        missing = missing.filter(r => decompose(r))

        for (const resource of missing) {
            const result = this.chainFindNextReaction(resource, targetAmount - this.resourceAmount(resource))
            if (result) return result
        }

        return null
    }

    private findNextReaction(): { type: MineralCompoundConstant; amount: number } {
        const resources = _.sortBy(
            Object.keys(this.targetCompounds).filter(
                v => this.deficits[v as MineralConstant | MineralCompoundConstant] > 0,
            ),
            v => -this.deficits[v as MineralConstant | MineralCompoundConstant],
        )
        console.log(this.communeManager.room.name, JSON.stringify(this.deficits))
        for (const resource of resources) {
            const result = this.chainFindNextReaction(
                resource as MineralConstant | MineralCompoundConstant,
                this.deficits[resource as MineralConstant | MineralCompoundConstant],
            )

            if (result) return result
        }

        return null
    }

    private resourceAmount(resource: MineralConstant | MineralCompoundConstant): number {
        if (!resource) return 0

        let amount = this.communeManager.room.resourcesInStoringStructures[resource] || 0

        for (const lab of this.communeManager.room.roomManager.structures.lab) {
            if (lab.mineralType !== resource) continue
            amount += lab.mineralAmount
        }

        for (const name of this.communeManager.room.myCreeps.hauler) {
            amount += Game.creeps[name].store[resource]
        }

        return amount
    }

    private createRoomLogisticsRequests() {
        this.createInputRoomLogisticsRequests()
        this.createOutputRoomLogisticsRequests()
        this.createBoostRoomLogisticsRequests()
    }

    private createInputRoomLogisticsRequests() {
        let inputLabs = this.inputLabs
        for (let i = 0; i < inputLabs.length; i++) {
            const lab = inputLabs[i]
            const resourceType = this.inputResources[i]

            // We have the right resource or no resource

            if (this.outputResource && (!lab.mineralType || lab.mineralType === resourceType)) {
                // We have enough

                if (lab.mineralType && lab.reserveStore[lab.mineralType] > lab.store.getCapacity(lab.mineralType) * 0.5)
                    continue

                // Ask for more

                this.communeManager.room.createRoomLogisticsRequest({
                    target: lab,
                    resourceType,
                    type: 'transfer',
                    priority:
                        50 +
                        scalePriority(lab.store.getCapacity(lab.mineralType), lab.reserveStore[lab.mineralType], 20),
                })
                continue
            }

            // We have the wrong resource

            this.communeManager.room.createRoomLogisticsRequest({
                target: lab,
                resourceType: lab.mineralType,
                type: 'withdraw',
                priority:
                    20 +
                    scalePriority(lab.store.getCapacity(lab.mineralType), lab.reserveStore[lab.mineralType], 20, true),
            })
        }
    }

    private createOutputRoomLogisticsRequests() {
        for (const lab of this.outputLabs) {
            // There is no resource to withdraw

            if (!lab.mineralType) continue

            // We have the right resource, withdraw after a threshold

            if (lab.mineralType === this.outputResource) {
                // We have a small amount

                if (
                    lab.mineralType &&
                    lab.reserveStore[lab.mineralType] < lab.store.getCapacity(lab.mineralType) * 0.25
                )
                    continue

                // Ask for more

                this.communeManager.room.createRoomLogisticsRequest({
                    target: lab,
                    resourceType: this.outputResource,
                    type: 'withdraw',
                    priority:
                        20 +
                        scalePriority(
                            lab.store.getCapacity(lab.mineralType),
                            lab.reserveStore[lab.mineralType],
                            20,
                            true,
                        ),
                })
                continue
            }

            // We have the wrong resource, quickly withdraw it all

            this.communeManager.room.createRoomLogisticsRequest({
                target: lab,
                resourceType: lab.mineralType,
                type: 'withdraw',
                priority:
                    20 +
                    scalePriority(lab.store.getCapacity(lab.mineralType), lab.reserveStore[lab.mineralType], 20, true),
            })
        }
    }

    private createBoostRoomLogisticsRequests() {}
    /*
    private setupInputLab(
        creep: Hauler,
        inputLab: StructureLab,
        inputRsc: MineralConstant | MineralCompoundConstant,
    ): boolean {
        if (this.isReverse) {
            if (
                (inputLab.mineralType != null && inputLab.mineralType != inputRsc) ||
                inputLab.usedStore(inputRsc) >= creep.store.getFreeCapacity()
            ) {
                let amount = Math.min(creep.freeStore(), inputLab.store[inputLab.mineralType])

                if (amount != 0) creep.createReservation('withdraw', inputLab.id, amount, inputLab.mineralType)
                if (amount + creep.usedStore(inputLab.mineralType) != 0)
                    creep.createReservation(
                        'transfer',
                        this.communeManager.room.storage?.id,
                        amount + creep.store[inputLab.mineralType],
                        inputLab.mineralType,
                    )


            }
        } else {
            if (inputLab.mineralType == inputRsc || inputLab.mineralType == null) {
                let source =
                    this.communeManager.room?.storage.store[inputRsc] >
                    this.communeManager.room?.terminal.store[inputRsc]
                        ? this.communeManager.room.storage
                        : this.communeManager.room.terminal

                //This logic isn't quite correct, but it works, but I need to debug this at some point.
                //  If the creep starts with any of the desired resources, send the resources to it to free up the creep.
                //  Only if we have a creepful, should we withdraw from the source container.  This works, but isn't the minimum code to do it.
                let amount = Math.min(
                    creep.store.getFreeCapacity(),
                    source.store[inputRsc],
                    inputLab.store.getFreeCapacity(inputRsc),
                )
                amount = Math.max(amount, 0)
                //Do the transfer if there's a bunch of free space in the lab, not necessiarly if there's a bunch in storage, that way
                //  We react all the resources laying around.
                if (inputLab.store.getFreeCapacity(inputRsc) >= creep.store.getCapacity()) {
                    creep.createReservation('withdraw', source.id, amount, inputRsc)
                    creep.createReservation('transfer', inputLab.id, amount, inputRsc)
                }
            } else {
                let amount = Math.min(creep.store.getFreeCapacity(), inputLab.store[inputLab.mineralType])
                creep.createReservation('withdraw', inputLab.id, amount, inputLab.mineralType)
                creep.createReservation(
                    'transfer',
                    this.communeManager.room.storage?.id,
                    amount + creep.store[inputLab.mineralType],
                    inputLab.mineralType,
                )
            }
        }

        if (creep.memory.Rs?.length > 0) return true
        return false
    }

    private setupOutputLab(creep: Hauler, outputLab: StructureLab): boolean {
        if (this.isReverse) {
            if (outputLab.mineralType == this.outputResource || outputLab.mineralType == null) {
                let source =
                    this.communeManager.room?.storage.store[this.outputResource] >
                    this.communeManager.room?.terminal.store[this.outputResource]
                        ? this.communeManager.room.storage
                        : this.communeManager.room.terminal

                let amount = Math.min(
                    creep.store.getFreeCapacity(),
                    source.store[this.outputResource],
                    outputLab.store.getFreeCapacity(this.outputResource),
                )
                amount = Math.max(amount, 0)

                if (outputLab.store.getFreeCapacity(this.outputResource) >= creep.store.getCapacity()) {
                    creep.createReservation('withdraw', source.id, amount, this.outputResource)
                    creep.createReservation('transfer', outputLab.id, amount, this.outputResource)
                }
            } else {
                let amount = Math.min(creep.store.getFreeCapacity(), outputLab.store[outputLab.mineralType])
                creep.createReservation('withdraw', outputLab.id, amount, outputLab.mineralType)
                creep.createReservation(
                    'transfer',
                    this.communeManager.room.storage?.id,
                    amount + creep.store[outputLab.mineralType],
                    outputLab.mineralType,
                )
            }
        } else {
            if (
                (outputLab.mineralType != null && outputLab.mineralType != this.outputResource) ||
                outputLab.usedStore(this.outputResource) >= creep.store.getFreeCapacity()
            ) {
                let amount = Math.min(creep.freeStore(), outputLab.store[outputLab.mineralType])

                if (amount != 0) creep.createReservation('withdraw', outputLab.id, amount, outputLab.mineralType)
                if (amount + creep.usedStore(outputLab.mineralType) != 0)
                    creep.createReservation(
                        'transfer',
                        this.communeManager.room.storage?.id,
                        amount + creep.store[outputLab.mineralType],
                        outputLab.mineralType,
                    )
            }
        }

        if (creep.memory.Rs?.length > 0) return true
        return false
    }

    setupBoosterLab(creep: Hauler, lab: StructureLab, compound: MineralBoostConstant): boolean {
        if (lab.mineralType == compound || lab.mineralType == null) {
            //The 3*2 below are because it takes 30 compound and 20 energy to boost a creep, so make sure it's loaded
            //in a reasonably ratioed sequence.
            if (
                lab.store[RESOURCE_ENERGY] / 30 < lab.store[compound] / 20 &&
                lab.store.getFreeCapacity(RESOURCE_ENERGY) > creep.store.getCapacity()
            ) {
                let source =
                    this.communeManager.room?.storage.store[RESOURCE_ENERGY] >
                    this.communeManager.room?.terminal.store[RESOURCE_ENERGY]
                        ? this.communeManager.room.storage
                        : this.communeManager.room.terminal

                creep.createReservation('withdraw', source.id, creep.store.getCapacity(), RESOURCE_ENERGY)
                creep.createReservation('transfer', lab.id, creep.store.getCapacity(), RESOURCE_ENERGY)
            } else {
                let source: AnyStoreStructure =
                    this.communeManager.room?.storage.store[compound] >
                    this.communeManager.room?.terminal.store[compound]
                        ? this.communeManager.room.storage
                        : this.communeManager.room.terminal

                if (source.store[compound] == 0) {
                    source = this.outputLabs.find(lab => lab.mineralType == compound && lab.mineralAmount > 100)
                }

                if (source) {
                    let amount = Math.min(
                        creep.store.getFreeCapacity(),
                        source.store[compound],
                        lab.store.getFreeCapacity(compound),
                    )
                    amount = Math.max(amount, 0)

                    if (lab.store.getFreeCapacity(compound) >= creep.store.getCapacity()) {
                        creep.createReservation('withdraw', source.id, amount, compound)
                        creep.createReservation('transfer', lab.id, amount, compound)
                    }
                }
            }
        } else {
            //Unload the wrong material
            let amount = Math.min(creep.store.getFreeCapacity(), lab.store[lab.mineralType])
            creep.createReservation('withdraw', lab.id, amount, lab.mineralType)
            creep.createReservation(
                'transfer',
                this.communeManager.room.storage?.id,
                amount + creep.store[lab.mineralType],
                lab.mineralType,
            )
        }

        if (creep.memory.Rs?.length > 0) return true
        return false
    }
 */
    /*
    public requestBoost(compound: MineralBoostConstant) {
        if (!this.requestedBoosts.includes(compound)) this.requestedBoosts.push(compound)
    }


    generateHaulingReservation(creep: Hauler) {
        if (this.labsByBoost) {
            for (const compound in this.labsByBoost) {
                const labId = this.labsByBoost[compound as MineralBoostConstant]
                const lab = this.communeManager.room.roomManager.structures.lab.find(lab => lab.id == labId)
                if (this.setupBoosterLab(creep, lab, compound as MineralBoostConstant)) return
            }
        }

        if (this.inputLabs.length < 2) return

        //Priortize the worstly loaded lab.
        if (this.inputLab2.store[this.inputResources[1]] > this.inputLab1.store[this.inputResources[0]]) {
            if (this.isReverse) {
                if (this.setupInputLab(creep, this.inputLab2, this.inputResources[1])) return
                if (this.setupInputLab(creep, this.inputLab1, this.inputResources[0])) return
            } else {
                if (this.setupInputLab(creep, this.inputLab1, this.inputResources[0])) return
                if (this.setupInputLab(creep, this.inputLab2, this.inputResources[1])) return
            }
        } else {
            if (this.isReverse) {
                if (this.setupInputLab(creep, this.inputLab1, this.inputResources[0])) return
                if (this.setupInputLab(creep, this.inputLab2, this.inputResources[1])) return
            } else {
                if (this.setupInputLab(creep, this.inputLab2, this.inputResources[1])) return
                if (this.setupInputLab(creep, this.inputLab1, this.inputResources[0])) return
            }
        }
        for (const output of this.outputLabs) if (this.setupOutputLab(creep, output)) return
    }
     */
}
