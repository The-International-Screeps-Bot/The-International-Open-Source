# Screeps API

## This is a nodejs API for the game Screeps

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![License](https://img.shields.io/npm/l/screeps-api.svg)](https://npmjs.com/package/screeps-api)
[![Version](https://img.shields.io/npm/v/screeps-api.svg)](https://npmjs.com/package/screeps-api)
[![Downloads](https://img.shields.io/npm/dw/screeps-api.svg)](https://npmjs.com/package/screeps-api)
[![CircleCI](https://circleci.com/gh/screepers/node-screeps-api/tree/master.svg?style=shield)](https://circleci.com/gh/screepers/node-screeps-api/tree/master)

![npm](https://nodei.co/npm/screeps-api.png "NPM")

## Notice on authentication

As of 12/29/2017 Screeps now uses auth tokens obtained via your screeps account settings. 
User/pass auth will stop working February 1, 2018!
[Screeps Announcement](http://blog.screeps.com/2017/12/auth-tokens/)

## CLI Usage

As of 1.7.0, a small CLI program (`screeps-api`) is included. 

Server config is specified via a `.screeps.yml` file conforming to the [Unified Credentials File format](https://github.com/screepers/screepers-standards/blob/master/SS3-Unified_Credentials_File.md)

```
screeps-api

  Usage:  [options] [command]

  Options:

    -V, --version                output the version number
    --server <server>            Server config to use (default: main)
    -h, --help                   output usage information

  Commands:

    raw <cmd> [args...]          Execute raw API call
    memory [options] [path]      Get Memory contents
    segment [options] <segment>  Get segment contents. Use 'all' to get all)
    download [options]           Download code
    upload [options] <files...>  Upload code

```


## API Usage

As of 1.0, all functions return Promises

```javascript
const { ScreepsAPI } = require('screeps-api');
const fs = require('fs');

// Supports @tedivm's [Unified Credentials File format](https://github.com/screepers/screepers-standards/blob/34bd4e6e5c8250fa0794d915d9f78d3c45326076/SS3-Unified_Credentials_File.md) (Pending [screepers-standard PR #8](https://github.com/screepers/screepers-standards/pull/8))
const api = await ScreepsAPI.fromConfig('main', 'appName')
// This loads the server config 'main' and the configs section 'appName' if it exists
// config section can be accessed like this:
// If making a CLI app, its suggested to have a `--server` argument for selection
console.log(api.appConfig.myConfigVar)

// All options are optional
const api = new ScreepsAPI({
  token: 'Your Token from Account/Auth Tokens'
  protocol: 'https',
  hostname: 'screeps.com',
  port: 443,
  path: '/' // Do no include '/api', it will be added automatically
});

// You can overwrite parameters if needed
api.auth('screeps@email.com','notMyPass',{
  protocol: 'https',
  hostname: 'screeps.com',
  port: 443,
  path: '/' // Do no include '/api', it will be added automatically
})

// If you want to point to the screeps PTR (Public Test Realm),
// you can set the 'path' option to '/ptr' and it will work fine.

// Dump Memory
api.memory.get()
  .then(memory => {
    fs.writeFileSync('memory.json', JSON.stringify(memory))
  })
  .catch(err => console.error(err));


// Dump Memory Path
api.memory.get('rooms.W0N0')
  .then(memory => {
    fs.writeFileSync('memory.rooms.W0N0.json', JSON.stringify(memory))
  })
  .catch(err => console.error(err));

// Get user info
api.me().then((user)=>console.log(user))

// Socket API

api.socket.connect()
// Events have the structure of:
// {
//   channel: 'room',
//   id: 'E3N3', // Only on certain events
//   data: { ... }
// }
api.socket.on('connected',()=>{
	// Do stuff after connected
})
api.socket.on('auth',(event)=>{
	event.data.status contains either 'ok' or 'failed'
	// Do stuff after auth
})

// Events: (Not a complete list)
// connected disconnected message auth time protocol package subscribe unsubscribe console

// Subscribtions can be queued even before the socket connects or auths,
// although you may want to subscribe from the connected or auth callback to better handle reconnects

api.socket.subscribe('console')
api.socket.on('console',(event)=>{
	event.data.messages.log // List of console.log output for tick
})


// Starting in 1.0, you can also pass a handler straight to subscribe!
api.socket.subscribe('console', (event)=>{
	event.data.messages.log // List of console.log output for tick
})

// More common examples
api.socket.subscribe('cpu',(event)=>console.log('cpu',event.data))
api.code.get('default').then(data=>console.log('code',data))
api.code.set('default',{
	main: 'module.exports.loop = function(){ ... }'
})
api.socket.subscribe('memory/stats',(event)=>{
	console.log('stats',event.data)
})
api.socket.subscribe('memory/rooms.E0N0',(event)=>{
	console.log('E0N0 Memory',event.data)
})
```

## Endpoint documentation

Server endpoints are listed in the `docs` folder:
 * [Endpoints.md](/docs/Endpoints.md) for direct access
 * [Websocket_endpoints.md](/docs/Websocket_endpoints.md) for web socket endpoints
Those lists are currently not exhaustive.
