// IMPORTANT: If you want to use the userScript, copy this file, name it userScript.ts, and rename userScriptExample() to userScript()
global.userScriptExample = function () {
    console.log('Game.time=' + Game.time)
    console.log(JSON.stringify(Game.market.getAllOrders()))
    if (Game.time % 100 === 0) {
        console.log(JSON.stringify(Game.market.getHistory()))
    }
}
