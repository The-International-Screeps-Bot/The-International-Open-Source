import './creepClasses'

import './creepFunctions'

import { sourceHarvesterManager } from './creepManagers/sourceHarvesterManager'
import { haulerManager } from './creepManagers/haulerManager'
import { mineralHarvesterManager } from './creepManagers/mineralHarvesterManager'

export function creepManager(room: Room) {

    interface ManagerParent {
        manager: any
        creepsOfRole: object[]
    }

    class ManagerParent {
        constructor(manager: any) {

            this.manager = manager
            this.creepsOfRole = []
        }
    }

    const managerParents: {[key: string]: any} = {
        sourceHarvester: new ManagerParent(sourceHarvesterManager),
        hauler: new ManagerParent(haulerManager),
    }

    for (let role in managerParents) {

        let managerParent = managerParents[role]

        // Iterate if there are no creeps of managerParent's role

        if (room.myCreeps[role].length == 0) continue

        // Run manager

        managerParent.manager(room, room.myCreeps[role])
    }
}
