import { packXYAsNum } from 'international/utils'
import { packCoord, packBasePlanCoord, packXYAsCoord } from 'other/codec'
import { encode, decode } from 'base32768'
import { allStructureTypes } from 'international/constants'

export class BasePlans {
    map: { [packedCoord: string]: BasePlanCoord }

    constructor(map?: { [packedCoord: string]: BasePlanCoord }) {
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
    pack() {
        let str = ''

        for (const packedCoord in this.map) {
            str += packedCoord + packBasePlanCoord(this.map[packedCoord])
        }

        return str
    }
    static unpack(packedMap: string) {
        const plans = new BasePlans()

        for (let i = 0; i < packedMap.length; i += 4) {
            const data = decode(packedMap[i + 2] + packedMap[i + 3])
            plans.map[packedMap[i] + packedMap[i + 1]] = {
                structureType: allStructureTypes[data[0]],
                minRCL: data[1],
            }
        }

        return plans
    }
}
