import { randomTick } from './utils'

class CentralPlanner {
    /**
     * The number of minerals in communes
     */
    mineralCommunes: { [key in MineralConstant]: number }

    public run() {}

    update() {
        if (randomTick()) {
            delete this._mineralPriority
            delete this._funnelOrder
        }
    }

    private weightLabOutputs() {}
    private planLabs() {}

    /**
     * The priority for claiming new rooms, for each mineral
     */
    _mineralPriority: Partial<{ [key in MineralConstant]: number }>

    /**
     * The priority for claiming new rooms, for each mineral
     */
    get mineralPriority() {

        if (this._mineralPriority) return this._mineralPriority

        this._mineralPriority = {}

        for (const resource of MINERALS) {

            this._mineralPriority[resource] = this.mineralCommunes[resource]
        }

        return this._mineralPriority
    }

    _funnelOrder: string[]


    get funnelOrder() {
        if (this._funnelOrder) return this._funnelOrder

        this._funnelOrder = Array.from(global.communes).sort((a, b) => {
            const controllerA = Game.rooms[a].controller
            const controllerB = Game.rooms[b].controller
            return (controllerA.level + controllerA.progressTotal / controllerA.progress) - (controllerB.level + controllerB.progressTotal / controllerB.progress)
        })

        return this._funnelOrder
    }
}

export const centralPlanner = new CentralPlanner()
