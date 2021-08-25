function mapVisuals() {

    if (!Memory.global.mapVisuals) return

    for (let roomName in Memory.rooms) {

        if (Memory.rooms[roomName].stage) {
            if (Memory.rooms[roomName].stage >= 1) {

                Game.map.visual.rect(new RoomPosition(0, 0, roomName), 50, 50, { fill: '#00e600', opacity: 0.25 })

                Game.map.visual.circle(new RoomPosition(8, 8, roomName), { radius: 8, fill: '#00e600', opacity: 0.5 })
                Game.map.visual.text(Memory.rooms[roomName].stage, new RoomPosition(8, 8, roomName), { color: '#ffffff', fontSize: 8 })

                Game.map.visual.circle(new RoomPosition(8, 24, roomName), { radius: 8, fill: '#FFD180', opacity: 0.5 })
                Game.map.visual.text((Memory.rooms[roomName].storedEnergy / 1000).toFixed(0) + "k", new RoomPosition(8, 24, roomName), { color: '#ffffff', fontSize: 8 })

            } else if (Memory.rooms[roomName].claimable == true) {

                Game.map.visual.rect(new RoomPosition(0, 0, roomName), 50, 50, { fill: '#ffffff', opacity: 0.25 })

            } else if (Memory.rooms[roomName].claimable == "notViable") {

                Game.map.visual.rect(new RoomPosition(0, 0, roomName), 50, 50, { fill: '#ff66ff', opacity: 0.25 })

            } else if (Memory.rooms[roomName].stage == "enemyRoom") {

                Game.map.visual.rect(new RoomPosition(0, 0, roomName), 50, 50, { fill: '#FF0000', opacity: 0.25 })

                if (Memory.rooms[roomName].level) {

                    Game.map.visual.circle(new RoomPosition(8, 8, roomName), { radius: 8, fill: '#FF0000', opacity: 0.5 })
                    Game.map.visual.text(Memory.rooms[roomName].level, new RoomPosition(8, 8, roomName), { color: '#ffffff', fontSize: 8 })
                }
            } else if (Memory.rooms[roomName].stage == "enemyReservation") {

                Game.map.visual.rect(new RoomPosition(0, 0, roomName), 50, 50, { fill: '#FF0000', opacity: 0.15 })

            } else if (Memory.rooms[roomName].stage == "remoteRoom") {

                Game.map.visual.rect(new RoomPosition(0, 0, roomName), 50, 50, { fill: '#00e600', opacity: 0.15 })

            } else if (Memory.rooms[roomName].stage == "keeperRoom") {

                Game.map.visual.rect(new RoomPosition(0, 0, roomName), 50, 50, { fill: '#ffa31a', opacity: 0.25 })

            } else if (Memory.rooms[roomName].stage == "allyRoom") {

                Game.map.visual.rect(new RoomPosition(0, 0, roomName), 50, 50, { fill: '#1171bb', opacity: 0.25 })

                if (Memory.rooms[roomName].level) {

                    Game.map.visual.circle(new RoomPosition(8, 8, roomName), { radius: 8, fill: '#1171bb', opacity: 0.5 })
                    Game.map.visual.text(Memory.rooms[roomName].level, new RoomPosition(8, 8, roomName), { color: '#ffffff', fontSize: 8 })
                }
            } else if (Memory.rooms[roomName].stage == "allyReservation") {

                Game.map.visual.rect(new RoomPosition(0, 0, roomName), 50, 50, { fill: '#1171bb', opacity: 0.15 })

            } else {

                Game.map.visual.rect(new RoomPosition(0, 0, roomName), 50, 50, { fill: '#F4E637', opacity: 0.1 })
            }
        }
    }
    if (Memory.global.attackingRoom && Memory.global.attackTarget) {

        Game.map.visual.line(new RoomPosition(25, 25, Memory.global.attackingRoom), new RoomPosition(25, 25, Memory.global.attackTarget), { width: 2.5, color: '#FE411E', lineStyle: "dashed", opacity: 0.8 })
    }
    if (Memory.global.attackTarget) {

        Game.map.visual.circle(new RoomPosition(50 - 8, 8, Memory.global.attackTarget), { radius: 8, fill: '#FF0000', opacity: 0.5 })
        Game.map.visual.text("AT", new RoomPosition(50 - 8, 8, Memory.global.attackTarget), { color: '#ffffff', fontSize: 8 })
    }

    if (Memory.global.communeEstablisher && Memory.global.newCommune) {

        Game.map.visual.line(new RoomPosition(25, 25, Memory.global.communeEstablisher), new RoomPosition(25, 25, Memory.global.newCommune), { width: 2.5, color: '#00e600', lineStyle: "dashed", opacity: 0.8 })
    }

    if (Memory.global.newCommune) {

        Game.map.visual.circle(new RoomPosition(50 - 8, 8, Memory.global.newCommune), { radius: 8, fill: '#00e600', opacity: 0.5 })
        Game.map.visual.text("NC", new RoomPosition(50 - 8, 8, Memory.global.newCommune), { color: '#ffffff', fontSize: 8 })
    }
}

module.exports = mapVisuals