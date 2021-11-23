import { extend } from "lodash"

interface RoleAttacker {


}

interface Attacker {

}

class Attacker extends PowerCreep {
    constructor(creep) {

        super(creep.id)
    }
}

export { RoleAttacker }

export const creepClasses: {[key: string]: any} = {
    'attacker': Attacker
}
