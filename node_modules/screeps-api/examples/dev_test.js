'use strict'
const { ScreepsAPI } = require('../')
const auth = require('../auth')
const WebSocket = require('ws')

let api = new ScreepsAPI()

Promise.resolve()
  .then(()=>api.auth(auth.email,auth.password))
  .then(()=>api.socket.connect())
  .then(()=>{
    api.socket.subscribe('console')
    api.socket.subscribe('cpu')
  })
  .catch((err)=>{
    console.error('err',err)
  })

let socketEvents = ['connected','disconnected','message','auth','time','protocol','package','subscribe','unsubscribe','console']
socketEvents.forEach(ev=>{
  api.socket.on(ev,(data)=>{
    console.log(ev,data)
  })
})

api.socket.on('disconnected',()=>{
  api.socket.connect()
})

// api.socket.on('console', (msg) => {
//   // console.log('CONSOLE', msg)
//   let { data } = msg
//   if (data.messages) data.messages.log.forEach(l => console.log('console',l))
//   if (data.messages) data.messages.results.forEach(l => console.log('console >', l))
//   if (data.error) console.log('error', data.error)
// })

process.on('unhandledRejection', (reason) => {
  console.error('err',reason);
  process.exit(1);
});