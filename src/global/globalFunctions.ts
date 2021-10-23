global.avgPrice = function() {


}

global.createClass = function(className: void) {

    return class className {}
}

global.findObjectWithId = function(id) {

    return Game.getObjectById(id) || undefined
}
