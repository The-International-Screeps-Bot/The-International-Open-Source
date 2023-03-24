import { customLog } from 'international/utils'
import { CommuneManager } from './commune'

export class SourceManager {
    communeManager: CommuneManager
    sources: Source[]

    constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    preTickRun() {
        this.sources = this.communeManager.room.find(FIND_SOURCES)

        this.estimateIncome()
    }

    run() {
        this.createPowerTasks()
    }

    private estimateIncome() {
        const { room } = this.communeManager

        room.estimatedSourceIncome = []

        for (let i = 0; i < this.sources.length; i += 1) {
            const source = this.sources[i]

            let effect = source.effectsData.get(PWR_DISRUPT_SOURCE) as PowerEffect
            if (effect) continue

            let income = SOURCE_ENERGY_CAPACITY / ENERGY_REGEN_TIME

            effect = source.effectsData.get(PWR_REGEN_SOURCE) as PowerEffect
            if (effect)
                income += POWER_INFO[PWR_REGEN_SOURCE].effect[effect.level - 1] / POWER_INFO[PWR_REGEN_SOURCE].period

            room.estimatedSourceIncome[i] = income
        }
    }

    private createPowerTasks() {
        if (!this.communeManager.room.myPowerCreepsAmount) return

        for (const source of this.sources) {
            this.communeManager.room.createPowerTask(source, PWR_REGEN_SOURCE, 10)
        }
    }
}
