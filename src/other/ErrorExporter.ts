import { SegmentIDs } from "international/constants"

RawMemory.setActiveSegments([SegmentIDs.Errors])

/**
 * Rather cpu intensive and unavoidably inefficient. Try to avoid this needing to ba called
 */
export class ErrorExporter {
    public getSegmentData(): ErrorsSegment {
        const segment = RawMemory.segments[SegmentIDs.Errors]
        if (segment === undefined || segment.length === 0) return { errors: [] }
        else return JSON.parse(RawMemory.segments[SegmentIDs.Errors])
    }

    public setSegmentData(data: ErrorsSegment): void {
        RawMemory.segments[SegmentIDs.Errors] = JSON.stringify(data)
    }

    public addErrorToSegment(stack: string, version?: number): void {
        const data = this.getSegmentData()
        if (JSON.stringify(data).length > 90000) {
            Game.notify(`Error segment (${SegmentIDs.Errors}) is almost full`)
            return
        }

        data.errors.push(stack)
        if (version) data.version = version
        this.setSegmentData(data)
    }
}

export const errorExporter = new ErrorExporter()
