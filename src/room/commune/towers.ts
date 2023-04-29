import { customColors, towerPowers } from 'international/constants'
import { updateStat } from 'international/statsManager'
import {
    customLog,
    estimateTowerDamage,
    findObjectWithID,
    findRangeFromExit,
    isXYInBorder,
    randomTick,
    scalePriority,
} from 'international/utils'
import { packCoord } from 'other/codec'
import { CommuneManager } from './commune'

export class TowerManager {
    communeManager: CommuneManager
    actionableTowerIDs: Id<StructureTower>[]

    public constructor(communeManager: CommuneManager) {
        this.communeManager = communeManager
    }

    public run() {
        const { room } = this.communeManager
        // If CPU logging is enabled, get the CPU used at the start

        if (Memory.CPULogging) var managerCPUStart = Game.cpu.getUsed()

        const towers = this.communeManager.room.roomManager.structures.tower.filter(tower => tower.RCLActionable)
        if (!towers.length) {
            this.communeManager.room.towerInferiority = this.communeManager.room.enemyAttackers.length > 0
            return
        }

        this.actionableTowerIDs = []

        for (const tower of towers) {
            if (tower.nextStore.energy < TOWER_ENERGY_COST) continue

            this.actionableTowerIDs.push(tower.id)
        }

        this.createRoomLogisticsRequests()

        if (!this.attackEnemyCreeps()) return
        if (!this.healCreeps()) return
        if (!this.repairRamparts()) return
        if (!this.repairGeneral()) return

        // If CPU logging is enabled, log the CPU used by this manager

        if (Memory.CPULogging) {
            const cpuUsed = Game.cpu.getUsed() - managerCPUStart
            customLog('Tower Manager', cpuUsed.toFixed(2), {
                textColor: customColors.white,
                bgColor: customColors.lightBlue,
            })
            const statName: RoomCommuneStatNames = 'tmcu'
            updateStat(room.name, statName, cpuUsed)
        }
    }

    findAttackTarget() {
        const { room } = this.communeManager

        if (room.towerAttackTarget) return room.towerAttackTarget

        const attackTargets = room.enemyCreeps
        if (!attackTargets.length) return false

        // Find the enemyCreep the towers can hurt the most, declaring tower inferiority if we can't out-damage a creep

        let highestDamage = 1

        for (const enemyCreep of room.enemyCreeps) {
            const damage = enemyCreep.netTowerDamage

            if (enemyCreep.owner.username === 'Invader') {
                if (damage <= 0) {
                    if (room.towerInferiority) continue
                    room.towerInferiority = true
                    this.createPowerTasks()
                    continue
                }
            } else if (damage * findRangeFromExit(enemyCreep.pos) < enemyCreep.hits) {
                if (room.towerInferiority) continue
                room.towerInferiority = true
                this.createPowerTasks()
                continue
            }

            if (damage < highestDamage) continue

            room.towerAttackTarget = enemyCreep
            highestDamage = damage
        }
        if (!room.towerAttackTarget) return false

        // If we seem to be under attack from a swarm, record that the tower needs help

        if (attackTargets.length >= 15) {
            this.createPowerTasks()
            room.towerInferiority = true
        }

        return room.towerAttackTarget
    }

    attackEnemyCreeps() {
        if (this.communeManager.room.flags.disableTowerAttacks) {
            this.communeManager.room.towerInferiority = this.communeManager.room.enemyAttackers.length > 0
            return true
        }

        if (!this.actionableTowerIDs.length) return false

        const attackTarget = this.findAttackTarget()
        if (!attackTarget) {
            this.scatterShot()
            return true
        }

        for (let i = this.actionableTowerIDs.length - 1; i >= 0; i--) {
            const tower = findObjectWithID(this.actionableTowerIDs[i])

            if (tower.attack(attackTarget) !== OK) continue

            this.actionableTowerIDs.splice(i, 1)

            const hits = (attackTarget.reserveHits -= tower.estimateDamageNet(attackTarget))
            if (hits <= 0) return true
        }

        return true
    }

    /**
     * @description Distribute fire amoung enemies
     * Maybe we can mess up healing
     */
    scatterShot() {
        if (this.actionableTowerIDs.length <= 1) return
        if (!randomTick(200)) return

        const enemyCreeps = this.communeManager.room.enemyCreeps
        if (enemyCreeps.length < 4) return

        let targetIndex = 0

        for (let i = this.actionableTowerIDs.length - 1; i >= 0; i--) {
            const tower = findObjectWithID(this.actionableTowerIDs[i])
            const attackTarget = enemyCreeps[targetIndex]

            if (tower.attack(attackTarget) !== OK) continue

            this.actionableTowerIDs.splice(i, 1)
            attackTarget.reserveHits -= tower.estimateDamageNet(attackTarget)

            if (targetIndex >= enemyCreeps.length - 1) {
                targetIndex = 0
                continue
            }

            targetIndex += 1
        }
    }

    findHealTarget() {
        const { room } = this.communeManager

        if (room.enemyAttackers.length) {
            return room.myDamagedCreeps.find(creep => {
                return !creep.isOnExit && !room.enemyThreatCoords.has(packCoord(creep.pos))
            })
        }

        let healTargets: (Creep | PowerCreep)[] = []

        // Construct heal targets from my and allied damaged creeps in the this

        healTargets = room.myDamagedCreeps.concat(room.allyDamagedCreeps)
        healTargets = healTargets.concat(room.myDamagedPowerCreeps)

        return healTargets.find(creep => !creep.isOnExit)
    }

    healCreeps() {
        if (!this.actionableTowerIDs.length) return false

        const healTarget = this.findHealTarget()
        if (!healTarget) return true

        for (let i = this.actionableTowerIDs.length - 1; i >= 0; i--) {
            const tower = findObjectWithID(this.actionableTowerIDs[i])

            if (tower.heal(healTarget) !== OK) continue

            this.actionableTowerIDs.splice(i, 1)
        }

        return true
    }

    findRampartRepairTargets() {
        return this.communeManager.rampartRepairTargets.filter(function (rampart) {
            return rampart.hits <= RAMPART_DECAY_AMOUNT
        })
    }

    repairRamparts() {
        if (!this.actionableTowerIDs.length) return false

        const repairTargets = this.findRampartRepairTargets()
        if (!repairTargets.length) return true

        for (let i = this.actionableTowerIDs.length - 1; i >= 0; i--) {
            const tower = findObjectWithID(this.actionableTowerIDs[i])

            const target = repairTargets[repairTargets.length - 1]
            if (tower.repair(target) !== OK) continue

            updateStat(this.communeManager.room.name, 'eorwr', TOWER_ENERGY_COST)

            repairTargets.pop()

            this.actionableTowerIDs.splice(i, 1)
        }

        return true
    }

    findGeneralRepairTargets() {
        let structures: Structure[] = this.communeManager.room.roomManager.structures.spawn
        structures = structures.concat(this.communeManager.room.roomManager.structures.tower)

        return structures
    }

    repairGeneral() {
        if (!this.actionableTowerIDs.length) return false
        if (!randomTick(100)) return true

        const structures = this.findGeneralRepairTargets()
        if (!structures.length) return true

        for (let i = this.actionableTowerIDs.length - 1; i >= 0; i--) {
            const tower = findObjectWithID(this.actionableTowerIDs[i])

            const target = structures[structures.length - 1]

            if (tower.repair(target) !== OK) continue

            structures.pop()

            this.actionableTowerIDs.splice(i, 1)
        }

        return true
    }

    private createPowerTasks() {
        if (!this.communeManager.room.myPowerCreepsAmount) return

        for (const tower of this.communeManager.room.roomManager.structures.tower) {
            this.communeManager.room.createPowerTask(tower, PWR_OPERATE_TOWER, 1)
        }
    }

    private createRoomLogisticsRequests() {
        for (const structure of this.communeManager.room.roomManager.structures.tower) {
            // If don't have enough energy, request more

            if (structure.usedReserveStore < structure.store.getCapacity(RESOURCE_ENERGY) * 0.8) {
                this.communeManager.room.createRoomLogisticsRequest({
                    target: structure,
                    type: 'transfer',
                    priority:
                        3 + scalePriority(structure.store.getCapacity(RESOURCE_ENERGY), structure.reserveStore.energy),
                })
            }

            // If there are no attackers and the tower has some energy, make offer request

            if (structure.usedReserveStore > structure.store.getCapacity(RESOURCE_ENERGY) * 0.5) {
                this.communeManager.room.createRoomLogisticsRequest({
                    target: structure,
                    maxAmount: structure.usedReserveStore - 100,
                    /* onlyFull: true, */
                    type: 'offer',
                    priority: scalePriority(
                        structure.store.getCapacity(RESOURCE_ENERGY),
                        structure.usedReserveStore,
                        10,
                        true,
                    ),
                })
            }
        }
    }
}

StructureTower.prototype.estimateDamageGross = function (targetCoord) {
    let damage = estimateTowerDamage(this.pos, targetCoord)

    for (const powerType of towerPowers) {
        const effect = this.effectsData.get(powerType) as PowerEffect
        if (!effect) continue

        damage *= Math.floor(POWER_INFO[powerType].effect[effect.level - 1])
    }

    return Math.floor(damage)
}

StructureTower.prototype.estimateDamageNet = function (target) {
    let damage = this.estimateDamageGross(target.pos)
    damage *= target.defenceStrength

    damage -= target.macroHealStrength
    return Math.floor(damage)
}
