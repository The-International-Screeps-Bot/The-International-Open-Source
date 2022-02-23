import './towerFunctions'

/**
 * Dictates and operates tasks for towers
 */
export function towerManager(room: Room) {

    room.towersRequestResources()

    room.towersHealCreeps()
}
