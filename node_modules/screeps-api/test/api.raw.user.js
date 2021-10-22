const assert = require('assert');
const _ = require('lodash');
const { ScreepsAPI } = require('../');
const auth = require('./credentials')

describe('api.raw.user', function() {

  this.slow(3000);
  this.timeout(5000);

  describe('.badge (badge)', function() {
    it('should send a request to /api/user/badge which sets user badge',  async function() {
      let opts = _.omit(auth, ['username', 'password'])
      let api = new ScreepsAPI(opts)
      await api.auth(auth.username, auth.password)
      // Save previous badge
      let res = await api.me()
      let initialBadge = res.badge
      // Set new badge
      let newBadge = { type: 16, color1: '#000000', color2: '#000000', color3:'#000000', param: 100, flip: false }
      res = await api.raw.user.badge(newBadge)
      assert.equal(res.ok, 1, 'incorrect server response: ok should be 1')
      // Check that badge was effectively changed
      res = await api.me()
      _.each(res.badge, (value, key) => {
        assert.equal(value, newBadge[key], `badge ${key} is incorrect`)
      })
      // Reset badge
      res = await api.raw.user.badge(initialBadge)
    })
  })

  describe('.respawn ()', function() {
    it('should do untested things (for now)')
  })

  describe('.branches ()', function() {
    it('should send a request to /api/user/branches and return branches list',  async function() {
      let opts = _.omit(auth, ['username', 'password'])
      let api = new ScreepsAPI(opts)
      await api.auth(auth.username, auth.password)
      let res = await api.raw.user.branches()
      assert.equal(res.ok, 1, 'incorrect server response: ok should be 1')
      assert(res.list.length > 0, 'no branch found')
    })
  })

  describe('.cloneBranch (branch, newName, defaultModules)', function() {
    it('should send a request to /api/user/clone-branch in order to clone @branch into @newName',  async function() {
      let opts = _.omit(auth, ['username', 'password'])
      let api = new ScreepsAPI(opts)
      await api.auth(auth.username, auth.password)
      // Create a new branch
      let res = await api.raw.user.cloneBranch('default', 'screeps-api-testing')
      assert.equal(res.ok, 1, 'incorrect server response: ok should be 1')
      // Check if branch was indeed created
      res = await api.raw.user.branches()
      let found = _.find(res.list, { branch: 'screeps-api-testing' })
      assert(found != null, 'branch was not cloned')
    })
  })

  describe('.setActiveBranch (branch, activeName)', function() {
    it('should send a request to /api/user/set-active-branch in order to define @branch as active',  async function() {
      let opts = _.omit(auth, ['username', 'password'])
      let api = new ScreepsAPI(opts)
      await api.auth(auth.username, auth.password)
      // Find current active branch for simulator
      let res = await api.raw.user.branches()
      let initialBranch = _.find(res.list, { activeSim: true })
      assert(initialBranch != null, 'cannot find current active branch for simulator')
      // Change active branch for simulator
      res = await api.raw.user.setActiveBranch('screeps-api-testing', 'activeSim')
      assert.equal(res.ok, 1, 'incorrect server response: ok should be 1')
      // Check if branch was indeed changed
      res = await api.raw.user.branches()
      let found = _.find(res.list, { activeSim: true })
      assert.equal(found.branch, 'screeps-api-testing', 'branch was not set')
      // Reset branch back to initial state
      await api.raw.user.setActiveBranch(initialBranch.branch, 'activeSim')
    })
  })

  describe('.deleteBranch (branch)', function() {
    it('should send a request to /api/user/delete-branch in order to delete @branch',  async function() {
      let opts = _.omit(auth, ['username', 'password'])
      let api = new ScreepsAPI(opts)
      await api.auth(auth.username, auth.password)
      // Delete 'screeps-api-testing' branch
      let res = await api.raw.user.deleteBranch('screeps-api-testing')
      assert.equal(res.ok, 1, 'incorrect server response: ok should be 1')
      // Check if branch was indeed deleted
      res = await api.raw.user.branches()
      let found = _.find(res.list, { branch: 'screeps-api-testing' })
      assert(found == null, 'branch was not deleted')
    })
  })

  describe('.notifyPrefs (prefs)', function() {
    it('should send a request to /api/user/notify-prefs which sets user preferences',  async function() {
      let opts = _.omit(auth, ['username', 'password'])
      let api = new ScreepsAPI(opts)
      await api.auth(auth.username, auth.password)
      let defaults = { disabled: false, disabledOnMessages: false, sendOnline: true, interval: 5, errorsInterval: 30 }
      // Save previous prefs
      let res = await api.me()
      let initialPrefs = _.merge(defaults, res.notifyPrefs)
      // Set new preferences
      let newPrefs = { disabled: true, disabledOnMessages: true, sendOnline: false, interval: 60, errorsInterval: 60 }
      res = await api.raw.user.notifyPrefs(newPrefs)
      assert.equal(res.ok, 1, 'incorrect server response: ok should be 1')
      // Check that preferences were indeed changed
      res = await api.me()
      _.each(res.notifyPrefs, (value, key) => {
        assert.equal(value, newPrefs[key], `preference ${key} is incorrect`)
      })
      // Reset preferences
      res = await api.raw.user.notifyPrefs(initialPrefs)
    })
  })

  describe('.tutorialDone ()', function() {
    it('should do untested things (for now)')
  })

  describe('.email (email)', function() {
    it('should do untested things (for now)')
  })

  describe('.worldStartRoom (shard)', function() {
    it('should do untested things (for now)')
  })

  describe('.worldStatus ()', function() {
    it('should do untested things (for now)')
  })

  describe('.code.get (branch)', function() {
    it('should do untested things (for now)')
    it('should send a GET request to /api/user/code and return user code from specified branch.', async function() {
      let opts = _.omit(auth, ['username', 'password'])
      let api = new ScreepsAPI(opts)
      await api.auth(auth.username, auth.password)
      let res = await api.raw.user.code.get('default')
      assert.equal(res.ok, 1, 'incorrect server response: ok should be 1')
      assert(_.has(res, 'modules'), 'response has no modules field')
      assert(_.has(res, 'branch'), 'response has no branch field')
      assert.equal(res.branch, 'default', 'branch is incorrect')
    })
  })

  describe('.code.set (branch, modules, _hash)', function() {
    it('should do untested things (for now)')
  })

  describe('.respawnProhibitedRooms ()', function() {
    it('should do untested things (for now)')
  })

  describe('.memory.get (path, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.memory.set (path, value, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.segment.get (segment, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.segment.set (segment, data, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.find (username)', function() {
    it('should do untested things (for now)')
  })

  describe('.findById (id)', function() {
    it('should do untested things (for now)')
  })

  describe('.stats (interval)', function() {
    it('should do untested things (for now)')
  })

  describe('.rooms (id)', function() {
    it('should do untested things (for now)')
  })

  describe('.overview (interval, statName)', function() {
    it('should do untested things (for now)')
  })

  describe('.moneyHistory (page = 0)', function() {
    it('should do untested things (for now)')
  })

  describe('.console (expression, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

})