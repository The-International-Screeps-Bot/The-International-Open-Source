import { RoomMemoryKeys } from '../../constants/general'
import { CommuneManager, ResourceTargets } from './commune'
import { CommuneUtils } from './communeUtils'

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
  communeManager: CommuneManager
  factory: StructureFactory
  constructor(communeManager: CommuneManager) {
    this.communeManager = communeManager
  }

  run() {
    this.factory = this.communeManager.room.roomManager.factory

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
    if (
      this.factory &&
      COMMODITIES[product].level &&
      COMMODITIES[product].level != this.factory.level
    )
      return []

    for (let component of Object.keys(COMMODITIES[product].components)) {
      result.push(
        component as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY,
      )
      if (
        !BASE_RESOURCES.includes(component) &&
        COMMODITIES[
          component as CommodityConstant | MineralConstant | RESOURCE_GHODIUM | RESOURCE_ENERGY
        ]
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
      this.communeManager.room.memory[RoomMemoryKeys.factoryUsableResources] = []
      return
    }

    //This should probably be smarter, and use the known production quantity to know if it needs to recurse
    //  Into the items.  Ex: If we have a bunch of U_Bars in storare, we don't need U on this list.
    //  But for now, it asks for it.
    this.communeManager.room.memory[RoomMemoryKeys.factoryUsableResources] = this.allComponents(
      this.getProduct(),
    )
  }

  setProduct(product: CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM) {
    this.communeManager.room.memory[RoomMemoryKeys.factoryProduct] = product
    this.updateUsableResources()
  }

  getProduct() {
    return this.communeManager.room.memory[RoomMemoryKeys.factoryProduct]
  }

  /**
   * Wether or not we have the sufficient resources for the production of a specified product
   */
  hasSufficientMaterials(
    resourceType: keyof typeof COMMODITIES,
    minAmount: number,
    resourcesInStoringStructures: Partial<{ [key in ResourceConstant]: number }>,
    resourceTargets: ResourceTargets,
  ) {
    // We know we can't produce a commodity if we don't have the power level
    if (COMMODITIES[resourceType].level && COMMODITIES[resourceType].level !== this.factory.level) {
      return false
    }
    console.log('Factory Considering ' + resourceType)

    // Make sure we have enough of each component, recursively

    const components = COMMODITIES[resourceType].components
    for (const key in components) {
      const materialResourceType = key as
        | CommodityConstant
        | MineralConstant
        | RESOURCE_ENERGY
        | RESOURCE_GHODIUM
        | DepositConstant

      const min = Math.min(
        resourceTargets.min[materialResourceType],
        (components[materialResourceType] / COMMODITIES[resourceType].amount) * minAmount,
      )
      const currentAmount = resourcesInStoringStructures[materialResourceType]
      // Make sure we have at least the min required resources
      if (currentAmount < min) {
        // We don't have the required material, so see if we have enough to make it

        // See if it has componenets to break into
        if (!COMMODITIES[materialResourceType as keyof typeof COMMODITIES]) return false

        // Break it down into its further components and see if it's enough

        const hasSufficientMaterials = this.hasSufficientMaterials(
          materialResourceType as keyof typeof COMMODITIES,
          Math.floor(components[materialResourceType] / minAmount),
          resourcesInStoringStructures,
          resourceTargets,
        )
        if (!hasSufficientMaterials) return false
      }
    }

    return true
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
        this.factory.store[
          r as CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM
        ] <
        receipe.components[
          r as CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM
        ],
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
          COMMODITIES[
            component as CommodityConstant | MineralConstant | RESOURCE_ENERGY | RESOURCE_GHODIUM
          ]
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
      this.communeManager.room.roomManager.resourcesInStoringStructures[RESOURCE_ENERGY] >
        CommuneUtils.minStoredEnergy(this.communeManager.room) * 1.2 &&
      this.communeManager.room.roomManager.resourcesInStoringStructures.battery <
        this.communeManager.room.roomManager.resourcesInStoringStructures.energy / 100
    ) {
      // Convert energy into batteries
      this.setProduct(RESOURCE_BATTERY)
      return
    }

    if (
      this.communeManager.room.roomManager.resourcesInStoringStructures[RESOURCE_ENERGY] <
        CommuneUtils.minStoredEnergy(this.communeManager.room) &&
      this.communeManager.room.roomManager.resourcesInStoringStructures[RESOURCE_BATTERY] >= 600
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
      RESOURCE_BATTERY,
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

      //This needs to have the L2 and L3 common components added, but the logic
      //   below needs updates so it's only built when it's needed.
      RESOURCE_COMPOSITE,

      //This list needs the reverse-fabrication of bars in here as well, for when the supplies are super-low, or energy
      //  is low, but the below block needs that logic in first.
    ]

    const resourcesInStoringStructures =
      this.communeManager.room.roomManager.resourcesInStoringStructures
    const resourceTargets = CommuneUtils.getResourceTargets(this.communeManager.room)

    for (const resourceType of stuffToMake) {
      const max = resourceTargets.max[resourceType]
      const currentAmount = resourcesInStoringStructures[resourceType]
      // Make sure we are sufficiently low on the resource before wanting to produce more
      if (currentAmount * 1.1 >= max) continue

      let currentlyHaveAllMaterials = this.hasSufficientMaterials(
        resourceType,
        max - currentAmount,
        resourcesInStoringStructures,
        resourceTargets,
      )
      // Make sure we have enough component-materials to make the end product
      if (!currentlyHaveAllMaterials) continue

      this.setProduct(resourceType)
      break
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
