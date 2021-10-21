module.exports = function ecoManager(room) {

    let defaultRequestValues = {
        response: false,
        room: room,
    }

    class Request {
        constructor(opts) {

            // Assign defaults

            for (let propertyName in defaultRequestValues) {

                this[propertyName] = defaultRequestValues[propertyName]
            }

            this.id = newID()

            // Assign options

            for (let propertyName in opts) {

                this[propertyName] = opts[propertyName]
            }

            // If catagory doesn't exist, create it

            if (!this.room.requests[this.type]) this.room.requests[this.type] = {}

            // Assign object to catagory

            this.room.requests[this.type][this.id] = this
        }
        delete() {

            // Remove request from room memory

            delete this.room.requests[this.type][this.id]
        }
    }

    function createInterRoomRequest() {

        if (room.terminal.store.getUsedCapacity(RESOURCE_ENERGY)) {


        }
    }
}