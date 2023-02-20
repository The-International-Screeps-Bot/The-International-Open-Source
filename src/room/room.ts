import { creepRoles, powerCreepClassNames, roomTypesUsedForStats } from 'international/constants'
import { cleanRoomMemory } from 'international/utils'
import { CommuneManager } from './commune/commune'
import { DroppedResourceManager } from './droppedResources'
import { ContainerManager } from './container'
import { CreepRoleManager } from './creeps/creepRoleManager'
import { EndTickCreepManager } from './creeps/endTickCreepManager'
import { PowerCreepRoleManager } from './creeps/powerCreepRoleManager'
import { RoomVisualsManager } from './roomVisuals'
import { statsManager } from 'international/statsManager'
import { CommunePlanner } from './communePlanner'
import { TombstoneManager } from './tombstones'
import { RuinManager } from './ruins'

export class RoomManager {
    communePlanner: CommunePlanner
    containerManager: ContainerManager
    droppedResourceManager: DroppedResourceManager
    tombstoneManager: TombstoneManager
    ruinManager: RuinManager

    creepRoleManager: CreepRoleManager
    powerCreepRoleManager: PowerCreepRoleManager
    endTickCreepManager: EndTickCreepManager
    roomVisualsManager: RoomVisualsManager

    constructor() {
        this.communePlanner = new CommunePlanner(this)
        this.containerManager = new ContainerManager(this)
        this.droppedResourceManager = new DroppedResourceManager(this)
        this.tombstoneManager = new TombstoneManager(this)
        this.ruinManager = new RuinManager(this)

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

        // If it hasn't been scouted for 100~ ticks

        if (Game.time - roomMemory.LST > Math.floor(Math.random() * 200)) {
            room.basicScout()
            cleanRoomMemory(room.name)
        }

        const roomType = roomMemory.T
        if (Memory.roomStats > 0 && roomTypesUsedForStats.includes(roomType))
            statsManager.roomPreTick(room.name, roomType)

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

        if (roomMemory.T === 'remote') {
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
            if (roomMemory.T === 'commune') {
                delete roomMemory.T

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

        if (this.room.name === 'W7N3') this.communePlanner.preTickRun()
    }

    public run() {
        if (this.room.memory.T === 'remote') {
            this.containerManager.runRemote()
            this.droppedResourceManager.runRemote()
            this.tombstoneManager.runRemote()
            this.ruinManager.runRemote()
        }

        this.creepRoleManager.run()
        this.powerCreepRoleManager.run()
        this.endTickCreepManager.run()
        this.roomVisualsManager.run()
    }
}
