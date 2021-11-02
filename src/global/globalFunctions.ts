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
