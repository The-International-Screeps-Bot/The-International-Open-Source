/* 
----------[NOTES]----------

    //-----------------------------------------------------------------------------------------------

Market:

    Game.market.cancelOrder("608cf1bbab6e62255a81b72e")

    Game.market.deal('609d1bb45df65e23335ad5a1', 18000, "W17N54")

    Game.rooms['W17N52'].terminal.send(RESOURCE_ENERGY, 30000, 'W17N54','Reason')

    Game.market.createOrder({type: ORDER_SELL, resourceType: PIXEL, price: 1000, totalAmount: 750, roomName: "E25N2"})
    
    //-----------------------------------------------------------------------------------------------

Claim Room:

    Game.spawns.Spawn1.memory.claimRoom = "W17N52"

    Create New Spawner Memory:

    Game.spawns.Spawn2.memory.minimumNumberOfMiners = 1
    
    //-----------------------------------------------------------------------------------------------
    
Flags:

    RDP = Ranged Defensive Position
    MDP = Melee Defensive Position
    AR = Attack Room
    BB = Big Boy Attack

    BR = Build Room

    S = Add Message To Room
    
    //-----------------------------------------------------------------------------------------------

[MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,MOVE,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,WORK,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY,CARRY]

constants find a spot where stationaryHauler can go, save it in memory

    //-----------------------------------------------------------------------------------------------
    
Upkeep costs:

    0.001 / tick / road, plains
    1000 roads = 1 energy
    
    0.005 / tick / road, swamp
    500 roads = 1 energy
    
    0.1 / tick / container
    10 containers = 1 energy
    
    0.03 / tick / rampart
    300 ramparts = 1 energy

    Useful Constants:
    
        Body Costs:
        
            MOVE: 50
            WORK: 100
            ATTACK: 80
            CARRY: 50
            HEAL: 250
            RANGED_ATTACK: 150
            TOUGH: 10
            CLAIM: 600
    
        Part Stats:
    
            HEAL: 12
            RANGED_HEAL: 4
            RANGED_ATTACK: 10
            ATTACK: 30
            DISMANTLE: 50
            
        T3 Boosts:
        
            catalyzed utrium acid	 + 	60	ATTACK	+300% attack effectiveness
            catalyzed utrium alkalide	 + 	60	WORK	+600% harvest effectiveness
            catalyzed keanium acid	 + 	60	CARRY	+150 capacity
            catalyzed keanium alkalide	 + 	60	RANGED_ATTACK	+300% rangedAttack and rangedMassAttack effectiveness
            catalyzed lemergium acid	 + 	65	WORK	+100% repair and build effectiveness without increasing the energy cost
            catalyzed lemergium alkalide	 + 	60	HEAL	+300% heal and rangedHeal effectiveness
            catalyzed zynthium acid	 + 	160	WORK	+300% dismantle effectiveness
            catalyzed zynthium alkalide	 + 	60	MOVE	+300% fatigue decrease speed
            catalyzed ghodium acid	 + 	80	WORK	+100% upgradeController effectiveness without increasing the energy cost
            catalyzed ghodium alkalide	 + 	150	TOUGH	-70% damage taken
            
        Important T3 Boosts:
        
            catalyzed zynthium alkalide:	   	+300% fatigue decrease speed   
            catalyzed ghodium alkalide:  	-70% damage taken                                                      
            catalyzed utrium acid:        	+300% attack effectiveness                                             
            catalyzed lemergium alkalide:    +300% heal and rangedHeal effectiveness                                        
            catalyzed keanium alkalide:	 + 	60	RANGED_ATTACK	+300% rangedAttack and rangedMassAttack effectiveness
            
        Downgrade Timers:
        
            RCL 1: 20,000
            
            RCL 2: 10,000
            
            RCL 3: 20,000
            
            RCL 4: 40,000
            
            RCL 5: 80,000
            
            RCL 6: 120,000
            
            RCL 7: 150,000
            
            RCL 8: 200,000

        RCL Values:

            RCL 1: 300

            RCL 2: 550

            RCL 3: 800

            RCL 4: 1, 300

            RCL 5: 1, 800

            RCL 6: 2, 300

            RCL 7: 5, 600

            RCL 8: 12, 900
*/