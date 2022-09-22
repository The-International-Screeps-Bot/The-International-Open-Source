export default class Market {
    private _minCpuUnlockSellPrice: number = 50 * 1000 * 1000

    private _maxPixelBuyPrice: number = 40 * 1000

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
            order => order.resourceType === PIXEL && order.type === ORDER_SELL && order.price < this._maxPixelBuyPrice,
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

    private BuyMorePixels(): void {
        const orders = Game.market.getAllOrders(
            order => order.resourceType === PIXEL && order.type === ORDER_BUY && order.price < this._maxPixelBuyPrice,
        )
        const myOrder = orders.find(order => order.id === '62d1d72a3a08f134005f736a')

        // highest first
        orders.sort((a, b) => b.price - a.price)
        if (orders[0].id !== myOrder.id) {
            const newPrice = orders[0].price + 1
            Game.market.changeOrderPrice(myOrder.id, newPrice)
        }

        if (myOrder.remainingAmount < 1000) {
            Game.market.extendOrder(myOrder.id, 1000)
        }
    }

    public HandleOrderEveryTick(): void {
        if (Game.shard.name === this._mainShard) {
            //  this.SellCpuUnlock()
            // this.BuyPixels()
            // this.BuyMorePixels()
        }
    }
}
