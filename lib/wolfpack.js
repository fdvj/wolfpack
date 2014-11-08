// Set the Wolfpack global variable
GLOBAL.WOLFPACK = {
  results: {},
  CRUD: {},
  operations: [],
  classResults:{}
};

var Waterline;

try {
  // Try loading waterline from sails first rather than from package
  Waterline = require(__dirname + '/../../sails/node_modules/waterline');
} catch (e) {
  // If it cannot be loaded, then load wolfpack's waterline
  Waterline = require('waterline');
}

var sinon = require('sinon'),
    path = require('path'),
    adapter = require(__dirname + '/wolfpack_adapter'),
    rs = require('random-strings'),
    _ = require('lodash');


function wolfpack(model_path) {
  
  if (!model_path) {
    return methods();
  }

  var model;
  if ((model_path && typeof model_path !== 'object' && typeof model_path !== 'string') || (typeof model_path === 'object' && !model_path.attributes)) {
    throw new Error('WOLFPACK: Please provide a valid path or object');
  }
  
  var modelName;
  if (typeof model_path === 'string') {
    // Load the model
    try {
      model = require(path.join(process.cwd(), model_path));
    } catch (e) {
      try {
        model = require(model_path);
      } catch (e) {
        throw new Error('WOLFPACK: Cannot load model: ' + e.message);
      }
    }
    var splitPath =  model_path.split('/');
    modelName = splitPath[splitPath.length - 1];
  } else {
    model = model_path;
    modelName = rs.human(20);
  }

  // Spy on model class methods
  for (var idx in model) {
    if (typeof model[idx] === 'function') {
      model[idx] = sinon.spy(model[idx]);
    }
  }

  var pk = false;
  var attrKeys;

  // Spy on instance methods
  if (model.attributes) {
    for (idx in model.attributes) {
      if (typeof model.attributes[idx] === 'function') {
        model.attributes[idx] = sinon.spy(model.attributes[idx]);
      }
      // Check for associations and delete them
      if (_.isObject(model.attributes[idx])) {
        attrKeys = _.keys(model.attributes[idx]);
        if (attrKeys.indexOf('via') > -1 || attrKeys.indexOf('collection') > -1 || attrKeys.indexOf('model') > -1) {
          delete model.attributes[idx].via;
          delete model.attributes[idx].collection;
          delete model.attributes[idx].model;
          delete model.attributes[idx].dominant;
          model.attributes[idx].type = 'json';
        }
      }
    }
  }

  
  // Instantiate a new instance of the ORM
  waterline = new Waterline();

  var config = {
    adapters: {
      'default': adapter,
      'wolfpack': adapter
    },
    connections: {
      wolfpack: {
        adapter: 'wolfpack'
      }
    },
    defaults: {
      schema: false
    }
  };

  // Set the custom adapter and schemales
  model.connection = 'wolfpack';
  model.schema = false;
  model.identity = modelName;

  var Class = Waterline.Collection.extend(model);
  waterline.loadCollection(Class);
  
  var CollectionLoader = require('waterline/lib/waterline/collection/loader');
  var Connections = require('waterline/lib/waterline/connections');
  var Schema = require('waterline/node_modules/waterline-schema');
  
  var connections = new Connections(config.adapters, config.connections);
  var loader = new CollectionLoader(Class, connections, {});
  var schema = new Schema([Class], this.connections, {});
  var context = {
    connections: connections,
    schema: schema,
    collections: {}
  };
  
  // Initialize the collection
  var instance = loader.initialize(context);
  context.collections[instance.identity.toLowerCase()] = instance;

  // Time to spy
  for (idx in instance) {
    if (typeof instance[idx] === 'function') {
      instance[idx] = sinon.spy(instance[idx]);
    }
  }

  // Add wolfpack mock result methos
  instance.wolfpack = new ClassMocks(instance.identity);

  // Only add references if the model does not have a method called that way already
  if (!instance.setFindResults) {
    instance.setFindResults = instance.wolfpack.setFindResults;
  }

  if (!instance.setCreateResults) {
    instance.setCreateResults = instance.wolfpack.setCreateResults;
  }

  if (!instance.setUpdateResults) {
    instance.setUpdateResults = instance.wolfpack.setUpdateResults;
  }

  return instance;
}

function setResults() {
  var results = _.map(arguments, function(arg){
    if (!_.isObject(arg)) {
      throw new Error('Results can only be an object');
    }
    if (!_.isArray(arg)) {
      return [arg];
    }
    return arg;
  });
  WOLFPACK.results[this] = results;
}

function resetResults() {
  this.results = {};
  for (var idx in this.classResults) {
    this.classResults[idx] = {
      find: [],
      create: [],
      update: []
    };
  }
}

function setErrors(error) {
  this.errors = error;
}

function clearErrors() {
  delete this.errors;
}

function spyCRUD(operation) {
  return WOLFPACK.CRUD[operation];
}

function resetSpies(crud_operation) {
  if (crud_operation) {
    return spyCRUD(crud_operation).reset();
  }
  for (var idx in WOLFPACK.CRUD) {
    WOLFPACK.CRUD[idx].reset();
  }
  return true;
}

function methods() {
  return {
    setFindResults: setResults.bind('find'),
    setCreateResults: setResults.bind('create'),
    setUpdateResults: setResults.bind('update'),
    clearResults: resetResults.bind(WOLFPACK),
    setErrors: setErrors.bind(WOLFPACK),
    clearErrors: clearErrors.bind(WOLFPACK),
    spy: spyCRUD,
    resetSpy: resetSpies,
    resetSpies: resetSpies
  };
}

/*
 * Class mocks
 */

function ClassMocks(className) {
  var self = this;

  function _setResults(when, result) {
    if (!_.isObject(result)) {
      throw new Error('Results can only be an object');
    }
    if (!_.isObject(when)) {
      throw new Error('When must be an object');
    }

    if (!_.isArray(result)) {
      result = [result];
    }
    
    WOLFPACK.classResults[self._identity][this.toString()].push({
      when: when,
      result: result
    });
  }

  this._identity = className;

  WOLFPACK.classResults[this._identity] = {
    find: [],
    create: [],
    update: []
  };

  // Methods
  this.setFindResults = _setResults.bind('find');
  this.setCreateResults = _setResults.bind('create');
  this.setUpdateResults = _setResults.bind('update');
}


/*
 * Object references
 */
wolfpack.setFindResults = setResults.bind('find');
wolfpack.setCreateResults = setResults.bind('create');
wolfpack.setUpdateResults = setResults.bind('update');
wolfpack.clearResults = resetResults.bind(WOLFPACK);
wolfpack.setErrors = setErrors.bind(WOLFPACK);
wolfpack.clearErrors = clearErrors.bind(WOLFPACK);
wolfpack.spy = spyCRUD;
wolfpack.resetSpy = resetSpies;
wolfpack.resetSpies = resetSpies;

module.exports = wolfpack;