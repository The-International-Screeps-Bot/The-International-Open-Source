import { Result, SegmentIDs } from "./constants"

class SegmentsManager {

  run() {
    // See if our dumby segment is alive

    const sampleSegment = RawMemory.segments[SegmentIDs.General]
    if (sampleSegment === undefined || !sampleSegment.length) {

      // We can assume that no segments are alive: set them alive and ask the bot to stop everything else for the current tick

      RawMemory.setActiveSegments(
        [
          SegmentIDs.General,
          SegmentIDs.BasePlans,
          SegmentIDs.Errors
        ])
      return Result.stop
    }

    return Result.success
  }

  endRun() {

    if (this._basePlans) RawMemory.segments[SegmentIDs.BasePlans] = JSON.stringify(this._basePlans)

    // reset intra-tick values

    this._basePlans = undefined
  }

  private _basePlans: BasePlansSegment
  get basePlans() {
    if (this._basePlans) return this._basePlans

    return this._basePlans = JSON.parse(RawMemory.segments[SegmentIDs.BasePlans])
  }
}

export const segmentsManager = new SegmentsManager()
