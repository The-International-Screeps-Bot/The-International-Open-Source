const assert = require('assert')
const _ = require('lodash')
const { ScreepsAPI } = require('../')
const auth = require('./credentials')

describe('ScreepsAPI', function () {
  this.slow(2000)
  this.timeout(5000)

  describe('.constructor()', function () {
    it('should save passed options', function () {
      let options = {
        email: 'screeps@email.com',
        // don't use a fake password here or API will try to authenticate
        protocol: 'https',
        hostname: 'screeps.com',
        port: 443,
        path: '/'
      }
      let api = new ScreepsAPI(options)
      _.each(options, (value, key) => assert.equal(api.opts[key], value, `invalid ${key} option`))
    })
    it('should assign default options when needed', function () {
      const DEFAULTS = {
        protocol: 'https',
        hostname: 'screeps.com',
        port: 443,
        path: '/'
      }
      let api = new ScreepsAPI({})
      _.each(DEFAULTS, (value, key) => assert.equal(api.opts[key], value, `invalid ${key} default option`))
    })
  })

  describe('.me()', function () {
    it('should return user informations from `/api/auth/me` endpoint', async function () {
      let opts = _.omit(auth, ['username', 'password'])
      let api = new ScreepsAPI(opts)
      await api.auth(auth.username, auth.password)
      let infos = await api.me()
      assert.equal(infos.ok, 1, 'incorrect server answer: ok should be 1')
      assert(_.has(infos, 'email'), 'answer has no email field')
      assert(_.has(infos, 'badge'), 'answer has no badge field')
      assert(_.has(infos, 'username'), 'answer has no username field')
    })
  })

  describe('.mapToShard()', function () {
    it('should do things... but I\'m not sure what exactly...')
  })

  describe('.setServer()', function () {
    it('should save passed options', function () {
      let options = {
        email: 'screeps@email.com',
        protocol: 'https',
        hostname: 'screeps.com',
        port: 443,
        path: '/'
      }
      let api = new ScreepsAPI()
      api.setServer(options)
      _.each(options, (value, key) => assert.equal(api.opts[key], value, `invalid ${key} option`))
    })
    it('should compute opts.url if opts.url wasn\'t provided', function () {
      let options1 = { protocol: 'http', hostname: 'screeps.com' }
      let options2 = { protocol: 'https', hostname: 'screeps.com', path: '/ptr/' }
      let options3 = { protocol: 'https', hostname: 'screeps.com', port: 80, path: '/' }
      let api = new ScreepsAPI()
      api.setServer(options1)
      assert.equal(api.opts['url'], 'http://screeps.com:443/', 'invalid computed url')
      api.setServer(options2)
      assert.equal(api.opts['url'], 'https://screeps.com:443/ptr/', 'invalid computed url')
      api.setServer(options3)
      assert.equal(api.opts['url'], 'https://screeps.com:80/', 'invalid computed url')
    })
    it('should compute opts.pathname if opts.url wasn\'t provided', function () {
      let api = new ScreepsAPI()
      api.setServer({ path: '/ptr/' })
      assert.equal(api.opts['pathname'], '/ptr/', 'pathname was not updated')
      api.setServer({ path: '/' })
      assert.equal(api.opts['pathname'], '/', 'pathname was not updated')
    })
  })

  describe('.auth()', function () {
    it('should save email and password', async function () {
      let api = new ScreepsAPI()
      await api.auth('screeps@email.com', 'invalid_password').catch(() => { /* do nothing */; })
      assert.equal(api.opts.email, 'screeps@email.com', `invalid email option`)
      assert.equal(api.opts.password, 'invalid_password', `invalid email option`)
    })
    it('should update options if opt object was passed', async function () {
      let options = {
        protocol: 'https',
        hostname: 'screeps.com',
        port: 443
      }
      let api = new ScreepsAPI()
      await api.auth('email', 'password', options).catch(() => { /* do nothing */; })
      _.each(options, (value, key) => assert.equal(api.opts[key], value, `invalid ${key} option`))
    })
    it('should authenticate and get token', async function () {
      let event = false
      let opts = _.omit(auth, ['username', 'password'])
      let api = new ScreepsAPI(opts)
      api.on('token', () => event = true)
      await api.auth(auth.username, auth.password)
      assert(event, 'token event was not emited')
      assert(_.has(api, 'token'), 'token was not saved')
      assert.equal(api.__authed, true, 'internal state has not changed (api.__authed)')
    })
    it('should reject promise in case of error', async function () {
      try {
        let api = new ScreepsAPI()
        await api.auth(auth.username, 'bad password')
      } catch (err) {
        assert(err.message.match(/Not authorized/i), 'wrong error message')
      }
    })
  })

  describe('.req()', function () {
    it('should send request to game server and get the answer')
    it('can send GET and POST requests')
    it('should throw an error in case of 401 and if not authenticated')
    it('should read, save and emit authentication token if any')
    it('should use opts.path correctly (ie: for PTR)')
    // Disabled, offifical PTR is down
    // it('should use opts.path correctly (ie: for PTR)', async function() {
    //   // This test must be run against official server (the only one to use PTR)
    //   let opts = {
    //     protocol: 'https',
    //     hostname: 'screeps.com',
    //     port:     443,
    //   }
    //   // Get official server time
    //   let api1 = new ScreepsAPI(opts)
    //   let res1 = await api1.raw.game.time()
    //   let time1 = res1.time
    //   // Get PTR time
    //   opts.path = '/ptr'
    //   let api2 = new ScreepsAPI(opts)
    //   let res2 = await api2.raw.game.time()
    //   let time2 = res2.time
    //   // Compare them
    //   assert.notEqual(time1, time2, 'time for official and PTR should be different')
    // })
    it('should throw an error if response.ok !== 1')
  })

  describe('.gz()', function () {
    it('should unzip data and return JSON')
  })

  describe('.inflate()', function () {
    it('should inflate data')
  })
})
