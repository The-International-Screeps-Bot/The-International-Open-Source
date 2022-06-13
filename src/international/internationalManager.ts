import { allyManager } from 'international/simpleAllies'
import { customLog, getAvgPrice } from './generalFunctions'
import ExecutePandaMasterCode from '../other/PandaMaster/Execute'
import { CPUBucketCapacity, mmoShardNames } from './constants'
/**
 * Handles pre-roomManager, inter room, and multiple-room related matters
 */
export class InternationalManager {
     // Functions

     run?(): void

     /**
      * Configures features like Memory, global and object prototypes required to run the bot
      */
     config?(): void

     /**
      * Configures tick important or tick-only pre-roomManager settings required to run the bot
      */
     tickConfig?(): void

     /**
      * Organizes creeps into properties for their communeName, and tracks total creep count
      */
     creepOrganizer?(): void

     /**
      * Construct remote needs using data collected from the creepOrganizer
      */
     remoteNeedsManager?(): void

     /**
      * Deletes or edits international classes
      */
     taskManager?(): void

     /**
      * Tracks and records constructionSites and thier age, deleting old sites
      */
     constructionSiteManager?(): void

     /**
      * Adds colours and annotations to the map if mapVisuals are enabled
      */
     mapVisualsManager?(): void

     /**
      * Handles logging, stat recording, and more at the end of the tick
      */
     endTickManager?(): void

     // Market functions
     /**
      * Gets sell orders for a resourceType below a specified price
      */
     getSellOrders?(resourceType: MarketResourceConstant, maxPrice?: number): Order[]

     /**
      * Gets buy orders for a resourceType above a specified price
      */
     getBuyOrders?(resourceType: MarketResourceConstant, minPrice?: number): Order[]

     advancedSellPixels?(): void

     advancedGeneratePixel() {

          if (!Memory.pixelGeneration) return

          // Stop if the bot is not running on MMO

          if (!mmoShardNames.has(Game.shard.name)) return

          // Stop if the cpu bucket isn't full

          if (Game.cpu.bucket !== 10000) return

          // Try to generate a pixel

          Game.cpu.generatePixel()
     }

     /**
      * My outgoing orders organized by room, order type and resourceType
      */
     _myOrders?: {
          [key: string]: Partial<Record<string, Partial<Record<MarketResourceConstant, Order[]>>>>
     }

     /**
      * Gets my outgoing orders organized by room, order type and resourceType
      */
     get myOrders() {
          // If _myOrders are already defined, inform them

          if (this._myOrders) return this._myOrders

          this._myOrders = {}

          // Loop through each orderID in the market's orders

          for (const orderID in Game.market.orders) {
               // Get the order using its ID

               const order = Game.market.orders[orderID]

               // If there is foundation for this structure, create it

               if (!this._myOrders[order.roomName]) {
                    this._myOrders[order.roomName] = {
                         sell: {},
                         buy: {},
                    }
               }

               // If there is no array for this structure, create one

               if (!this._myOrders[order.roomName][order.type][order.resourceType])
                    this._myOrders[order.roomName][order.type][order.resourceType] = []

               // Add the order to the structure's array

               this._myOrders[order.roomName][order.type][order.resourceType].push(order)
          }

          return this._myOrders
     }

     /**
      * Existing other-player orders ordered by order type and resourceType
      */
     _orders?: Partial<Record<string, Partial<Record<MarketResourceConstant, Order[]>>>>

     /**
      * Gets existing other-player orders ordered by order type and resourceType
      */
     get orders() {
          // If _orders are already defined, inform them

          if (this._orders) return this._orders

          this._orders = {}

          // Get the market's order and loop through them

          const orders = Game.market.getAllOrders()
          for (const orderID in orders) {
               // Get the order using its ID

               const order = orders[orderID]

               // If there is no foundation for this structure, create one

               if (!this._orders[order.type]) this._orders[order.type] = {}

               // If there is no array for this structure, create one

               if (!this._orders[order.type][order.resourceType]) this._orders[order.type][order.resourceType] = []

               // Add the order to the structure's array

               this._orders[order.type][order.resourceType].push(order)
          }

          return this._orders
     }

     /**
      * The number of orders owned by me
      */
     _myOrdersCount?: number

     /**
      * Gets the number of orders owned by me
      */
     get myOrdersCount() {
          // If _myOrdersCount are already defined, inform them

          if (this._myOrdersCount) return this._myOrdersCount

          // Inform and set the number of my orders

          return (this._myOrdersCount = Object.keys(Game.market.orders).length)
     }

     _claimRequestsByScore: string[]

     get claimRequestsByScore() {

          if (this._claimRequestsByScore) return this._claimRequestsByScore

          return this._claimRequestsByScore = Object.keys(Memory.claimRequests).sort(
               (a, b) => Memory.claimRequests[a].score - Memory.claimRequests[b].score,
          )
     }
}

InternationalManager.prototype.run = function () {
     delete this._myOrders
     delete this._orders
     delete this._myOrdersCount

     // Run prototypes

     this.config()
     this.tickConfig()
     this.creepOrganizer()
     this.remoteNeedsManager()
     this.taskManager()
     this.constructionSiteManager()

     // Handle ally requests

     allyManager.tickConfig()
     allyManager.getAllyRequests()
     ExecutePandaMasterCode()
}

InternationalManager.prototype.getSellOrders = function (resourceType, maxPrice) {
     // If the price limit isn't defined, construct it using the avgPrice

     if (!maxPrice) maxPrice = getAvgPrice(resourceType) * 1.2

     const orders = this.orders[ORDER_SELL]?.[resourceType] || []

     // Filter orders

     orders.filter(function (order) {
          // Inform if the price is below or equal to the maxPrice

          return order.price <= maxPrice
     })

     // Inform orders

     return orders
}

InternationalManager.prototype.getBuyOrders = function (resourceType, minPrice) {
     const orders = this.orders[ORDER_BUY]?.[resourceType] || []

     // Filter orders

     orders.filter(function (order) {
          // Inform if the price is more or equal to the minPrice

          return order.price >= minPrice
     })

     // Inform orders

     return orders
}

export const internationalManager = new InternationalManager()

InternationalManager.prototype.advancedSellPixels = function () {
     if (!Memory.pixelSelling) return

     if (Game.cpu.bucket < CPUBucketCapacity) return

     const orders = Game.market.getAllOrders({ type: PIXEL })

     for (const order of orders) {
          if (order.price > getAvgPrice(PIXEL)) continue

          Game.market.deal(order.id, Math.min(order.amount, Game.resources[PIXEL]))
          return
     }
}
