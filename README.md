# The Internationale - a fully automated Screeps bot

![The Internationale](images/header.png)

[![forthebadge](https://forthebadge.com/images/badges/built-with-love.svg)](https://forthebadge.com)
[![forthebadge](https://forthebadge.com/images/badges/open-source.svg)](https://forthebadge.com)
[![forthebadge](https://forthebadge.com/images/badges/contains-tasty-spaghetti-code.svg)](https://forthebadge.com)
[![forthebadge](https://forthebadge.com/images/badges/0-percent-optimized.svg)](https://forthebadge.com)

## About

The Internationale is my bot for the MMO server, thematically based after communist aesthetics. The goal of The Internationale is to set up a fully autonomous communism zone in shard 2. Owned rooms are called communes, offensive and defensive forces are called the Red Army, economic workers are known as the Proletariat, and the Revolutionaries establish new communes and rebuild destroyed ones.

The bot is not meant for use or forking, please do not use it as such. It is simply intented to provide experienced and new players a reference for when they get stuck, need inspiration, or want to laugh at some terrible code. The bot is intended to be automated, but can perform manual actions via the console, and has an information panel showing progress, events, economy and military, as well as, if integrated, the current state and events allies are undergoing.

![Information Panel](images/infopanel.png)

![Visuals](images/visuals.png)

## Progress

### Progress Board

https://trello.com/b/BIZ8G8je/the-internationale-screeps-bot

### Flowchart

https://cloud.smartdraw.com/share.aspx/?pubDocShare=253503CFB284B9C4323DA9A85219E9857F3

- [x] Setup info to be displayed in Grafana
- [x] Automated spawning
- [x] Claim and operation of multiple rooms
- [x] Remote mining
- [x] Primitive defence code
- [x] Operation of multiple spawns in a room
- [x] Spawn que
- [x] Automated road placement
- [x] Automated base construction and room planning
- [x] Automatic market buy and sell orders
- [x] Produce boosts
- [x] Attacker dous
- [ ] Have resources come into terminal when room under attack
- [x] Spawning of power creeps
- [x] Power creep operations
- [ ] Creep boosting
- [x] Automated wall and rampart placement
- [ ] Power bank collection
- [ ] Commodity collection
- [x] Automated scouting
- [x] Basic factory operations
- [ ] Commodity factory opperations
- [x] Automated intel on enemies
- [ ] Automated attacking
- [ ] Different, functional room blueprints depending on room size and shape
- [x] Automated recording of viable rooms to claim
- [x] Automated claiming of rooms
- [x] Automated recording of viable remote harvesting rooms
- [x] Add room and map visuals to display important information
- [ ] Power creep offensive capabilities
- [ ] Automatic safemode when boosted attackers
- [x] Advanced targeting for towers
- [ ] Recording and predicting for like attackers
- [ ] Assisting of defending rooms using safe rooms in case of power creep assisted attack
- [ ] Weighting of rooms from economic to military depending on recent history and neighbours
- [x] Communication and coordination between rooms about global stage, economy, threats
- [x] Advanced pathing to avoid rooms with known threats
- [x] Have nearest rooms establish and claim rooms
- [ ] Spawn specific defender creeps depending on attackers
- [ ] Determine if boosting is necessary for defenders or attackers
- [x] Have defenders move to ramparts near attackers
- [x] Spawn new civilian creeps when TTL is less than time to spawn
- [x] Information panel to provide information about the development of the bot
- [ ] Communication with allies via the public segment
- [x] Create a task manager to avoid creeps switching tasks halfway through
- [x] Make the task manager track and tell creeps what jobs to do
- [ ] Track remote room attacks from enemy players and run logic to abolish it, defend it, or leave it as is
- [ ] Create GCL temples if there is excess energy and proper globalStage
- [x] Operation of nukers
- [ ] Automated use of nukers
- [ ] Squads morph size shape and amount depending on situation
- [x] Squads flee when overwhelmed or avoiding range of enemy
- [x] Haulers to manage mineral containers
- [ ] Traffic manager to improve pathing
- [ ] Stationary builders harvesters and upgraders at low rcl
- [x] Commodity scouting and recording
- [ ] Power bank scouting and recording
- [ ] Hauler re-write based purely on commands
- [x] Squad different possible sizes (duo, quad, etc.)
