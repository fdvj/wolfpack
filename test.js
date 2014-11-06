var wolfpack = require(__dirname + '/index');

var Model = wolfpack('spec/fixtures/Model');
var fixtures = [
  {id: 1, name: 'My Name', date: new Date()},
  {id: 2, name: 'Other name', date: new Date()}
];
wolfpack.setFindResults.apply(this, fixtures);
wolfpack.setUpdateResults({id:1, name: 'Test', date: new Date()});
try {
  Model.findOne(1).then(function(results){
    results.name = "Test";
    results.save(function(err, data){
      console.log(data);
    });
  });  
} catch (e) {
  debugger;
}
