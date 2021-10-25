export function taskManager(room: Room) {

    interface Task {
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
    class Task {
        constructor(structure: object, resourceType: string, taskType: string, amount: number) {


        }
    }

    const task1 = new Task(room.get("storage"), RESOURCE_ENERGY, 'withdraw', 500)

    console.log(task1)
}
