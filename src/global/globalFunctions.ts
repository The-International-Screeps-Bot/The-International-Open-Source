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
