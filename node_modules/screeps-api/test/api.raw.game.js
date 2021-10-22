const assert = require('assert');
const _ = require('lodash');
const { ScreepsAPI } = require('../');
const auth = require('./credentials')

describe('api.raw.userMessages', function() {

  this.slow(2000);
  this.timeout(5000);

  describe('.mapStats (rooms, statName, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.genUniqueObjectName (type, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.checkUniqueObjectName (type, name, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.placeSpawn (room, x, y, name, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.createFlag (room, x, y, name, color = 1, secondaryColor = 1, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.genUniqueFlagName (shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.checkUniqueFlagName (name, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.changeFlagColor (color = 1, secondaryColor = 1, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.removeFlag (room, name, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.addObjectIntent (room, name, intent, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.createConstruction (room, x, y, structureType, name, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.setNotifyWhenAttacked (_id, enabled = true, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.createInvader (room, x, y, size, type, boosted = false, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.removeInvader (_id, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.time (shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.worldSize (shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.roomTerrain (room, encoded = 1, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.roomStatus (room, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.roomOverview (room, interval = 8, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.market.ordersIndex (shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.market.myOrders ()', function() {
    it('should do untested things (for now)')
  })

  describe('.market.orders (resourceType, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  describe('.market.stats (resourceType, shard = DEFAULT_SHARD)', function() {
    it('should do untested things (for now)')
  })

  // This endpoint is not implemented on S+
  describe.skip('.shards.info ()', function() {
    it('should send a request to /api/shards/info and return shards informations', async function() {
      let opts = _.omit(auth, ['email', 'password'])
      let api = new ScreepsAPI(opts)
      let res = await api.raw.game.shards.info()
      assert.equal(res.ok, 1, 'incorrect server response: ok should be 1')
      assert(_.has(res, 'shards'), 'response has no shards field')
      res.shards.forEach((shard, idx) => {
        assert(_.has(shard, 'name'), `shard ${idx} has no name field`)
        assert(_.has(shard, 'rooms'), `shard ${idx} has no rooms field`)
        assert(_.has(shard, 'users'), `shard ${idx} has no users field`)
        assert(_.has(shard, 'tick'), `shard ${idx} has no tick field`)
      })
    })
  })

})