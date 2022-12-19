import { customLog } from 'international/utils'
import { CommuneManager } from './communeManager'

export class ContainerManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    preTickRun() {

        this.runFastFillerContainers()
        this.runSourceContainers()
        this.runControllerContainer()
        this.runMineralContainer()
    }

    private runFastFillerContainers() {


    }

    private runSourceContainers() {


    }

    private runControllerContainer() {


    }

    private runMineralContainer() {


    }
}
