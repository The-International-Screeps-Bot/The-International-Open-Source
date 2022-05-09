import './linkFunctions'

/**
 * Dictates and operates tasks for links
 */
export function linkManager(room: Room) {

    //

    if (!room.storage) return

    // Get the receiver links

    const fastFillerLink = room.get('fastFillerLink'),
        hubLink = room.get('hubLink'),
        controllerLink = room.get('controllerLink'),

        // Get the sourceLinks

        sourceLinks: (StructureLink | false)[] = [
            room.get('source1Link'),
            room.get('source2Link')
        ],

        receiverLinks: (StructureLink | false)[] = [
            fastFillerLink,
            hubLink,
            controllerLink
        ]

    room.sourcesToReceivers(sourceLinks, receiverLinks)

    room.hubToFastFiller(hubLink, fastFillerLink)

    room.hubToController(hubLink, controllerLink)
}
