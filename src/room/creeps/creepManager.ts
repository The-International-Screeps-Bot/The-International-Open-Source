import './creepFunctions'

import { harvesterManager } from './creepManagers/harvesterManager'
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
        harvester: new ManagerParent(harvesterManager),
    }

    for (let role in managerParents) {

        let managerParent = managerParents[role]

        // Iterate if there are no creeps of managerParent's role

        if (room.myCreeps[role].length == 0) continue

        // Add creeps of role to managerParent's creeps

        managerParent.creepsOfRole = room.myCreeps[role]

        // Run manager

        managerParent.manager()
    }
}
