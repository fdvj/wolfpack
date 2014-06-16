// Set the Wolfpack global variable
GLOBAL.WOLFPACK = {
  results: {},
  CRUD: {}
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
    adapter = require(__dirname + '/wolfpack_adapter');


function wolfpack(model_path) {
  
  if (!model_path) {
    return methods();
  }

  var model;
  if (model_path && typeof model_path !== 'object' && typeof model_path !== 'string') {
    throw new Error('WOLFPACK: Please provide a valid path');
  }
  
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
  } else {
    model = model_path;
  }

  // Spy on model custom methods
  for (var idx in model) {
    if (typeof model[idx] === 'function') {
      model[idx] = sinon.spy(model[idx]);
    }
  }

  // Spy on instance custom methods
  if (model.attributes) {
    for (idx in model.attributes) {
      if (typeof model.attributes[idx] === 'function') {
        model.attributes[idx] = sinon.spy(model.attributes[idx]);
      }
    }
  }

  // Instantiate a new instance of the ORM
  waterline = new Waterline();

  var config = {
    adapters: {
      'default': adapter,
      wolfpack: adapter
    },
    connections: {
      wolfpackConnection: {
        adapter: 'wolfpack'
      }
    },
    defaults: {
      schema: false
    }

  };

  // Set the custom connection and make it schemaless
  model.connection = 'wolfpackConnection';
  model.schema = false;
  model.tableName = path.basename(model_path, '.js');

  var Class = Waterline.Collection.extend(model);

  // Load the Models into the ORM
  waterline.loadCollection(Class);

  // Start Waterline passing adapters in
  waterline.initialize(config, function(err, data) {
    if (err) {
      throw new Error('WOLFPACK: Error instantiating model: ' + err);
    }
    
    // Start spying the functions
    model = data.collections.model;
    for (var idx in model) {
      if (typeof model[idx] === 'function') {
        model[idx] = sinon.spy(model[idx]);
      }
    }
  });

  return model;

}

function methods() {

  function setResults(method, results) {
    if (typeof results !== 'object') {
      throw new Error('Results can only be an object');
    }

    if (!Array.isArray(results)) {
      results = [results];
    }
    this.results[method] = results;
  }

  function resetResults() {
    this.results = {};
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


  return {
    setFindResults: setResults.bind(WOLFPACK, 'find'),
    setCreateResults: setResults.bind(WOLFPACK, 'create'),
    setUpdateResults: setResults.bind(WOLFPACK, 'update'),
    clearResults: resetResults.bind(WOLFPACK),
    setErrors: setErrors.bind(WOLFPACK),
    clearErrors: clearErrors.bind(WOLFPACK),
    spy: spyCRUD,
    resetSpy: resetSpies,
    resetSpies: resetSpies
  };
}

module.exports = wolfpack;
