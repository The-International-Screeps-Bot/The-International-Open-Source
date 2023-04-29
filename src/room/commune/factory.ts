import { RoomMemoryKeys } from 'international/constants'
import { CommuneManager } from './commune'

const BASE_RESOURCES = [
    'energy',
    'H',
    'O',
    'U',
    'L',
    'K',
    'Z',
    'X',
    'G',
    RESOURCE_BIOMASS,
    RESOURCE_METAL,
    RESOURCE_SILICON,
    RESOURCE_MIST,
]

export class FactoryManager {
    commune: CommuneManager
    factory: StructureFactory
    constructor(commune: CommuneManager) {
        this.commune = commune
    }

    run() {
        this.factory = this.commune.room.roomManager.structures.factory[0]

        if (!this.factory) return
        if (this.factory.cooldown > 0) return

        if (Game.time % 10 == 0) {
            this.pickProduct()
        }

        this.runFactory()
    }

    allComponents(
        product: CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY,
    ): (CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY)[] {
        let result: (CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY)[] = []

        //If we're asked for a base material, it's the reverse reaction that's being requested,
        //  but we need to hard-code this case, so we don't get into an infinate loop.
        //  Otherwise we'll get "energy requires batteries requires energy"
        if (product == RESOURCE_ENERGY) return [RESOURCE_BATTERY]
        if (product == RESOURCE_GHODIUM) return [RESOURCE_GHODIUM_MELT, RESOURCE_ENERGY]
        if (product == RESOURCE_OXYGEN) return [RESOURCE_OXIDANT, RESOURCE_ENERGY]
        if (product == RESOURCE_HYDROGEN) return [RESOURCE_REDUCTANT, RESOURCE_ENERGY]
        if (product == RESOURCE_CATALYST) return [RESOURCE_PURIFIER, RESOURCE_ENERGY]

        if (product == RESOURCE_UTRIUM) return [RESOURCE_UTRIUM_BAR, RESOURCE_ENERGY]
        if (product == RESOURCE_LEMERGIUM) return [RESOURCE_LEMERGIUM_BAR, RESOURCE_ENERGY]
        if (product == RESOURCE_KEANIUM) return [RESOURCE_KEANIUM_BAR, RESOURCE_ENERGY]
        if (product == RESOURCE_ZYNTHIUM) return [RESOURCE_ZYNTHIUM_BAR, RESOURCE_ENERGY]

        //Don't include the product if we can't make it.
        if (this.factory && COMMODITIES[product].level && COMMODITIES[product].level != this.factory.level) return []

        for (let component of Object.keys(COMMODITIES[product].components)) {
            result.push(component as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY)
            if (
                !BASE_RESOURCES.includes(component) &&
                COMMODITIES[component as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY]
            ) {
                result = result.concat(
                    this.allComponents(
                        component as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY,
                    ),
                )
            }
        }

        return _.uniq(result)
    }

    updateUsableResources() {
        if (!this.getProduct()) {
            this.commune.room.memory[RoomMemoryKeys.factoryUsableResources] = []
            return
        }

        //This should probably be smarter, and use the known production quantity to know if it needs to recurse
        //  Into the items.  Ex: If we have a bunch of U_Bars in storare, we don't need U on this list.
        //  But for now, it asks for it.
        this.commune.room.memory[RoomMemoryKeys.factoryUsableResources] = this.allComponents(this.getProduct())
    }

    setProduct(product: CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM) {
        this.commune.room.memory[RoomMemoryKeys.factoryProduct] = product
        this.updateUsableResources()
    }

    getProduct() {
        return this.commune.room.memory[RoomMemoryKeys.factoryProduct]
    }

    haveAllMaterials(resource: CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM): boolean {
        var currentlyHaveAllMaterials = true
        if (COMMODITIES[resource].level && COMMODITIES[resource].level !== this.factory.level) {
            //if(this.this.commune.room.name == "W15N18") console.log(this.this.commune.room.name + ' ' + resource + ' not right level.')
            return false
        }
        console.log('--Considering ' + resource)

        //I'm not sure why I have to specifiy all the types over this code.  Please fix if you understand the typing better then I do.
        for (const component in COMMODITIES[resource].components) {
            let required =
                COMMODITIES[resource].components[
                    component as
                        | DepositConstant
                        | CommodityConstant
                        | MineralConstant
                        | RESOURCE_ENERGY
                        | RESOURCE_GHODIUM
                ]
            var amountOnHand =
                this.commune.room.resourcesInStoringStructures[
                    component as
                        | DepositConstant
                        | CommodityConstant
                        | MineralConstant
                        | RESOURCE_ENERGY
                        | RESOURCE_GHODIUM
                ]
            if (amountOnHand == undefined) amountOnHand = 0
            console.log('---- ' + component + ' ' + amountOnHand + '/' + required)
            //If it's a basic material, see if we have it.  Otherwise, see if we have the stuff to make it
            //this line doesn't include DepositConstant intentally.  that way !COMMODITIES will be false.
            if (
                BASE_RESOURCES.includes(component) ||
                !COMMODITIES[component as CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM]
            ) {
                if (amountOnHand < required) currentlyHaveAllMaterials = false
            } else {
                if (amountOnHand < required)
                    if (
                        !this.haveAllMaterials(
                            component as CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM,
                        )
                    )
                        currentlyHaveAllMaterials = false
            }
        }

        return currentlyHaveAllMaterials
    }

    nextProduction(
        product: CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM,
    ): CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM {
        if (!product) product = this.getProduct()
        if (!product) return null

        let receipe = COMMODITIES[product]
        if (!receipe) return null
        let missingComponents = _.filter(
            Object.keys(receipe.components),
            r =>
                this.factory.store[r as CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM] <
                receipe.components[r as CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM],
        )

        if (missingComponents.length == 0 && (!receipe.level || receipe.level == this.factory.level)) {
            return product
        } else {
            //If we're asked to make a base product, and we're missing the components, that means we don't have the compressed
            //  version of the uncompressed product.  Bail.
            if (BASE_RESOURCES.includes(product)) return null

            for (let component of missingComponents) {
                if (
                    !BASE_RESOURCES.includes(component) &&
                    COMMODITIES[component as CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM]
                ) {
                    let result = this.nextProduction(
                        component as CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM,
                    )
                    if (result) return result
                }
            }
        }
        return null
    }

    pickProduct() {
        this.setProduct(null)

        // We want a certain ratio of batteries to stored energy

        if (
            this.commune.room.resourcesInStoringStructures[RESOURCE_ENERGY] >
                this.commune.room.communeManager.minStoredEnergy * 1.2 &&
            this.commune.room.resourcesInStoringStructures.battery <
                this.commune.room.resourcesInStoringStructures.energy / 100
        ) {
            // Convert energy into batteries
            this.setProduct(RESOURCE_BATTERY)
            return
        }

        if (
            this.commune.room.resourcesInStoringStructures[RESOURCE_ENERGY] <
                this.commune.room.communeManager.minStoredEnergy &&
            this.commune.room.resourcesInStoringStructures[RESOURCE_BATTERY] >= 600
        ) {
            this.setProduct(RESOURCE_ENERGY)
            return
        }

        //let scheduledItems = [];
        //if(Memory.masterPlan.targetProduction)
        //    scheduledItems = _.keys(Memory.masterPlan.targetProduction).filter(rsc => Memory.masterPlan.targetProduction[rsc] > 0);

        //This is what to make, in priorty sequence.  Scheduled items is used for scheduling high-end materials for prodution.
        let stuffToMake = [
            //...scheduledItems,
            RESOURCE_CONDENSATE,
            RESOURCE_WIRE,
            RESOURCE_ALLOY,
            RESOURCE_CELL,

            RESOURCE_GHODIUM_MELT,
            RESOURCE_REDUCTANT,
            RESOURCE_OXIDANT,
            RESOURCE_PURIFIER,
            RESOURCE_LEMERGIUM_BAR,
            RESOURCE_UTRIUM_BAR,
            RESOURCE_KEANIUM_BAR,
            RESOURCE_ZYNTHIUM_BAR,
            RESOURCE_BATTERY,

            //This needs to have the L2 and L3 common components added, but the logic
            //   below needs updates so it's only built when it's needed.
            RESOURCE_COMPOSITE,

            //This list needs the reverse-fabrication of bars in here as well, for when the supplies are super-low, or energy
            //  is low, but the below block needs that logic in first.
        ]

        for (var resource of stuffToMake) {
            let productionTarget = 10000
            if (resource == RESOURCE_COMPOSITE) productionTarget = 200

            var totalOnHand = this.commune.room.resourcesInStoringStructures[resource]

            //don't run the this.commune.room out of energy making batteries.
            if (
                resource == RESOURCE_BATTERY &&
                this.commune.room.resourcesInStoringStructures[RESOURCE_ENERGY] < 200000
            )
                continue

            if (
                (totalOnHand < productionTarget &&
                    !(
                        [
                            RESOURCE_UTRIUM_BAR,
                            RESOURCE_LEMERGIUM_BAR,
                            RESOURCE_ZYNTHIUM_BAR,
                            RESOURCE_KEANIUM_BAR,
                            RESOURCE_OXIDANT,
                            RESOURCE_REDUCTANT,
                            RESOURCE_PURIFIER,
                        ] as string[]
                    ).includes(resource)) ||
                resource == RESOURCE_WIRE ||
                resource == RESOURCE_CONDENSATE ||
                resource == RESOURCE_CELL ||
                resource == RESOURCE_ALLOY ||
                (resource == RESOURCE_PURIFIER &&
                    this.commune.room.resourcesInStoringStructures[RESOURCE_CATALYST] > 10000) ||
                (resource == RESOURCE_UTRIUM_BAR &&
                    this.commune.room.resourcesInStoringStructures[RESOURCE_UTRIUM] > 10000) ||
                (resource == RESOURCE_LEMERGIUM_BAR &&
                    this.commune.room.resourcesInStoringStructures[RESOURCE_LEMERGIUM] > 10000) ||
                (resource == RESOURCE_ZYNTHIUM_BAR &&
                    this.commune.room.resourcesInStoringStructures[RESOURCE_ZYNTHIUM] > 10000 &&
                    this.commune.room.resourcesInStoringStructures[RESOURCE_ZYNTHIUM] >
                        this.commune.room.resourcesInStoringStructures[RESOURCE_ZYNTHIUM_BAR]) ||
                (resource == RESOURCE_KEANIUM_BAR &&
                    this.commune.room.resourcesInStoringStructures[RESOURCE_KEANIUM] > 10000 &&
                    this.commune.room.resourcesInStoringStructures[RESOURCE_KEANIUM] >
                        this.commune.room.resourcesInStoringStructures[RESOURCE_KEANIUM_BAR]) ||
                (resource == RESOURCE_GHODIUM_MELT &&
                    this.commune.room.resourcesInStoringStructures[RESOURCE_GHODIUM] > 10000 &&
                    this.commune.room.resourcesInStoringStructures[RESOURCE_GHODIUM] >
                        this.commune.room.resourcesInStoringStructures[RESOURCE_GHODIUM_MELT]) ||
                (resource == RESOURCE_OXIDANT &&
                    this.commune.room.resourcesInStoringStructures[RESOURCE_OXYGEN] > 10000 &&
                    this.commune.room.resourcesInStoringStructures[RESOURCE_OXYGEN] >
                        this.commune.room.resourcesInStoringStructures[RESOURCE_OXIDANT]) ||
                (resource == RESOURCE_REDUCTANT &&
                    this.commune.room.resourcesInStoringStructures[RESOURCE_HYDROGEN] > 10000 &&
                    this.commune.room.resourcesInStoringStructures[RESOURCE_HYDROGEN] >
                        this.commune.room.resourcesInStoringStructures[RESOURCE_REDUCTANT])
            ) {
                let currentlyHaveAllMaterials: boolean = this.haveAllMaterials(resource)
                if (!currentlyHaveAllMaterials) continue

                this.setProduct(resource)
                break
            }
        }
    }

    runFactory() {
        if (!this.getProduct()) return
        if (this.factory.cooldown > 0) return

        let product = this.nextProduction(null)
        if (!product) return

        var result = this.factory.produce(product)

        if (result == ERR_BUSY) {
        } else if (result != OK) {
        } else {
            // if(Memory.masterPlan.targetProduction && Memory.masterPlan.targetProduction[product]) {
            //     Memory.masterPlan.targetProduction[product]--;
            // }
        }
    }
}
