'use strict'
const { ScreepsAPI } = require('../')
const auth = require('../auth')
const fs = require('fs')

let api = new ScreepsAPI()

Promise.resolve()
  .then(()=>api.auth(auth.email,auth.password))
  .then(()=>api.memory.get())
  .then(memory=>{
    fs.writeFileSync('memory.json',JSON.stringify(memory))
  })
  .catch(err=>console.error(err))
