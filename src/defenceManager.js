module.exports = function defenceManager(room) {

    const controller = room.get("controller")

    useSafeMode()

    function useSafeMode() {

        // Stop if safeMode is active

        if (!controller.safeMode) return

        // Stop if there are no safeModes left

        if (controller.safeModeCooldown > 0) return

        // Stop if there is a safeModes cooldown

        if (controller.safeModeCooldown > 0) return

        // Find if there is an attack last tick

        let combatEvents = room.getEventLog().filter(eventObject => eventObject.event == EVENT_ATTACK)

        // decide what we will safeModes over the bot attacking

        let importantStructureTypes = [
            STRUCTURE_SPAWN,
            STRUCTURE_EXTENSION,
            STRUCTURE_TOWER,
            STRUCTURE_STORAGE,
            STRUCTURE_TERMINAL,
            STRUCTURE_FACTORY,
            STRUCTURE_NUKER,
            STRUCTURE_POWER_SPAWN,
            STRUCTURE_LAB,
            STRUCTURE_OBSERVER,
        ]

        // Loop through events

        for (let event of combatEvents) {

            // Find out what was attacked

            let target = Game.getObjectById(event.data.targetId)

            // Iterate if we don't want to safeMode over what was attacked

            if (!importantStructureTypes.includes(target.structureType)) continue

            // Activate safe mode

            room.activateSafeMode()
        }
    }
}