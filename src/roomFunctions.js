Room.prototype.getObjectWithId = function(id) {

    if (Game.getObjectById(id) == null) return false

    return Game.getObjectById(id)
}