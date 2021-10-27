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
    constructor(title: string, message: string, color: string, bgColor: string) {

        // Assign defaults if parameters were missing

        if (!color) color = global.colors.black
        if (!bgColor) color = global.colors.lightBlue

        //

        this.log = `
        <div style='text-align: center; width: 100%; align-items: center; justify-content: center; display: flex; background: ` + global.colors.white + `;'>
            <div style='font-size: 18px; border: black 1px solid; display: flex; justify-content: center;'>
                ` + title + `
            </div>
            <div style='font-size: 16px; font-weight: bold; border: black 1px;'>
                ` + message + `
            </div>
        </div>
        `

        // Add this to customLogs for output

        global.customLogs += this.log
    }
}

global.CustomLog = CustomLog
