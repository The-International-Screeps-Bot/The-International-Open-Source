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
