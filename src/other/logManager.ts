import { constants } from "international/constants"

export function logManager() {

    const CPULimit = Game.cpu.limit

    function findCPUColor(CPU: number): string {

        // Inform color based on percent of cpu used of limit

        if (CPU > CPULimit * 0.6) return constants.colors.green
        if (CPU > CPULimit * 0.9) return constants.colors.green
        return constants.colors.green
    }

    const CPU: number = Game.cpu.getUsed()

    const CPUColor = findCPUColor(CPU)

    global.customLog('Total CPU', (CPU).toFixed(2) + ' / ' + Game.cpu.limit, constants.colors.white, CPUColor)

    for (let i = 0; i < 99; i++) console.log()
    console.log(global.logs)
}
