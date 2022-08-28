import { CreepRoleManager } from "./creeps/creepRoleManager"
import { EndTickCreepManager } from "./creeps/endTickCreepManager"

export class RoomManager {

    room: Room
    creepRoleManager: CreepRoleManager
    endTickCreepManager: EndTickCreepManager

    public update(room: Room) {
        this.room = room
        this.creepRoleManager = new CreepRoleManager(this)
        this.endTickCreepManager = new EndTickCreepManager(this)
    }

    public run() {
        this.creepRoleManager.run()
        this.endTickCreepManager.run()
        this.room.roomVisualsManager()
    }
}
