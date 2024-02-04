import { Result, SegmentIDs } from '../constants/general'

export class SegmentsManager {
  static run() {
    // See if our dumby segment is alive

    const sampleSegment = RawMemory.segments[SegmentIDs.general]
    if (sampleSegment === undefined) {
      this.setSegments()
      return Result.stop
    }

    return Result.success
  }

  private static setSegments() {
    // We can assume that no segments are alive: set them alive and ask the bot to stop everything else for the current tick

    RawMemory.setActiveSegments([
      SegmentIDs.general,
      SegmentIDs.basePlans,
      SegmentIDs.IDs,
      SegmentIDs.errors,
    ])

    console.log('activating segments, should take one tick')
  }

  static endRun() {
    if (this._basePlans) RawMemory.segments[SegmentIDs.basePlans] = JSON.stringify(this._basePlans)
    // reset intra-tick values
    this._basePlans = undefined

    if (this._IDs) RawMemory.segments[SegmentIDs.IDs] = JSON.stringify(this._IDs)
    this._IDs = undefined
  }

  private static _basePlans: BasePlansSegment
  static get basePlans(): BasePlansSegment {
    if (this._basePlans) return this._basePlans

    return (this._basePlans = JSON.parse(RawMemory.segments[SegmentIDs.basePlans]))
  }

  private static _IDs: IDsSegment
  static get IDs(): IDsSegment {
    if (this._IDs) return this._IDs

    return (this._IDs = JSON.parse(RawMemory.segments[SegmentIDs.IDs]))
  }
}
