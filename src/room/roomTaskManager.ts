export function taskManager(room: Room) {

    interface RoomTask {
        type: string
        targetID: string
        resourceType: string
        amount: number

        ID: number
    }

    /**
     * @param structure roomObject with a structureType
     * @param type the type of resource to act upon
     * @param taskType type of task. Either withdraw or transfer
     * @param amount number of resources to act on
     */
    class RoomTask {
        constructor(type: string, targetID: string, resourceType: string, amount: number) {

            const task = this

            task.type = type
            task.targetID = targetID
            task.resourceType = resourceType
            task.amount = amount

            task.ID = global.newID()
        }
    }

    const task1 = new RoomTask('withdraw', room.get('storage').id, RESOURCE_ENERGY, 500)

    console.log(task1)
}
