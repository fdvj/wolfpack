var wolfpack = require(__dirname + '/index');

var Model = wolfpack('spec/fixtures/Model');
wolfpack().setFindResults({name: 'My Name', date: new Date()});
try {
  Model.findOne(1).then(function(results){
    data = results;
    ready = true;
  });  
} catch (e) {
  debugger;
}
