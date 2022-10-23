import { CommuneManager } from "./communeManager"

export class SourceManager {
    communeManager: CommuneManager
    sources: Source[]

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    run() {

        this.sources = this.communeManager.room.sources

        this.createPowerTasks()
    }

    createPowerTasks() {

        if (!this.communeManager.room.myPowerCreepsAmount) return

        for (const source of this.sources) {

            this.communeManager.room.createPowerTask(source, PWR_REGEN_SOURCE, 10)
        }
    }
}
