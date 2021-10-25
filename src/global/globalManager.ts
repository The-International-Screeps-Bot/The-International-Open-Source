import './globalFunctions'
import './globalVars'

import { config } from './config'

import { creepOrganizer } from './creepOrganizer'

export function globalManager() {

    config()

    creepOrganizer()
}
