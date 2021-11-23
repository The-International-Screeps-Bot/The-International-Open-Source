import { config } from '../international/config'
import { dataManager } from 'data/dataManager'

import { creepOrganizer } from '../international/creepOrganizer'

export function internationalManager() {

    config()

    dataManager()

    creepOrganizer()
}
