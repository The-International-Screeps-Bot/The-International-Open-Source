module.exports = {
    run: function cleanMemory() {

        for (let name in Memory.creeps) {

            if (Game.creeps[name] == undefined) {

                delete Memory.creeps[name];
            }
        }
    }
};