let allyList = require("allyList")
require("roomFunctions")

Room.prototype.attackHostiles = function(towers, creeps) {

    let target

    let hostiles = room.find(FIND_HOSTILE_CREEPS, {
        filter: hostileCreep => {
            return !allyList.includes(hostileCreep.owner.username.toLowerCase()) && hostileCreep.hasPartsOfTypes([ATTACK, RANGED_ATTACK, HEAL, WORK, CARRY, CLAIM])
        }
    })

    if (hostiles.length == 0) return false

    let enemyHealers = room.find(FIND_HOSTILE_CREEPS, {
        filter: hostileCreep => {
            return !allyList.includes(hostileCreep.owner.username.toLowerCase()) && hostileCreep.hasPartsOfTypes([HEAL])
        }
    })

    if (enemyHealers.length > 0) {

        function findBestTarget() {

            for (let minDamage = towers.length * TOWER_POWER_ATTACK; minDamage > 100; minDamage -= 100) {

                for (let hostile of hostiles) {

                    if (room.findTowerDamage(towers, hostile.pos) - room.findHealPower(hostile.pos, 1, enemyHealers) >= minDamage) return hostile
                }
            }
        }

        target = findBestTarget()

    } else {

        const anchorPoint = room.memory.anchorPoint

        if (!anchorPoint) return

        target = new RoomPosition(anchorPoint.x, anchorPoint.y, anchorPoint.roomName).findClosestByRange(hostiles)
    }

    if (!target) return false

    for (let tower of towers) {

        tower.attack(target)

        room.visual.text("⚔️ ", tower.pos.x + 1, tower.pos.y, { align: 'left' })
    }

    return true
}