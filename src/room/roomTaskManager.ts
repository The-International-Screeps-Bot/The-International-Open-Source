import { RoomWithdrawTask } from './tasks'

export function taskManager(room: Room) {

    const task1 = new RoomWithdrawTask(room.get('storage').id, RESOURCE_ENERGY, 500)

    console.log(task1)
}
