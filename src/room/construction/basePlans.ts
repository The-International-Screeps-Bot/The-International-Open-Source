import { customLog, packXYAsNum, splitStringAt } from 'international/utils'
import { packCoord, packBasePlanCoord, packXYAsCoord, unpackBasePlanCoords } from 'other/codec'
import { encode, decode } from 'base32768'
import { allStructureTypes } from 'international/constants'

export class BasePlans {
    map: { [packedCoord: string]: BasePlanCoord[] }

    constructor(map?: { [packedCoord: string]: BasePlanCoord[] }) {
        this.map = map || {}
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

        const mapData = packedMap.split('_')

        for (const data of mapData) {
            if (!data.length) continue
            const [packedCoord, coordData] = splitStringAt(data, 2)

            plans.map[packedCoord] = unpackBasePlanCoords(coordData)
        }

        return plans
    }
}
