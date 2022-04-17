/**
 * Dictates and operates tasks for links
 */
export function linkManager(room: Room) {

    //

    if (!room.storage || room.storage.store.getUsedCapacity(RESOURCE_ENERGY) < 60000) return

    // Get the sourceLinks

    const sourceLinks: (StructureLink | false)[] = [room.get('source1Link'), room.get('source2Link')],

    // Get the reciever links

    recieverLinks: (StructureLink | false)[] = [room.get('fastFillerLink'), room.get('hubLink'), room.get('controllerLink')]

    // Loop through each sourceLink

    for (const sourceLink of sourceLinks) {

        // If the sourceLink is undefined, iterate

        if (!sourceLink) continue

        // If the link is not nearly full, iterate

        if (sourceLink.store.getUsedCapacity(RESOURCE_ENERGY) < 700) continue

        // Otherwise, loop through each recieverLink

        for (const recieverLink of recieverLinks) {

            // If the sourceLink is undefined, iterate

            if (!recieverLink) continue

            // If the link has moved resources this tick, iterate

            if (recieverLink.hasMovedResources) continue

            // If the link is more than half full, iterate

            if (recieverLink.store.getUsedCapacity(RESOURCE_ENERGY) > recieverLink.store.getCapacity(RESOURCE_ENERGY) * 0.5) continue

            // Otherwise, have the sourceLink transfer to the recieverLink

            sourceLink.transferEnergy(recieverLink)

            // Record the recieverLink has moved resources

            recieverLink.hasMovedResources = true

            // And stop the loop

            break
        }
    }
}
