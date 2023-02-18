import { packXYAsNum } from 'international/utils'
import { packCoord, packPlanCoord, packXYAsCoord } from 'other/codec'

export class BasePlans {
    map: { [packedCoord: string]: PlanCoord }

    constructor(map?: { [packedCoord: string]: PlanCoord }) {
        this.map = map || {}
    }
    set(packedCoord: string, structureType: StructureConstant, minRCL: number) {
        const planCoord = this.map[packedCoord]
        if (!planCoord) {
            this.map[packedCoord] = {
                structureType,
                minRCL,
            }
            return
        }

        if (planCoord.structureType !== structureType) {
            planCoord.structureType = structureType
            planCoord.minRCL = minRCL
            return
        }

        // The structureTypes are the same

        planCoord.minRCL = Math.min(planCoord.minRCL, minRCL)
        return
    }
    setXY(x: number, y: number, structureType: StructureConstant, minRCL: number) {
        return this.set(packXYAsCoord(x, y), structureType, minRCL)
    }
    get(packedCoord: string) {
        return this.map[packedCoord]
    }
    getXY(x: number, y: number) {
        return this.get(packXYAsCoord(x, y))
    }
}
