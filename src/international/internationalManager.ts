import { config } from '../international/config'
import { tickConfig } from './tickConfig'

import { creepOrganizer } from '../international/creepOrganizer'
import './internationalFunctions'

/**
 * Handles pre-roomManager, inter room, and multiple-room related matters
 */
export function internationalManager() {

    config()
    tickConfig()

    advancedGeneratePixel()

    creepOrganizer()

}
