# An service that launches an private server and runs milestones on the specified users

To test if your bot performs as you think and/or document it in long term tests, this can be used.

## Requirements

- Node 12.22.4 (12.x)
- Node-gyp

## Installation

### Setup

1. Copy .env.example and rename it to .env
Change `STEAM_API_KEY` to yours
If you want to auto login to one of the users you can change one of the USER Steam ids to yours and choose an room in `config.js`

2. Build your code and an `main.js` file should ben in the folder `dist`

### Running

Inside this folder

```bash
npm install
npm run server
```

## Usage

After you see `Start the simulation with runtime 100000 ticks` then go to `localhost:21025` and check out the progress of your bot
