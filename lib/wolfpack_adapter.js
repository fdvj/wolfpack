var sinon = require('sinon');

var find = sinon.spy(function (collectionName, options, cb) {
  if (WOLFPACK.errors) {
    return cb(WOLFPACK.errors);
  }

  if (WOLFPACK.results.find) {
    return cb(null, WOLFPACK.results.find);
  }
  return cb(null, []);
});

var create = sinon.spy(function (collectionName, values, cb) {
  if (WOLFPACK.errors) {
    return cb(WOLFPACK.errors);
  }

  if (WOLFPACK.results.create) {
    return cb(null, WOLFPACK.results.create);
  }
  return cb(null, values);
});

var update = sinon.spy(function (collectionName, options, values, cb) {
  if (WOLFPACK.errors) {
    return cb(WOLFPACK.errors);
  }

  if (WOLFPACK.results.update) {
    return cb(null, WOLFPACK.results.update);
  }
  return cb(null, values);
});
 
var destroy = sinon.spy(function (collectionName, options, cb) {
  if (WOLFPACK.errors) {
    return cb(WOLFPACK.errors);
  }
  return cb();
});

// Set pointers for CRUD operations
WOLFPACK.CRUD = {
  find: find,
  create: create,
  update: update,
  destroy: destroy
};

module.exports = (function () {


  /**
   * WolfpackAdapter
   * 
   * @module      :: Adapter
   * @description :: An adapter for db-less testings
   * @docs        :: http://github.com/fdvj/wolfpack
   *
   * @syncable    :: false
   * @schema      :: false
   */

  var _modelReferences = {};

  var Adapter = {

    syncable: false,
    defaults: {
      schema: false
    },

    /**
     * registerCollection() is run multiple times (once for each model, aka collection)
     * before the server ever starts.  It allows us to register our models with the
     * underlying adapter interface.  (don't forget to cb() when you're done!)
     */

    registerCollection: function (collection, cb) {
       // Keep a reference to this collection
      _modelReferences[collection.identity] = collection;

      cb();
    },

    find: find,
    create: create,
    update: update,
    destroy: destroy

  };


  return Adapter;
})();
