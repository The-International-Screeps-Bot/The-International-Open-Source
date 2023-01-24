const errorSegment = 10
RawMemory.setActiveSegments([errorSegment])

interface ErrorData {
    errors: string[]
}

export default class ErrorExporter {
    public static getSegmentData(): ErrorData {
        const segment = RawMemory.segments[errorSegment]
        if (segment === undefined || segment.length === 0) return { errors: [] }
        else return JSON.parse(RawMemory.segments[errorSegment])
    }

    public static setSegmentData(data: ErrorData): void {
        RawMemory.segments[errorSegment] = JSON.stringify(data)
    }

    public static addErrorToSegment(stack: string): void {
        const data = this.getSegmentData()
        if (JSON.stringify(data).length > 90000) {
            Game.notify(`Error segment (${errorSegment}) is full`)
            return
        }

        data.errors.push(stack)
        this.setSegmentData(data)
    }
}
