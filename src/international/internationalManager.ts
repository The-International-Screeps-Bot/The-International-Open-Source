import { config } from '../international/config'
import { tickConfig } from './tickConfig'

import { creepOrganizer } from '../international/creepOrganizer'
import { mapVisualsManager } from './mapVisualsManager'
import { generalFuncs } from './generalFunctions'

/**
 * Handles pre-roomManager, inter room, and multiple-room related matters
 */
export function internationalManager() {

    config()
    tickConfig()

    creepOrganizer()

    generalFuncs.advancedGeneratePixel()

    mapVisualsManager()
}
