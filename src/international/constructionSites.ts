import { Sleepable } from 'utils/sleepable'
import { CollectiveManager } from './collective'
import { Utils, randomIntRange } from 'utils/utils'
import { SegmentsManager } from './segments'

export const IDUpdateInterval = randomIntRange(50, 100)

/**
 * Tracks and records constructionSites and thier age, deleting old sites
 */
export class ConstructionSiteManager {
  static run() {
    if (!Utils.isTickInterval(IDUpdateInterval)) return

    const recordedIDs = SegmentsManager.IDs.constructionSites

    CollectiveManager.constructionSiteCount = 0

    // Initialize uninitialized construction sites

    for (const cSiteID in Game.constructionSites) {
      // If the site's ID is stored in Memory's constructionSites, iterate
      if (recordedIDs[cSiteID]) continue

      // Otherwise store it in Memory's constructionSties
      recordedIDs[cSiteID] = 0
    }

    // Update and manage construction sites

    for (const cSiteID in recordedIDs) {
      // Try to find the site using the recorded ID
      const cSite = Game.constructionSites[cSiteID]

      // If the site with the recorded ID doesn't exist, remove it

      if (!cSite) {
        recordedIDs[cSiteID] = undefined
        continue
      }

      const cSiteAge = recordedIDs[cSiteID]

      // If the site is past a certain age with respect to progress, delete it

      if (cSiteAge > this.getMaxCSiteAge(cSite)) {
        // Remove the site from the world

        Game.constructionSites[cSiteID].remove()
        recordedIDs[cSiteID] = undefined
      }

      // Otherwise increase the constructionSite's age
      recordedIDs[cSiteID] += 1 * IDUpdateInterval
      CollectiveManager.constructionSiteCount += 1
    }
  }

  static getMaxCSiteAge(cSite: ConstructionSite) {
    return 20000 + cSite.progress * 5
  }
}
