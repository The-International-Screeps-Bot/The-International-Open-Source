import { customLog } from 'utils/logging'
import { CommuneManager } from './commune'
import { roomUtils } from 'room/roomUtils'

export class SourceManager {
    communeManager: CommuneManager

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {
        this.createPowerTasks()
    }

    private createPowerTasks() {
        if (!this.communeManager.room.myPowerCreeps.length) return

        const sources = roomUtils.getSources(this.communeManager.room)
        for (const source of sources) {
            this.communeManager.room.createPowerTask(source, PWR_REGEN_SOURCE, 10)
        }
    }
}
