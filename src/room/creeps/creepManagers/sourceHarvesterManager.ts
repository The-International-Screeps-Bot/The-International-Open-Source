import { RoleSourceHarvester } from "../creepClasses"
import './sourceHarvesterFunctions'

export function sourceHarvesterManager(room: Room, creepsOfRole: RoleSourceHarvester[]) {

    for (const creep of creepsOfRole) {

        creep.sayHi()

        continue

        creep.travelToSource()
    }
}
