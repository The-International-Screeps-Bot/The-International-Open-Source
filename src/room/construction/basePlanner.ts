import { Stamp } from "./stamp";

/**
 * Checks if a room can be planner. If it can, it informs information on how to build the room
 */
export function basePlanner(room: Room): boolean {

    function findAnchor() {


    }

    const anchor = findAnchor()

    const fastFiller = new Stamp('fastFiller', room, anchor)

    const fastFillerResult = fastFiller.plan()
    if (!fastFillerResult) return false

    fastFiller.showVisuals()

    return true
}
