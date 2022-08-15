import { upgraderSpawningWhenStorageThreshold } from 'international/constants'

Room.prototype.linkManager = function() {

     if (!this.storage) return

     // Get the sourceLinks

     const sourceLinks = this.sourceLinks

     const receiverLinks = [this.fastFillerLink, this.hubLink, this.controllerLink]

     this.sourcesToReceivers(sourceLinks, receiverLinks)

     this.hubToFastFiller(this.hubLink, this.fastFillerLink)

     this.hubToController(this.hubLink, this.controllerLink)
}

Room.prototype.sourcesToReceivers = function (sourceLinks, receiverLinks) {
     // Loop through each sourceLink

     for (const sourceLink of sourceLinks) {
          // If the sourceLink is undefined, iterate

          if (!sourceLink) continue

          // If the link is not nearly full, iterate

          if (sourceLink.store.getCapacity(RESOURCE_ENERGY) - sourceLink.store.energy > 100) continue

          // Otherwise, loop through each receiverLink

          for (const receiverLink of receiverLinks) {
               // If the sourceLink is undefined, iterate

               if (!receiverLink) continue

               // If the link is more than 25% full, iterate

               if (receiverLink.store.energy > receiverLink.store.getCapacity(RESOURCE_ENERGY) * 0.25) continue

               // Otherwise, have the sourceLink transfer to the receiverLink

               sourceLink.transferEnergy(receiverLink)

               receiverLink.store.energy += sourceLink.store.energy
               sourceLink.store.energy -= receiverLink.store.getCapacity(RESOURCE_ENERGY) - receiverLink.store.energy

               // And stop the loop

               break
          }
     }
}

Room.prototype.hubToFastFiller = function (hubLink, fastFillerLink) {
     // If the hubLink or fastFillerLink aren't defined, stop

     if (!hubLink || !fastFillerLink) return

     // If the hubLink is not sufficiently full, stop

     if (hubLink.store.getCapacity(RESOURCE_ENERGY) - hubLink.store.energy > 100) return

     // If the fastFillerLink is more than 25% full, stop

     if (fastFillerLink.store.energy > fastFillerLink.store.getCapacity(RESOURCE_ENERGY) * 0.25) return

     // Otherwise, have the sourceLink transfer to the recieverLink

     hubLink.transferEnergy(fastFillerLink)

     fastFillerLink.store.energy += hubLink.store.energy
     hubLink.store.energy -= fastFillerLink.store.getCapacity(RESOURCE_ENERGY) - fastFillerLink.store.energy
}

Room.prototype.hubToController = function (hubLink, controllerLink) {
     // If the controller is close to downgrading and the storage has insufficient energy, stop

     if (
          this.controller.ticksToDowngrade > 10000 &&
          this.storage.store.energy < upgraderSpawningWhenStorageThreshold - 30000
     )
          return

     // If the hubLink or controllerLink aren't defined, stop

     if (!hubLink || !controllerLink) return

     // If the hubLink is not sufficiently full, stop

     if (hubLink.store.getCapacity(RESOURCE_ENERGY) - Math.min(hubLink.store.energy, hubLink.store.getCapacity(RESOURCE_ENERGY)) > 100) return

     // If the controllerLink is more than 25% full, stop

     if (controllerLink.store.energy > controllerLink.store.getCapacity(RESOURCE_ENERGY) * 0.25) return

     // Otherwise, have the sourceLink transfer to the recieverLink

     hubLink.transferEnergy(controllerLink)

     controllerLink.store.energy += hubLink.store.energy
     hubLink.store.energy -= controllerLink.store.getCapacity(RESOURCE_ENERGY) - controllerLink.store.energy
}
