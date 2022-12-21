import { InternationalManager } from './international'

let cSiteID
let cSite
let cSiteAge

InternationalManager.prototype.constructionSiteManager = function () {
    // Loop through my sites

    for (cSiteID in Game.constructionSites) {
        // If the site's ID is stored in Memory's constructionSites, iterate

        if (Memory.constructionSites[cSiteID]) continue

        // Otherwise store it in Memory's constructionSties

        Memory.constructionSites[cSiteID] = 0
    }

    // Loop through recorded site IDs

    for (cSiteID in Memory.constructionSites) {
        // Try to find the site using the recorded ID

        cSite = Game.constructionSites[cSiteID]

        // If the site with the recorded ID doesn't exist

        if (!cSite) {
            // Delete it from memory and iterate

            delete Memory.constructionSites[cSiteID]
            continue
        }

        // Find the site's age

        cSiteAge = Memory.constructionSites[cSiteID]

        // If the site is past a certain age in respect to progress

        if (cSiteAge > 20000 + cSiteAge * cSite.progress) {
            // Remove the site from the world

            Game.constructionSites[cSiteID].remove()

            // Delete the site from memory

            delete Memory.constructionSites[cSiteID]
        }

        // Otherwise increase the constructionSite's age

        Memory.constructionSites[cSiteID] += 1
    }
}
