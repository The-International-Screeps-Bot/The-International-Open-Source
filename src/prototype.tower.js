StructureTower.prototype.defend =
    function() {

        var closestHostile = this.room.find(FIND_HOSTILE_CREEPS, {
            filter: (c) => c.owner.username != "Q13214" && c.owner.username != "Brun1L" && c.owner.username != "mrmartinstreet" && c.owner.username != "Orlet" && c.owner.username != "slowmotionghost"
        });
        /*
        var controllerContainer = Game.getObjectById(this.room.memory.controllerContainer)
        var controllerLink = Game.getObjectById(this.room.memory.controllerLink)
        */
        if (closestHostile[0]) {

            this.attack(closestHostile[0]);

            this.room.visual.text("⚔️ ", this.pos.x + 1, this.pos.y, { align: 'left' });

        } else {

            var closestInjured = this.pos.findClosestByRange(FIND_MY_CREEPS, {
                filter: (creep) => creep.hits < creep.hitsMax * 1
            });

            if (closestInjured) {

                this.heal(closestInjured);

                this.room.visual.text("🩺 ", this.pos.x + 1, this.pos.y, { align: 'left' });

            } else {

                var targets = this.pos.findClosestByRange(FIND_STRUCTURES, {
                    filter: (s) => s.hits < s.hitsMax * 0.5 && s.structureType != STRUCTURE_WALL && s.structureType != STRUCTURE_RAMPART
                });

                if (targets && this.energy > (this.energyCapacity * .65)) {

                    this.repair(targets);

                    this.room.visual.text("🔧 G", this.pos.x + 1, this.pos.y, { align: 'left' });

                } else {

                    var ramparts1k = this.pos.findClosestByRange(FIND_MY_STRUCTURES, {
                        filter: s => s.structureType == STRUCTURE_RAMPART && s.hits <= 1000
                    });

                    if (ramparts1k && this.energy > (this.energyCapacity * .7)) {

                        this.repair(ramparts1k);

                        this.room.visual.text("🔧 R", this.pos.x + 1, this.pos.y, { align: 'left' });

                    }
                    /*
                    else if (controllerLink && controllerLink.store[RESOURCE_ENERGY] >= 400) {

                        if (this.energy > (this.energyCapacity * .7)) {

                            var wallsInRoom = this.room.find(FIND_STRUCTURES, {
                                filter: (s) => s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL
                            })

                            var minHpWall = _.min(wallsInRoom, function(o) { return o.hits; })

                            if (minHpWall) {

                                this.repair(minHpWall);
                                this.room.visual.text("🔧 W", this.pos.x + 1, this.pos.y, { align: 'left' });

                            }
                        }
                    } else if (controllerContainer && controllerContainer.store[RESOURCE_ENERGY] >= 1000) {

                        if (this.energy > (this.energyCapacity * .7)) {

                            var wallsInRoom = this.room.find(FIND_STRUCTURES, {
                                filter: (s) => s.structureType == STRUCTURE_RAMPART || s.structureType == STRUCTURE_WALL
                            })

                            var minHpWall = _.min(wallsInRoom, function(o) { return o.hits; })

                            if (minHpWall) {

                                this.repair(minHpWall);
                                this.room.visual.text("🔧 W", this.pos.x + 1, this.pos.y, { align: 'left' });

                            }
                        }
                    }
                    */
                }
            }
        }
    };