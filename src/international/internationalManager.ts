import { config } from '../international/config'
import { tickConfig } from './tickConfig'

import { creepOrganizer } from '../international/creepOrganizer'
import { mapVisualsManager } from './mapVisualsManager'
import { advancedGeneratePixel } from './generalFunctions'
import { allyManager } from 'room/market/simpleAllies'
import { remoteNeedsManager } from './remoteNeedsManager'

/**
 * Handles pre-roomManager, inter room, and multiple-room related matters
 */
export function internationalManager() {

    config()
    tickConfig()

    // Handle ally requests

    allyManager.tickConfig()
    allyManager.getAllyRequests()

    creepOrganizer()

    remoteNeedsManager()

    advancedGeneratePixel()

    mapVisualsManager()
}
