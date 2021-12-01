const creepClasses: {[key: string]: any} = {
    SourceHarvester: class extends Creep {
        constructor(creep: Creep) {

            super(creep.id)

        }
    },
    Hauler: class extends Creep {
        constructor(creep: Creep) {

            super(creep.id)

        }
    },
    MineralHarvester: class extends Creep {
        constructor(creep: Creep) {

            super(creep.id)

        }
    },
    AntifaAssaulter: class {
        constructor() {


        }
    },
    AntifaSupporter: class {
        constructor() {


        }
    },
}

export default creepClasses
