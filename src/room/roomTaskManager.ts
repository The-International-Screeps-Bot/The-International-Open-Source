import { constants } from 'international/constants'
import { RoomDeliverTask } from './tasks'

export function taskManager(room: Room) {

    const tasksWithoutResponders = global[room.name].tasksWithoutResponders
    const tasksWithResponders = global[room.name].tasksWithResponders

    global.customLog('TWOR', JSON.stringify(tasksWithoutResponders))
    global.customLog('TWR', JSON.stringify(tasksWithResponders))
}
