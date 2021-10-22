'use strict'
const { ScreepsAPI } = require('../')
// const auth = require('../auth')
const readline = require('readline')
const util = require('util')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: 'Screeps> '
})

let auth = {}
let api = new ScreepsAPI()

if (process.argv.length == 3) {
  auth = require(process.argv[2])
}

Promise.resolve(auth)
  .then(getEmail)
  .then(getPassword)
  .then(connect)
  .then(start)
  .catch(() => {
    process.exit(1)
  })

function connect (auth) {
  return new Promise((resolve, reject) => {
    console.log('Authenticating...')
    api.auth(auth.email, auth.password, (err, result) => {
      if (result) {
        console.log('Authentication succeeded')
        resolve()
      }else {
        console.log('Authentication failed')
        reject()
      }
    })
  })
}

function start () {
  return new Promise((resolve, reject) => {
    run()
    api.socket(() => {
      console.log('start')
      rl.prompt()
    })
  })
}

function getEmail (auth) {
  if (auth.email) return auth
  return new Promise((resolve, reject) => {
    rl.question('Screeps Email: ', (email) => {
      auth.email = email.trim()
      resolve(auth)
    })
  })
}

function getPassword (auth) {
  if (auth.password) return auth
  return new Promise((resolve, reject) => {
    rl.question('Screeps Password: ', (password) => {
      auth.password = password.trim()
      resolve(auth)
    })
  })
}

function run () {
  rl.on('line', (line) => {
    line = line.trim()
    if (line == 'exit') {
      console.log('Bye')
      process.exit()
      return
    }
    api.console(line)
  })

  rl.on('close', () => {
    console.log('Bye')
    process.exit()
    return
  })

  api.on('message', (msg) => {
    console.log(msg)
    if (msg.slice(0, 7) == 'auth ok') {
      api.subscribe('/console')
      console.log('Console connected'.green)
    }
  })

  api.on('console', (msg) => {
    let [user, data] = msg
    if (data.messages) data.messages.log.forEach(l => console.log(l))
    if (data.messages) data.messages.results.forEach(l => console.log('>', l.gray))
    if (data.error) console.log(data.error.red)
  })
}

// Console fix
var fu = function (type, args) {
  var t = Math.ceil((rl.line.length + 3) / process.stdout.columns)
  var text = util.format.apply(console, args)
  rl.output.write('\n\x1B[' + t + 'A\x1B[0J')
  rl.output.write(text + '\n')
  rl.output.write(new Array(t).join('\n\x1B[E'))
  rl._refreshLine()
}

console.log = function () {
  fu('log', arguments)
}
console.warn = function () {
  fu('warn', arguments)
}
console.info = function () {
  fu('info', arguments)
}
console.error = function () {
  fu('error', arguments)
}
