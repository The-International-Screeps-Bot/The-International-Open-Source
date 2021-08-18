function logging() {

    function lastDefence() {

        let lastDefence

        if (Memory.global.lastDefence == null) {

            Memory.global.lastDefence = { time: false, room: false }
        }
        if (Memory.global.lastDefence.time && Memory.global.lastDefence.room) {

            lastDefence = Game.time - Memory.global.lastDefence.time + " Ticks ago in " + Memory.global.lastDefence.room
        } else {

            lastDefence = "Never"
        }

        return lastDefence
    }

    function myRoomsNumber() {

        let i = 0

        _.forEach(Game.rooms, function(room) {

            if (room.controller && room.controller.my) {

                i++
            }
        })

        return i
    }

    function energyAmount() {

        let energyAmount = `<th style="text-align: center; padding: 5px 0; color: #FFD180;">Total Energy: ` + (Memory.global.totalEnergy / 1000).toFixed(0) + "k" + `</th>`
        return energyAmount
    }

    function cpuBucketMessage() {

        let cpuMessage
        let cpu = Game.cpu.bucket
        let cpuTotal = 10000

        if (cpu >= cpuTotal * 0.7) {

            cpuMessage = `<th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px; color: rgba(11, 218, 32, 1);">CPU Bucket: ` + Game.cpu.bucket + `</th>`
            return cpuMessage
        } else if (cpu >= cpuTotal * 0.3) {

            cpuMessage = `<th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px; color: rgba(243, 235, 18, 1);">CPU Bucket: ` + Game.cpu.bucket + `</th>`
            return cpuMessage
        } else {

            cpuMessage = `<th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px; color: rgba(243, 40, 18, 1);">CPU Bucket: ` + Game.cpu.bucket + `</th>`
            return cpuMessage
        }
    }

    function cpuMessage() {

        let cpuMessage
        let cpu = Game.cpu.getUsed()
        let cpuTotal = Game.cpu.limit

        if (cpu <= cpuTotal * 0.3) {

            cpuMessage = `<th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px; color: rgba(11, 218, 32, 1);">CPU: ` + Game.cpu.getUsed().toFixed(2) + " / " + Game.cpu.limit + " (%" + ((Game.cpu.getUsed() / Game.cpu.limit) * 100).toFixed(0) + ")" + `</th>`
            return cpuMessage
        } else if (cpu <= cpuTotal * 0.7) {

            cpuMessage = `<th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px; color: rgba(243, 235, 18, 1);">CPU: ` + Game.cpu.getUsed().toFixed(2) + " / " + Game.cpu.limit + " (%" + ((Game.cpu.getUsed() / Game.cpu.limit) * 100).toFixed(0) + ")" + `</th>`
            return cpuMessage
        } else {

            cpuMessage = `<th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px; color: rgba(243, 40, 18, 1);">CPU: ` + Game.cpu.getUsed().toFixed(2) + " / " + Game.cpu.limit + " (%" + ((Game.cpu.getUsed() / Game.cpu.limit) * 100).toFixed(0) + ")" + `</th>`
            return cpuMessage
        }
    }

    function cpuSpecificMessage() {


    }

    function getEstablishedRooms() {

        return Memory.global.establishedRooms.length
    }

    let trPadding = "padding: 6px 0;"
    let trBorderRadius = ""
    let trTextAlign = "color: white; font-size: 15px; text-align: center; padding: 6px 0px;"

    let trDefaultStyle = ""

    console.log('--------------------------------------------------------')
    console.log(`
        <table style="background: rgba(255, 255, 255, 0.1); padding: 6px; border-radius: 4px; width: 90vw; border-collapse: initial; box-shadow: rgba(0, 0, 0, 0.18) 0 12px 30px 0; overflow: hidden; font-family: 'Roboto', sans-serif; margin-left: 10px;">
            
            <tr style="background: rgba(44, 97, 242, 1);">
                <th style="color: white; font-size: 15px; text-align: center; padding: 6px 0px; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">CPU</th>
                <th style="` + trTextAlign + `"></th>
                <th style="` + trTextAlign + `"></th>
                <th style="` + trTextAlign + `"></th>
                <th style="color: white; font-size: 15px; text-align: center; padding: 6px 0px; border-top-right-radius: 4px; border-bottom-right-radius: 4px;"></th>
            </tr>
            <tr>
                <th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Spawn: ` + "x" + `</th>
            </tr>
            <tr style="background: rgba(44, 97, 242, 1);">
                <th style="color: white; font-size: 15px; text-align: center; padding: 6px 0px; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">General</th>
                <th style="color: white; font-size: 15px; text-align: center; padding: 6px 0px;">Economy</th>
                <th style="color: white; font-size: 15px; text-align: center; padding: 6px 0px;">Military</th>
                <th style="color: white; font-size: 15px; text-align: center; padding: 6px 0px;">Market</th>
                <th style="color: white; font-size: 15px; text-align: center; padding: 6px 0px; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Allies</th>
            </tr>
            <tr>
                <th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Global Stage: ` + Memory.global.globalStage + ` <br /> Time: ` + Game.time % 100 + `</th>
                ` + energyAmount() + `
                <th style="text-align: center; padding: 5px 0;">Last Defence: ` + lastDefence() + `</th>
                <th style="text-align: center; padding: 5px 0;">Total CR: ` + (Game.market.credits / 1000).toFixed(0) + "k" + `</th>
                <th style="text-align: center; padding: 5px 0; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Alles: ` + allyList + `</th>
            </tr>
            <tr style="background: #333">
                <th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Creeps: ` + Object.keys(Memory.creeps).length + " (" + Math.floor(Object.keys(Memory.creeps).length / myRoomsNumber()) + " per room)" + `</th>
                <th style="text-align: center; padding: 5px 0;">Total Boosts: ` + "x" + `</th>
                <th style="text-align: center; padding: 5px 0;">Last Attack: ` + "x ticks ago, room y" + `</th>
                <th style="text-align: center; padding: 5px 0;">Market Offers: ` + Object.keys(Game.market.orders).length + `</th>
                <th style="text-align: center; padding: 5px 0; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Economy Need: ` + "true / false" + `</th>
            </tr>
            <tr>
                ` + cpuMessage() + `
                <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                <th style="text-align: center; padding: 5px 0;">cSites: ` + Object.keys(Game.constructionSites).length + `</th>
                <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                <th style="text-align: center; padding: 5px 0; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Military Need: ` + "true / false" + `</th>
            </tr>
            <tr style="background: #333">
                ` + cpuBucketMessage() + ` 
                <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                <th style="text-align: center; padding: 5px 0; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Trade Need: ` + "true / false" + `</th>
            </tr>
            <tr>
                <th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Rooms: ` + Memory.global.communes.length + " / " + Game.gcl.level + " (%" + (Game.gcl.progress / Game.gcl.progressTotal * 100).toFixed(0) + " GCL)" + ` <br /> ` + "(" + getEstablishedRooms() + " Established)" + `</th>
                <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
                <th style="text-align: center; padding: 5px 0; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Time: ` + "x" + `</th>
            </tr>
        </table>
        `)

    /*
    <tr>
        <th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Time: ` + "x" + `</th>
        <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
        <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
        <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
        <th style="text-align: center; padding: 5px 0; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Time: ` + "x" + `</th>
    </tr>
    <tr style="background: #333">
        <th style="text-align: center; padding: 5px 0; border-top-left-radius: 4px; border-bottom-left-radius: 4px;">Time: ` + "x" + `</th>
        <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
        <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
        <th style="text-align: center; padding: 5px 0;">Time: ` + "x" + `</th>
        <th style="text-align: center; padding: 5px 0; border-top-right-radius: 4px; border-bottom-right-radius: 4px;">Time: ` + "x" + `</th>
    </tr>
    */
}

module.exports = logging