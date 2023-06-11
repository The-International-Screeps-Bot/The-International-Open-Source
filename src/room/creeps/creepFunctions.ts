import { creepRoles } from 'international/constants'

export const creepFunctions = {
    expandDecryptedName(creepName: string) {
        return creepName.split('_')
    },
    roleName(creepName: string) {
        return creepRoles[parseInt(creepName[0])]
    },
    roleCreep(creep: Creep) {

        if (creep._role) return creep._role

        return (creep._role = this.roleName(creep.name))
    },
    /**
     * Overhead logic ran for dead creeps
     */
    runDead(creepName: string) {
        const creepMemory = Memory.creeps[creepName]
        const role = this.roleName(creepName)

        
    },
}
