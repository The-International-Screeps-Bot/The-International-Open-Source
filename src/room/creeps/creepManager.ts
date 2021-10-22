import { harvesterManager } from "./creepManagers/harvesterManager"

export function creepManager(room: object, creepsOfRole: {[key: string]: string}) {

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

        if (creepsOfRole[role].length == 0) continue

        // Add creeps of role to managerParent's creeps

        managerParent.creepsOfRole = creepsOfRole[role]

        // Run manager

        managerParent.manager()
    }
}
