
class TickInit {
    configGeneral() {

        // Chant logic

        if (global.settings.creepChant) {
            if (Memory.chantIndex >= global.settings.creepChant.length - 1) Memory.chantIndex = 0
            else Memory.chantIndex += 1
        }
    }
}

export const tickInit = new TickInit()
