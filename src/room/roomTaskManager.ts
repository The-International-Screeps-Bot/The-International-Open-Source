export function taskManager(room: Room) {

    interface RoomTask {
        structure: object
        resourceType: string
        taskType: string
        amount: number
    }

    /**
     * @param structure roomObject with a structureType
     * @param resourceType the type of resource to act upon
     * @param taskType type of task. Either withdraw or transfer
     * @param amount number of resources to act on
     */
    class RoomTask {
        constructor(taskType: string, targetID: string, resourceType: string, amount: number) {

            
        }
    }

    const task1 = new RoomTask('withdraw', room.get('storage').id, RESOURCE_ENERGY, 500)

    console.log(task1)
}
