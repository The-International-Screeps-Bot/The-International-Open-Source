import { InternationalManager } from './international'

/**
 * Tracks and records constructionSites and thier age, deleting old sites
 */
class ConstructionSiteManager {
    run() {
        // Loop through my sites

        for (const cSiteID in Game.constructionSites) {
            // If the site's ID is stored in Memory's constructionSites, iterate

            if (Memory.constructionSites[cSiteID]) continue

            // Otherwise store it in Memory's constructionSties

            Memory.constructionSites[cSiteID] = 0
        }

        // Loop through recorded site IDs

        for (const cSiteID in Memory.constructionSites) {
            // Try to find the site using the recorded ID

            const cSite = Game.constructionSites[cSiteID]

            // If the site with the recorded ID doesn't exist, remove it

            if (!cSite) {

                delete Memory.constructionSites[cSiteID]
                continue
            }

            // Find the site's age

            const cSiteAge = Memory.constructionSites[cSiteID]

            // If the site is past a certain age in respect to progress

            if (cSiteAge > 20000 + cSiteAge * cSite.progress) {
                // Remove the site from the world

                Game.constructionSites[cSiteID].remove()
                delete Memory.constructionSites[cSiteID]
            }

            // Otherwise increase the constructionSite's age

            Memory.constructionSites[cSiteID] += 1
        }
    }
}

export const constructionSiteManager = new ConstructionSiteManager()
