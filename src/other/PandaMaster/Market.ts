export default class Market {
     private _minCpuUnlockSellPrice: number = 50 * 1000 * 1000

     private _maxPixelBuyPrice: number = 20 * 1000

     private _mainShard: string

     constructor(mainShard = 'shard0') {
          this._mainShard = mainShard
     }

     private SellCpuUnlock(): void {
          const orders = Game.market.getAllOrders(
               order =>
                    order.resourceType === CPU_UNLOCK &&
                    order.type === ORDER_BUY &&
                    order.price > this._minCpuUnlockSellPrice,
          )

          orders.forEach(order => {
               const result = Game.market.deal(order.id, order.amount)
               if (result === OK) {
                    const message = `Dealed CPU UNLOCK ${order.amount} for ${order.price}`
                    Game.notify(message, 0)
                    console.log(message)
               }
          })
     }

     private BuyPixels(): void {
          const orders = Game.market.getAllOrders(
               order =>
                    order.resourceType === PIXEL && order.type === ORDER_SELL && order.price < this._maxPixelBuyPrice,
          )

          for (let i = 0; i < orders.length; i += 1) {
               const order = orders[i]
               const result = Game.market.deal(order.id, order.amount)
               if (result === OK) {
                    const message = `Dealed PIXEL ${order.amount} for ${order.price}`
                    Game.notify(message, 60 * 24 * 7)
                    console.log(message)
               }
          }
     }

     public HandleOrderEveryTick(): void {
          if (Game.shard.name === this._mainShard) {
               //  this.SellCpuUnlock()
               this.BuyPixels()
          }
     }
}
