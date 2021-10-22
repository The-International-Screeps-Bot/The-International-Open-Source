const assert = require('assert');
const _ = require('lodash');
const { ScreepsAPI } = require('../');
const auth = require('./credentials')

describe('api.raw.auth', function() {

  this.slow(2000);
  this.timeout(5000);

  describe('.signin (email, password)', function() {
    it('should send a POST request to /api/auth/signin and authenticate', async function() {
      let opts = _.omit(auth, ['username', 'password'])
      let api = new ScreepsAPI(opts)
      let res = await api.raw.auth.signin(auth.username, auth.password)
      assert(_.has(res, 'token'), 'no token found in server answer')
      assert.equal(res.ok, 1, 'res.ok is incorrect')
    })
    it('should reject promise if unauthorized', async function() {
      try {
        let api = new ScreepsAPI()
        await api.raw.auth.signin(auth.username, 'invalid_password')
      } catch (err) {
        assert(err.message.match(/Not authorized/i), 'wrong error message')
      }
    })
  })

  describe('.steamTicket (ticket, useNativeAuth = false)', function() {
    it('should do things... but I\'m not sure what exactly...')
  })

  describe('.me ()', function() {
    it('should return user informations from `/api/auth/me` endpoint', async function() {
      let opts = _.omit(auth, ['username', 'password'])
      let api = new ScreepsAPI(opts)
      await api.auth(auth.username, auth.password)
      let res = await api.raw.auth.me()
      assert(_.has(res, 'email'), 'response has no email field')
      assert(_.has(res, 'badge'), 'response has no badge field')
      assert(_.has(res, 'username'), 'response has no username field')
    })
  })

})