import { findObjectWithID } from "international/generalFunctions"

Creep.prototype.reservationManager = function () {

    let reservation
    let target

    for (let index = 0; index < this.memory.reservations.length; index++) {

        reservation = this.memory.reservations[index]

        target = findObjectWithID(reservation.targetID)

        if (!target) this.memory.reservations.splice(index, 1)

        if (target.amount) {

            
        }

        target.store || target.amount
    }
}

Creep.prototype.createReservation = function () {}
