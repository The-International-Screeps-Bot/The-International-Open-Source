import { RoomDeliverTask } from './tasks'

export function taskManager(room: Room) {

    const task1 = new RoomDeliverTask(RESOURCE_ENERGY, 500, undefined, room.get('storage').id)

    console.log(task1)
}
