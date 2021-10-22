# Web sockets endpoints list

Currently known endpoints are listed below.
 * This list is clearly not exhaustive and comes from empirical observations.
 * If you want to add more data, feel free to make a pull request.

## Shards

Any subscription taking a room name is different on servers with shards,
the room name should be prefixed with the shard name ex `shard0/E0N0`.

Note that adding a shard to a server not expecting it may cause an error.

## Subscribing to web sockets endpoints

 * Make sure you are authenticated (you should have called `api.auth(...).then(...)` first).
 * Connect the socket and wait for connection establishment using `api.socket.connect().then(...)`.
 * You can then subscribe to different endpoints using `api.socket.subscribe()`.
 * The server will then send periodic events with requested information.

Complete example:
```javascript
const { ScreepsAPI } = require('screeps-api');

try {
	// Setup
    const api = new ScreepsAPI();
    await api.auth("your_email", "your_password"); // authenticate
    await api.socket.connect(); // connect socket

    // Subscribe to 'cpu' endpoint and get events
    api.socket.subscribe('cpu');
    api.socket.on('cpu', event => {
        console.log(event.data.cpu) // cpu used last tick
    });

    // You can also put a callback to subscribe()
    api.socket.subscribe('console', event => {
        event.data.messages.log // List of console.log output for tick
    })
} catch(err) {
	console.log(err);
}
```


## code

### Description:

Once subscribed, the server will send a new event with full code base every time code base changes.

### Parameters of `event.data`:

Name      | Type   | Description
--------- | ------ | ------------------
branch    | String | Name of the updated branch
modules   | Object | Map of files (using file name as key and file content as value)
timestamp | Number | Date of the modification expressed as the number of milli-seconds since 01/01/1970
hash      | Number | Some kind of hash, I guess ? (don't ask me how to compute it #FIXME)

### Example:

```javascript
// Subscription
api.socket.subscribe('code', event => console.log(JSON.stringify(event.data)));
```
```javascript
// Results
{
    "branch": "simulation",
    "modules":{
        "main":"console.log(\"Hello world!\");\n",
        // other modules...
    },
    "timestamp": 1500930041802,
    "hash": 424324
}
```


## console

### Description:

Once subscribed, the server will send a new event every tick with console logs and return value of commands (if any).

### Parameters of `event.data`:

Name             | Type   | Description
---------------- | ------ | ------------------
messages.log     | Array  | Lines shown in console (like if printed by `console.log()`)
messages.results | Array  | Array of command results

### Example:

```javascript
// Subscription
api.socket.subscribe('console', event => console.log(JSON.stringify(event.data)));
```
```javascript
// Results after executing `Game.time` in game:
{
    "messages": {
        "log": [],
        "results": ["16746996"]
    }
}
// (`Game.time` does not show any log in the console, which is why `messages.log` is empty)
```


## cpu

### Description:

Once subscribed, the server will send a new event every tick with cpu and memory usage.

### Parameters of `event.data`:

Name   | Type   | Description
------ | ------ | ------------------
cpu    | Number | Cpu used last tick
memory | Number | Current memory usage

### Example:

```javascript
// Subscription
api.socket.subscribe('cpu', event => console.log(JSON.stringify(event.data)));
```
```javascript
// Results every tick
{
    "cpu": 32,
    "memory": 126435
}
```


## room:ROOM_NAME

### Description:

Once subscribed, the server will send a new event every tick with the RoomObjects of present in selected room (`ROOM_NAME`).
RoomObjects seem to have the same properties as within game scripts.

**Atention**, only the first event actually returns the object full properties.
Subsequent events only return the modified properties.

### Parameters of `event.data`:

Name     | Type   | Description
-------- | ------ | ---------------------------------
objects  | Object | Map of RoomObjects indexed by id
gameTime | Number | Current game tick
info     | Object | Contains game mode (usually `"world"`)
visual   | Object | Room visuals (contents currently unknown #FIXME)

### Example:

```javascript
// Subscription
api.socket.subscribe('room:W7N7', event => console.log(JSON.stringify(event.data))); // For non-sharded servers
api.socket.subscribe('room:shard0/W7N7', event => console.log(JSON.stringify(event.data))); // For sharded servers
```
```javascript
// First event results:
{
    "objects": {
        "58dbc28b8283ff5308a3c0ba": {
            "_id": "58dbc28b8283ff5308a3c0ba",
            "room": "W97S73",
            "type": "source",
            "x": 12, "y": 14,
            "energy": 1908,
            "energyCapacity": 3000,
            "ticksToRegeneration": 300,
            "nextRegenerationTime": 20308471,
            "invaderHarvested": 45324
        },
       "59663a8e82b5ab1b911ca1a9": {
           "_id": "59663a8e82b5ab1b911ca1a9",
           "type": "road",
           "x": 17,"y": 42,
           "room": "W97S73",
           "notifyWhenAttacked": true,
           "hits": 22080,
           "hitsMax": 25000,
           "nextDecayTime": 20308833
       },
       // other RoomObjects...
    },
    "gameTime": 20307112,
    "info": { "mode": "world" },
    "visual": ""
}
```
```javascript
// Results for subsequent events:
{
    "objects": {
        "58dbc28b8283ff5308a3c0ba": { "energy": 948, "invaderHarvested": 34284 },
        "5967d460eebe3d6404c26852": { "nextDecayTime": 20307861 },
        // Other modified RoomObjects...
    },
    "gameTime": 20307112,
    "info": { "mode": "world" },
    "visual": ""
}
```
