var sinon = require('sinon');

function addOperations(value) {
  WOLFPACK.operations.push(value);
}

var find = sinon.spy(function (connection, collectionName, options, cb) {
  if (WOLFPACK.errors) {
    return cb(WOLFPACK.errors);
  }

  if (WOLFPACK.operations.length > 0) {
    return cb(null, WOLFPACK.operations.pop());
  }

  if (WOLFPACK.results.find) {
    if (WOLFPACK.results.find.length > 1 && typeof WOLFPACK.results.find[0] === 'object') {
      return cb(null, WOLFPACK.results.find.shift());
    }
    return cb(null, WOLFPACK.results.find[0]);
  }
  return cb(null, []);
});

var create = sinon.spy(function (connection, collectionName, values, cb) {
  if (WOLFPACK.errors) {
    return cb(WOLFPACK.errors);
  }

  if (WOLFPACK.results.create) {
    if (WOLFPACK.results.create.length > 1  && typeof WOLFPACK.results.create[0] === 'object') {
      return cb(null, WOLFPACK.results.create.shift());
    }
    return cb(null, WOLFPACK.results.create[0]);
  }
  return cb(null, values);
});

var update = sinon.spy(function (connection, collectionName, options, values, cb) {
  if (WOLFPACK.errors) {
    return cb(WOLFPACK.errors);
  }

  if (WOLFPACK.results.update) {
    
    if (WOLFPACK.results.update.length > 1  && typeof WOLFPACK.results.update[0] === 'object') {
      var op = WOLFPACK.results.update.shift();
      addOperations(op);
      return cb(null, op);
    }
    addOperations(WOLFPACK.results.update[0]);
    return cb(null, WOLFPACK.results.update[0]);
  }
  addOperations(values);
  return cb(null, values);
});
 
var destroy = sinon.spy(function (connection, collectionName, options, cb) {
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

  var connections = {};

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

    registerConnection: function(connection, collections, cb) {

      // Add in logic here to initialize connection
      // e.g. connections[connection.identity] = new Database(connection, collections);
      connections['wolfpack'] = connection;

      cb();
    },

    find: find,
    create: create,
    update: update,
    destroy: destroy,

    describe: function (connection, collection, cb) {
      return cb();
    },

    define: function (connection, collection, definition, cb) {
      return cb();
    },

    drop: function (connection, collection, relations, cb) {
      return cb();
    },

    identity: 'wolfpack'
  };


  return Adapter;
})();
