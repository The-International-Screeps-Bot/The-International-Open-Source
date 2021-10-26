global.avgPrice = function() {


}

global.createClass = function(className: void) {

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
    title: string
    message: string
    color: string
    bgColor: string
}

/**
 * Custom console logs using HTML and CSS for special structure and styling, going beyond the conventional limits of Screeps console logging
 * @param title title of log
 * @param message content of message
 * @param color text colour
 * @param bgColor background colour
 */
class CustomLog {
    constructor(title: string, message: string, color: string, bgColor: string) {

        // Assign defaults if parameters were missing

        if (!color) color = '#fff'
        if (!bgColor) color = '#0f66fc'

        // Assign opts

        this.title = title
        this.message = message
        this.color = global.colors[color]
        this.bgColor = bgColor

        // Add this to customLogs for output

        global.customLogs.push(this)
    }
}

global.CustomLog = CustomLog
