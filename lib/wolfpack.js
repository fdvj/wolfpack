var Waterline = require('waterline'),
    sinon = require('sinon'),
    q = require('q'),
    path = require('path');

function wolfpack(model_path) {
  var model;
  if (model_path && typeof model_path !== 'string') {
    throw Error('WOLFPACK: Please provide a valid path');
  }
  
  // Load the model
  try {
    model = require(model_path);
  } catch (e) {
    throw Error('WOLFPACK: Cannot load model: ' + e.message);
  }

  var Class = Waterline.Collection.extend({model});
  // Instantiate the collection
  var instance = new Class({tableName: path.basename(model_path, '.js')}, function(err, Model){
    if (err) {
      throw Error('WOLFPACK: Error instantiating model: ' + err);
    }

    // Start stubbing the functions

  });

}

module.exports = wolfpack;