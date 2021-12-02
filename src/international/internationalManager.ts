import { config } from '../international/config'
import { tickConfig } from './tickConfig'

import { creepOrganizer } from '../international/creepOrganizer'

export function internationalManager() {

    config()
    tickConfig()

    creepOrganizer()

}
