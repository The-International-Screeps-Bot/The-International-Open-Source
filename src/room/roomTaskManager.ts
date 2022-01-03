import { constants } from 'international/constants'
import { RoomDeliverTask } from './tasks'

export function taskManager(room: Room) {

    const task1 = new RoomDeliverTask(room.name, RESOURCE_ENERGY, 500, undefined, room.get('storage').id)

    global.customLog('TASK TEST: ', global[room.name].tasksWithoutResponders, undefined, constants.colors.green)
}
