export function config() {

    // Configure rooms

    for (let roomName in Game.rooms) {

        let room = Game.rooms[roomName]

        const properties: {[key: string]: any} = {
            creeps: {}
        }

        for (let propertyName in properties) {

            room[propertyName] = properties[propertyName]
        }

        const memoryProperties = {


        }
    }
}
