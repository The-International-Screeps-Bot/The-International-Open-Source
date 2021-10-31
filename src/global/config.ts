/**
 * Configures features needed to run the bot
 */
export function config() {

    // Configure rooms

    for (const roomName in Game.rooms) {

        const room = Game.rooms[roomName]

        // 1 Tick only properties

        const properties: {[key: string]: any} = {
            myCreeps: {},
            creepCount: {},
        }

        for (const propertyName in properties) {

            room[propertyName] = properties[propertyName]
        }

        // memory properties

        const memoryProperties: {[key: string]: any} = {

        }

        for (const propertyName in memoryProperties) {

            room.memory[propertyName] = memoryProperties[propertyName]
        }

        // global properties

        const globalProperties: {[key: string]: any} = {

        }

        if (!global[room.name]) global[room.name] = {}

        for (const propertyName in globalProperties) {

            global[room.name][propertyName] = globalProperties[propertyName]
        }
    }

    // Assign tick-only properties

    global.customLogs = ``
}
