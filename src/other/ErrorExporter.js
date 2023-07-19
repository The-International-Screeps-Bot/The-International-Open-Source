const errorSegment = 10;
RawMemory.setActiveSegments([errorSegment]);
export default class ErrorExporter {
    static getSegmentData() {
        const segment = RawMemory.segments[errorSegment];
        if (segment === undefined || segment.length === 0)
            return { errors: [] };
        else
            return JSON.parse(RawMemory.segments[errorSegment]);
    }
    static setSegmentData(data) {
        RawMemory.segments[errorSegment] = JSON.stringify(data);
    }
    static addErrorToSegment(stack, version) {
        const data = this.getSegmentData();
        if (JSON.stringify(data).length > 90000) {
            Game.notify(`Error segment (${errorSegment}) is almost full`);
            return;
        }
        data.errors.push(stack);
        if (version)
            data.version = version;
        this.setSegmentData(data);
    }
}
