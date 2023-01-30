import { creepRoles, powerCreepClassNames } from 'international/constants'
import { cleanRoomMemory } from 'international/utils'
import { CommuneManager } from './commune/commune'
import { DroppedResourceManager } from './droppedResources'
import { ContainerManager } from './container'
import { CreepRoleManager } from './creeps/creepRoleManager'
import { EndTickCreepManager } from './creeps/endTickCreepManager'
import { PowerCreepRoleManager } from './creeps/powerCreepRoleManager'
import { RoomVisualsManager } from './roomVisuals'

export class RoomManager {
    containerManager: ContainerManager
    droppedResourceManager: DroppedResourceManager

    creepRoleManager: CreepRoleManager
    powerCreepRoleManager: PowerCreepRoleManager
    endTickCreepManager: EndTickCreepManager
    roomVisualsManager: RoomVisualsManager

    constructor() {
        this.containerManager = new ContainerManager(this)
        this.droppedResourceManager = new DroppedResourceManager(this)

        this.creepRoleManager = new CreepRoleManager(this)
        this.powerCreepRoleManager = new PowerCreepRoleManager(this)
        this.endTickCreepManager = new EndTickCreepManager(this)
        this.roomVisualsManager = new RoomVisualsManager(this)
    }

    room: Room

    public update(room: Room) {
        this.room = room
    }

    preTickRun() {
        const { room } = this
        const roomMemory = room.memory

        // Every 100~ ticks

        if (Game.time - roomMemory.LST > Math.floor(Math.random() * 200)) {
            room.basicScout()
            cleanRoomMemory(room.name)
        }

        room.moveRequests = {}
        room.creepPositions = {}
        room.powerCreepPositions = {}

        // Single tick properties

        room.myCreeps = {}
        for (const role of creepRoles) room.myCreeps[role] = []

        room.myPowerCreeps = {}
        for (const className of powerCreepClassNames) room.myPowerCreeps[className] = []

        room.myCreepsAmount = 0
        room.myPowerCreepsAmount = 0

        room.creepsOfSource = []

        room.partsOfRoles = {}
        room.powerTasks = {}

        for (const index in room.sources) room.creepsOfSource.push([])

        room.squadRequests = new Set()

        if (room.memory.T === 'remote') {
            room.roomLogisticsRequests = {
                transfer: {},
                withdraw: {},
                offer: {},
                pickup: {},
            }
            return
        }

        // Check if the room is a commune

        if (!room.controller) return

        if (!room.controller.my) {
            if (room.memory.T === 'commune') {
                room.basicScout()
                cleanRoomMemory(room.name)
            }
            return
        }

        room.communeManager = global.communeManagers[room.name]

        if (!room.communeManager) {
            room.communeManager = new CommuneManager()
            global.communeManagers[room.name] = room.communeManager
        }

        room.communeManager.update(room)
        room.communeManager.preTickRun()
    }

    public run() {
        if (this.room.memory.T === 'remote') {
            this.containerManager.runRemote()
            this.droppedResourceManager.runRemote()
        }

        this.creepRoleManager.run()
        this.powerCreepRoleManager.run()
        this.endTickCreepManager.run()
        this.roomVisualsManager.run()
    }
}
