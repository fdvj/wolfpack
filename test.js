var wolfpack = require(__dirname + '/index');

var Model = wolfpack('spec/fixtures/Model');
var fixtures = [
  {id: 1, name: 'My Name', date: new Date()},
  {id: 2, name: 'Other name', date: new Date()},
  {id: 3, name: 'Last name', date: new Date()}
];
wolfpack.setFindResults(fixtures[0]);
Model.wolfpack.setUpdateResults({name: 'blah'}, fixtures[0]);
Model.wolfpack.setUpdateResults({date: new Date('2009-09-09')}, fixtures[1]);
Model.wolfpack.setUpdateResults({date: new Date('2009-01-01'), name: 'blah'}, fixtures[2]);

try {
   var Assoc1 = wolfpack({
      attributes: {
        name: {
          type: 'string'
        },
        association: {
          via: 'model',
          dominant: true,
          collection: 'test'
        }
      }
    });

   debugger;

  Model.findOne(1).then(function(model){
    model.name = 'blah';
    model.date = new Date('2009-01-01');
    model.save(function(err, results){
      debugger;
    });
  });
} catch (e) {
  debugger;
}
