var Waterline = require('waterline'),
    sinon = require('sinon'),
    q = require('q'),
    path = require('path'),
    adapter = require(__dirname + '/wolfpack_adapter');


// Set the Wolfpack global variable
GLOBAL.WOLFPACK = {
  results: {}
};

function wolfpack(model_path) {
  
  if (!model_path) {
    return methods();
  }

  var model;
  if (model_path && typeof model_path !== 'object' && typeof model_path !== 'string') {
    throw Error('WOLFPACK: Please provide a valid path');
  }
  
  if (typeof model_path === 'string') {
    // Load the model
    try {
      model = require(model_path);
    } catch (e) {
      throw Error('WOLFPACK: Cannot load model: ' + e.message);
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

  // Set the custom adapter
  model.adapter = 'wolfpack';

  var Class = Waterline.Collection.extend(model);
  // Instantiate the collection
  var instance = new Class({tableName: path.basename(model_path, '.js'), adapters: { wolfpack: adapter}}, function(err, Model){
    if (err) {
      throw Error('WOLFPACK: Error instantiating model: ' + err);
    }
    
    // Start spying the functions
    for (var idx in Model) {
      if (typeof Model[idx] === 'function') {
        Model[idx] = sinon.spy(Model[idx]);
      }
    }
  });
  return instance;

}

function methods() {

  function setResults(method, results) {
    if (typeof results !== 'object') {
      throw Error('Results can only be an object');
    }

    if (!Array.isArray(results)) {
      results = [results];
    }
    this.results[method] = results;
  }

  function resetResults() {
    this.results = {};
  }

  return {
    findResults: setResults.bind(WOLFPACK, 'find'),
    resetResults: resetResults.bind(WOLFPACK)
  }
}

module.exports = wolfpack;