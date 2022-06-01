import './linkFunctions'

/**
 * Dictates and operates tasks for links
 */
export function linkManager(room: Room) {
    //

    if (!room.storage) return

    // Get the receiver links

    const fastFillerLink = room.get('fastFillerLink')
    const hubLink = room.get('hubLink')
    const controllerLink = room.get('controllerLink')

    // Get the sourceLinks

    const sourceLinks: (StructureLink | false)[] = [
        room.get('source1Link'),
        room.get('source2Link'),
    ]

    const receiverLinks: (StructureLink | false)[] = [
        fastFillerLink,
        hubLink,
        controllerLink,
    ]

    room.sourcesToReceivers(sourceLinks, receiverLinks)

    room.hubToFastFiller(hubLink, fastFillerLink)

    room.hubToController(hubLink, controllerLink)
}
