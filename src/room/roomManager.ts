import { CreepRoleManager } from "./creeps/creepRoleManager"
import { EndTickCreepManager } from "./creeps/endTickCreepManager"
import { RoomVisualsManager } from "./roomVisuals"

export class RoomManager {

    creepRoleManager: CreepRoleManager
    endTickCreepManager: EndTickCreepManager
    roomVisualsManager: RoomVisualsManager

    constructor() {
        this.creepRoleManager = new CreepRoleManager(this)
        this.endTickCreepManager = new EndTickCreepManager(this)
        this.roomVisualsManager = new RoomVisualsManager(this)
    }

    room: Room

    public update(room: Room) {
        this.room = room
    }

    public run() {
        this.creepRoleManager.run()
        this.endTickCreepManager.run()
        this.roomVisualsManager.run()
    }
}
