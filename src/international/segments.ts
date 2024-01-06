import { Result, SegmentIDs } from './constants'

class SegmentsManager {
  run() {
    // See if our dumby segment is alive

    const sampleSegment = RawMemory.segments[SegmentIDs.general]
    if (sampleSegment === undefined) {
      this.setSegments()
      return Result.stop
    }

    return Result.success
  }

  private setSegments() {
    // We can assume that no segments are alive: set them alive and ask the bot to stop everything else for the current tick

    RawMemory.setActiveSegments([
      SegmentIDs.general,
      SegmentIDs.basePlans,
      SegmentIDs.IDs,
      SegmentIDs.errors,
    ])

    console.log('activating segments, should take one tick')
  }

  endRun() {
    if (this._basePlans) RawMemory.segments[SegmentIDs.basePlans] = JSON.stringify(this._basePlans)
    // reset intra-tick values
    this._basePlans = undefined

    if (this._IDs) RawMemory.segments[SegmentIDs.IDs] = JSON.stringify(this._IDs)
    this._IDs = undefined
  }

  private _basePlans: BasePlansSegment
  get basePlans(): BasePlansSegment {
    if (this._basePlans) return this._basePlans

    return (this._basePlans = JSON.parse(RawMemory.segments[SegmentIDs.basePlans]))
  }

  private _IDs: IDsSegment
  get IDs(): IDsSegment {
    if (this._IDs) return this._IDs

    return (this._IDs = JSON.parse(RawMemory.segments[SegmentIDs.IDs]))
  }
}

export const segmentsManager = new SegmentsManager()
