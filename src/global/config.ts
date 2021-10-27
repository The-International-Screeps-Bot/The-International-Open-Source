/**
 * Configures features needed to run the bot
 */
export function config() {

    // Configure rooms

    for (let roomName in Game.rooms) {

        let room = Game.rooms[roomName]

        const properties: {[key: string]: any} = {
            myCreeps: {}
        }

        for (let propertyName in properties) {

            room[propertyName] = properties[propertyName]
        }

        const memoryProperties = {

        }

        for (let propertyName in memoryProperties) {

            room.memory[propertyName] = memoryProperties[propertyName]
        }

        const globalProperties = {

        }

        if (!global[room.name]) global[room.name] = {}

        for (let propertyName in globalProperties) {

            global[room.name][propertyName] = globalProperties[propertyName]
        }
    }

    // Assign tick-only properties

    global.customLogs = ``
}
