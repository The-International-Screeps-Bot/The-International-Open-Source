'use strict'
const ScreepsAPI = require('../')
const auth = require('../auth')
const WebSocket = require('ws')
const fs = require('fs')

let api = new ScreepsAPI(auth)

api.socket(() => {
})

api.on('message', (msg) => {
  // console.log('MSG', msg)
  if (msg.slice(0, 7) == 'auth ok') {
    api.subscribe('/code')
  }
})

// Upload your code to trigger this.
api.on('code', (msg)=>{
  let [user, data] = msg
  fs.mkdirSync(data.branch)
  for(let mod in data.modules){
    let file = `${data.branch}/${mod}.js`
    fs.writeFileSync(file,data.modules[mod])
    console.log('Wrote',file)
  }
})
