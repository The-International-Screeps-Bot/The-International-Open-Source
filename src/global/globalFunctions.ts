global.avgPrice = function() {


}

global.createClass = function(className: string) {

    return class className {}
}

/**
 * @param id
 * @returns
 */
global.findObjectWithId = function(id: any) {

    return Game.getObjectById(id) || undefined
}

/**
 * @param rect
 * @returns
 */
global.getPositionsInsideRect = function(rect: {[key: string]: any}) {

    let positions = []

    for (let x = rect.x1; x <= rect.x2; x++) {
        for (let y = rect.y1; y <= rect.y2; y++) {

            positions.push({ x: x, y: y })
        }
    }

    return positions
}

/**
 * Runs a function and CustomLogs the cpu used if cpuLogging is enabled
 * @param functionName The name of the function to run
 */
global.advancedRun = function(functionName: Function) {

    // If logging is disabled

    if (!global.cpuLogging) {

        // Run function and stop

        functionName()
        return
    }

    // Record cpu usage

    let CPU = Game.cpu.getUsed()

    // Run function

    functionName()

    // Use past CPU to find how much CPU the function used

    CPU = Game.cpu.getUsed() - CPU

    // Log CPU and stop

    new CustomLog(functionName + ' CPU', CPU)
    return
}

/**
 *
 * @param pos1
 * @param pos2
 * @returns
 */
global.arePositionsAlike = function(pos1: {[key: string]: number}, pos2: {[key: string]: number}) {

    if (pos1.x == pos2.x && pos1.y == pos2.y) return true
    return false
}

interface CustomLog {
    log: string
}

/**
 * Custom console logs using HTML and CSS for special structure and styling, going beyond the conventional limits of Screeps console logging
 * @param title title of log
 * @param message content of message
 * @param color text colour
 * @param bgColor background colour
 */
class CustomLog {
    constructor(title: string, message: any, color?: string, bgColor?: string) {

        // Assign defaults if parameters were missing

        if (!color) color = global.colors.black
        if (!bgColor) bgColor = global.colors.white

        //

        this.log = `<div style='text-align: center; align-items: center; justify-content: left; display: flex; background: ` + bgColor + `;'><div style='padding: 6px; font-size: 16px; font-weigth: 400; color: ` + color + `;'>` + title + `:</div><div style='box-shadow: inset rgb(0, 0, 0, 0.1) 0 0 0 10000px; padding: 6px; font-size: 14px; font-weight: 200; color: ` + color + `;'>` + message + `</div></div>`

        // Add this to customLogs for output

        global.customLogs += this.log
    }
}

global.CustomLog = CustomLog
