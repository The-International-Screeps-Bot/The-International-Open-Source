import { CreepRoleManager } from "./creeps/creepRoleManager"
import { EndTickCreepManager } from "./creeps/endTickCreepManager"

export class RoomManager {

    creepRoleManager: CreepRoleManager
    endTickCreepManager: EndTickCreepManager

    constructor() {
        this.creepRoleManager = new CreepRoleManager(this)
        this.endTickCreepManager = new EndTickCreepManager(this)
    }

    room: Room

    public update(room: Room) {
        this.room = room
    }

    public run() {
        this.creepRoleManager.run()
        this.endTickCreepManager.run()
        this.room.roomVisualsManager()
    }
}
