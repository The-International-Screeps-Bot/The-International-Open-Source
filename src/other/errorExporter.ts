import { SegmentIDs } from '../constants/general'

/**
 * Rather cpu intensive and unavoidably inefficient. Try to avoid this needing to ba called
 */
export class ErrorExporter {
  public static getSegmentData(): ErrorsSegment {
    const segment = RawMemory.segments[SegmentIDs.errors]
    if (segment === undefined || segment.length === 0) return { errors: [] }
    else return JSON.parse(RawMemory.segments[SegmentIDs.errors])
  }

  public static setSegmentData(data: ErrorsSegment): void {
    RawMemory.segments[SegmentIDs.errors] = JSON.stringify(data)
  }

  public static addErrorToSegment(stack: string, version?: number): void {
    const data = this.getSegmentData()
    if (JSON.stringify(data).length > 90000) {
      Game.notify(`Error segment (${SegmentIDs.errors}) is almost full`)
      return
    }

    data.errors.push(stack)
    if (version) data.version = version
    this.setSegmentData(data)
  }
}
