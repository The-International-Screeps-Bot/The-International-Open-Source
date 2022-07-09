import './linkFunctions'

/**
 * Dictates and operates tasks for links
 */
export function linkManager(room: Room) {
     //

     if (!room.storage) return

     // Get the sourceLinks

     const sourceLinks: (StructureLink | false)[] = [room.source1Link, room.source2Link]

     const receiverLinks: (StructureLink | false)[] = [room.fastFillerLink, room.hubLink, room.controllerLink]

     room.sourcesToReceivers(sourceLinks, receiverLinks)

     room.hubToFastFiller(room.hubLink, room.fastFillerLink)

     room.hubToController(room.hubLink, room.controllerLink)
}
