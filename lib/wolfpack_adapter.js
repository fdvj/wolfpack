var sinon = require('sinon'),
    _ = require('lodash');

function addOperations(value) {
  WOLFPACK.operations.push(value);
}

function conditionalResults(operation, condition, collectionName) {
  return _.find(WOLFPACK.classResults[collectionName][operation], function(scenario){
    return _.isEqual(scenario.when, condition);
  });
}

var find = sinon.spy(function (connection, collectionName, options, cb) {
  if (WOLFPACK.errors) {
    return cb(WOLFPACK.errors);
  }

  if (WOLFPACK.operations.length > 0) {
    return cb(null, WOLFPACK.operations.pop());
  }

  // Check if we have a conditional result
  if (WOLFPACK.classResults[collectionName].find.length > 0 && options.where) {
    var match = conditionalResults('find', options.where, collectionName);
    if (match) {
      return cb(null, match.result);
    }
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

  // Check if we have a conditional result
  if (WOLFPACK.classResults[collectionName].create.length > 0 && values) {
    var condition = _.clone(values);
    delete condition.createdAt;
    delete condition.updatedAt;
    var match = conditionalResults('create', condition, collectionName);
    if (match) {
      return cb(null, (match.result.length > 1) ? match.result : match.result[0]);
    }
  }

  var value;
  if (WOLFPACK.results.create) {
    if (WOLFPACK.results.create.length > 1  && typeof WOLFPACK.results.create[0] === 'object') {
      value = WOLFPACK.results.create.shift();
      return cb(null, (_.isArray(value) && value.length > 1) ? value : value[0]);
    }
    value = WOLFPACK.results.create[0];
    return cb(null, (_.isArray(value) && value.length > 1) ? value : value[0]);
  }
  return cb(null, values);
});

var update = sinon.spy(function (connection, collectionName, options, values, cb) {
  if (WOLFPACK.errors) {
    return cb(WOLFPACK.errors);
  }

  // Check if we have a conditional result
  if (WOLFPACK.classResults[collectionName].update.length > 0 && values) {

    var match = _.find(WOLFPACK.classResults[collectionName].update, function(scenario){
      var keys = _.keys(scenario.when);
      return _.every(keys, function(key){
        return _.isEqual(scenario.when[key], values[key]);
      });
    });
    
    if (match) {
      var value = (match.result.length > 1) ? match.result : match.result[0];
      addOperations(value);
      return cb(null, value);
    }
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
