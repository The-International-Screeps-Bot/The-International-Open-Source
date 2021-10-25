# The International - a fully automated Screeps bot

![The International](images/header.png)

[![Badge](https://forthebadge.com/images/badges/built-with-love.svg)](https://forthebadge.com)
[![Badge](https://forthebadge.com/images/badges/open-source.svg)](https://forthebadge.com)
[![Badge](https://forthebadge.com/images/badges/contains-tasty-spaghetti-code.svg)](https://forthebadge.com)
[![Badge](https://forthebadge.com/images/badges/0-percent-optimized.svg)](https://forthebadge.com)

## About

The International is my bot for the MMO server, thematically based after communist aesthetics. The goal of The International is to set up a fully autonomous communism zone in shard 2. Owned rooms are called communes, offensive and defensive forces are called the Red Army, economic workers are known as the Proletariat, and the Revolutionaries establish new communes and rebuild destroyed ones.

This bot intended to provide experienced and new players a reference for when they get stuck, need inspiration, or want to laugh at some terrible code. Feel welcome to fork it and otherwise use it, however do not be overly aggressive on the Screeps world, especially to newer players. The bot is intended to be automated, but can perform manual actions via the console, and has an information panel showing progress, events, economy and military, as well as, if integrated, the current state and events allies are undergoing.

Please create an issue for feature requests or help. I'll add a usage guide sometime soon. If you have specific questions or want to discuss the bot, DM me on discord: Carson Burke A&0#6757.

![Room with bot](images/room.png)
![Map view with visuals](images/visuals.png)
![Information panel](images/infopanel.png)

## Requirements

Please read the about section before installing and using this bot.

### NPM

```
npm install
```

### Typescript

```
npm install -g typescript
```

### Rollup

```
npm install -g rollup
```

## Usage

Using rollup we will translate the code into a single js file, which will be used in environments set in the screeps.json file. This reduces cpu usage, and compiles the code so it can be run by Screeps.

First, rename example.screeps.json to screeps.json and fill in required information for each environment you want to run the bot in.

To then run the bot, use the command `rollup -cw --environment DEST:mmo` replacing mmo with the environment you want to compile to. This wiil initially compile to the environment, as well as automatically compiling and pushing to the environment on code changes.

If you'd like to use this method to compile to a private server, you'll need to download and configure [screepsmod-auth](https://github.com/ScreepsMods/screepsmod-auth).

## Progress

### Progress Board

https://trello.com/b/BIZ8G8je/the-internationale-screeps-bot

### Flowchart

(I haven't done much work on the flowchart yet)
