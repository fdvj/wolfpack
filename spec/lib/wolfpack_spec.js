var wolfpack = require(__dirname + '/../../lib/wolfpack');

describe('Wolfpack', function(){

  describe('when called with an argument', function(){
    it("should receive either an object or a path to the model", function(){
      var passing_obj = function() {
        wolfpack({name: 'test'})
      };
      var passing_str = function() {
        wolfpack(__dirname + '/../fixtures/Model');
      };
      var failing_num = function() {
        wolfpack(123);
      };
      var failing_bool = function() {
        wolfpack(true);
      };
      expect(passing_obj).not.toThrow();
      expect(passing_str).not.toThrow();
      expect(failing_num).toThrow();
      expect(failing_bool).toThrow();
    });

    it("should throw an error if the model cannot be loaded", function(){
      var passing = function() {
        wolfpack(__dirname + '/../fixtures/Model');
      };
      var failing = function() {
        wolfpack('./invalid_file');
      };
      expect(passing).not.toThrow();
      expect(failing).toThrow();
    });

    it("should instantiate the model into a sails model", function(){
      var Model = wolfpack(__dirname + '/../fixtures/Model');
      expect(Model.find).toBeDefined();
    });

    it("should provide spies for all Sails model methods", function(){
      var Model = wolfpack(__dirname + '/../fixtures/Model');
      // Test only a couple of them
      expect(Model.findOne.called).toBeDefined();
      expect(Model.find.called).toBeDefined();
      expect(Model.create.called).toBeDefined();
    });

  });

  describe('when called without arguments', function(){

     it("should provide a way to set the results given by the ORM", function(){
      expect(wolfpack().setFindResults).toBeDefined();
      expect(wolfpack().setCreateResults).toBeDefined();
      expect(wolfpack().setUpdateResults).toBeDefined();
      expect(wolfpack().setDeleteResults).toBeDefined();
    });

    it("if a result is provided, it should be given as an instance of the Model", function(){
      var ready = false;
      var data;

      wolfpack().setFindResults({name: 'Test', date: new Date()});
      var Model = wolfpack(__dirname + '/../fixtures/Model');

      runs(function(){
        Model.findOne(1).done(function(err, results){
          ready = true;
          data = results;
        });
      });

      waitsFor(function(){
        return ready == true;
      });

      runs(function(){
        expect(data.save).toBeDefined();
        expect(data.name).toBeDefined();
        expect(data.date).toBeDefined();
        expect(data.instanceMethod).toBeDefined();
      });
    });

    describe("#setFindResults", function(){

    });

    it("should provide a method for resetting results", function(){
      expect(wolfpack().clearResults).toBeDefined();
    });

  });
});