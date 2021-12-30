import { ControllerUpgrader } from '../creepClasses'
import './controllerUpgraderFunctions'


export function controllerUpgraderManager(room: Room, creepsOfRole: string[]) {

    for (const creepName of creepsOfRole) {

        const creep: ControllerUpgrader = Game.creeps[creepName]

        creep.advancedUpgradeController()
    }
}
