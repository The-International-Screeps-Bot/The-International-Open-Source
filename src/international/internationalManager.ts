import { config } from '../international/config'
import { tickConfig } from './tickConfig'

import { creepOrganizer } from '../international/creepOrganizer'

/**
 * Handles pre-roomManager, inter room, and multiple-room related matters
 */
export function internationalManager() {

    config()
    tickConfig()

    global.advancedGeneratePixel()

    creepOrganizer()

}
