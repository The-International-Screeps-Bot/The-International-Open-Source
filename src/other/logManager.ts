export function logManager() {

    new CustomLog('Total CPU', Game.cpu.getUsed().toFixed(2), global.colors.white, global.colors.lightBlue)

    for (let i = 0; i < 99; i++) console.log()
    console.log(global.logs)
}
