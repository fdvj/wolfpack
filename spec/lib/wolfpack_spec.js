var wolfpack = require(__dirname + '/../../lib/wolfpack');

describe('Wolfpack', function(){

  describe('when called with an argument', function(){
    it("should receive either an object or a path to the model", function(){
      var passing_obj = function() {
        wolfpack({name: 'test'});
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

    it("should be able to locate the model if given on the process level", function(){
      var passing = function() {
        wolfpack('spec/fixtures/Model');
      };
      expect(passing).not.toThrow();
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

    it("should provide spies for custom model methods", function(){
      var Model = wolfpack(__dirname + '/../fixtures/Model');
      expect(Model.modelMethod.called).toBeDefined();
      // The fixture returns true so calling it should return true
      expect(Model.modelMethod()).toBeTruthy();
    });

    it("should provide spies for custom instance methods", function(){
      var Model = wolfpack(__dirname + '/../fixtures/Model');
      var fixture = {name: 'My Name', date: new Date()};
      var data, ready;
      wolfpack().setFindResults(fixture);
      
      runs(function(){
        Model.findOne(1).done(function(err, results){
          data = results;
          ready = true;
        });
      });

      waitsFor(function(){
        return ready === true;
      });

      runs(function(){
        expect(data.instanceMethod.called).toBeDefined();
        // Fixture returns true so calling it should return true
        expect(data.instanceMethod()).toBeTruthy();
      });
    });

  });

  describe('when called without arguments', function(){
    var Model = wolfpack(__dirname + '/../fixtures/Model');
    var ready, data, fixture, errors;

    function async(err, results) {
      ready = true;
      data = results;
      errors = err;
    }

    function asyncReady() {
      return ready === true;
    }

    function asyncReset() {
      ready = false;
      data = null;
      errors = null;
    }

    beforeEach(function(){
      fixture = {name: 'My Name', date: new Date()};
      data = null;
      ready = false;
      errors = null;
      wolfpack().clearErrors();
    });

    it("should provide a way to set the results given by the ORM", function(){
      expect(wolfpack().setFindResults).toBeDefined();
      expect(wolfpack().setCreateResults).toBeDefined();
      expect(wolfpack().setUpdateResults).toBeDefined();
    });

    it("results provided can only be an object or an array of objects", function(){
      var passing_obj = function() {
        wolfpack().setFindResults({name: 'test'});
      };

      var passing_arr = function() {
        wolfpack().setFindResults([{name: 'test'}]);
      };

      var failing = function() {
        wolfpack().setFindResults(123);
      };

      expect(passing_obj).not.toThrow();
      expect(passing_arr).not.toThrow();
      expect(failing).toThrow();
    });

    it("should be able to set the results for a find operation to the given values", function(){
     
      runs(function(){
        wolfpack().setFindResults(fixture);
        Model.findOne(1).done(async);
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(data.name).toBe(fixture.name);
        expect(data.date).toBe(fixture.date);
      });
    });

    it("should be able to set the results for a create operation to the given values", function(){
      runs(function(){
        wolfpack().setCreateResults(fixture);
        Model.create(fixture).done(async);
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(data[0].name).toBe(fixture.name);
        expect(data[0].date).toBe(fixture.date);
      });
    });

    it("should be able to set the results for a update operation to the given values", function(){
      runs(function(){
        fixture.id = 1;
        wolfpack().setFindResults(fixture);
        wolfpack().setUpdateResults({id:1, name: 'Test', date: new Date()});
        Model.findOne(1).done(function(err, model){
          model.name = 'Test';
          model.save(async);
        });
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(data.name).toBe('Test');
      });
    });

    it("if a result is provided, it should be given as an instance of the Model", function(){
      wolfpack().setFindResults(fixture);

      runs(function(){
        Model.findOne(1).done(async);
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(data.save).toBeDefined();
        expect(data.name).toBeDefined();
        expect(data.date).toBeDefined();
        expect(data.instanceMethod).toBeDefined();
      });
    });

    it("if there is a problem during instantiation, it should throw it", function(){
      var failing = function() {
        wolfpack([]);
      };
      expect(failing).toThrow();
    });

    it("if no results are provided for find operation, it should return emtpy", function(){
      wolfpack().clearResults();
      runs(function(){
        Model.findOne(1).done(async);
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(data).not.toBeDefined();
      });
    });

    it("if no results are provided for create operation, it should return the given create values", function(){
      wolfpack().clearResults();
      runs(function(){
        Model.create(fixture).done(async);
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(data.name).toBe(fixture.name);
        expect(data.date).toBe(fixture.date);
      });
    });

    it("if an error occurs in create operation, it should return the error", function(){
      wolfpack().setErrors('errors');
      runs(function(){
        Model.create(fixture).done(async);
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(errors).toBe('errors');
      });
    });

    it("if no results are provided for update operation it should return the model values", function(){
      wolfpack().clearResults();
      fixture.id = 1;
      wolfpack().setFindResults(fixture);

      runs(function(){
        Model.findOne(1).done(function(err, model){
          model.name = 'another';
          model.save(async);
        });
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(data.name).toBe('another');
      });
    });

    it("if an error occurs in update operation, it should return the error", function(){
      fixture.id = 1;
      wolfpack().setFindResults(fixture);
      runs(function(){
        Model.findOne(1).done(function(err, model){
          wolfpack().setErrors('errors');
          model.name = 'different';
          model.save(async);
        });
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(errors).toBe('errors');
      });
    });

    it("if an error occurs during a destroy operation, it should return the error", function(){
      fixture.id = 1;
      wolfpack().setFindResults(fixture);
      runs(function(){
        Model.findOne(1).done(function(err, model){
          wolfpack().setErrors('errors');
          model.destroy(async);
        });
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(errors).toBe('errors');
      });
    });

    it("if no errors occur, it should return nothing as always", function(){
      fixture.id = 1;
      wolfpack().setFindResults(fixture);
      runs(function(){
        Model.findOne(1).done(function(err, model){
          model.destroy(async);
        });
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(data).not.toBeDefined();
      });
    });

    it("should provide a method for resetting results", function(){
      wolfpack().setFindResults(fixture);
      wolfpack().clearResults();
      
      runs(function(){
        Model.findOne(1).done(async);
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(data).not.toBeDefined();
      });
    });

    it("should provide a way for setting errors", function(){
      wolfpack().setErrors('error');
      runs(function(){
        Model.findOne(1).done(async);
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(errors).toBe('error');
      });
    });

    it("should provide a way for resetting errors", function(){
      wolfpack().clearErrors();
      runs(function(){
        Model.findOne(1).done(async);
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(errors).not.toBeDefined();
      });
    });

    it("should provide a way for testing if a CRUD operation was performed in the adapter", function(){
      wolfpack().resetSpies();
      var spy = wolfpack().spy('find');
      runs(function(){
        Model.findOne(1).done(async);
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(spy.called).toBeTruthy();
        // Test if the other CRUD spies have been set
        expect(wolfpack().spy('create').called).toBeDefined();
        expect(wolfpack().spy('update').called).toBeDefined();
        expect(wolfpack().spy('destroy').called).toBeDefined();
      });
    });

    it("should provide a way for individually resetting CRUD spies", function(){
      var spy = wolfpack().spy('find');
      runs(function(){
        Model.findOne(1).done(async);
      });

      waitsFor(asyncReady);

      runs(function(){
        // Reset the spy and see if it resetted
        wolfpack().resetSpy('find');
        expect(spy.called).toBeFalsy();
      });
    });

    it("should provide a way for resetting all CRUD spies at once", function(){
      var findSpy = wolfpack().spy('find');
      var createSpy = wolfpack().spy('create');

      runs(function(){
        Model.findOne(1).done(async);
      });

      waitsFor(asyncReady);

      runs(function(){
        // Reset async to execute another call
        asyncReset();
        Model.create({name: 'test'}).done(async);
      });

      waitsFor(asyncReady);

      runs(function(){
        wolfpack().resetSpies();
        expect(findSpy.called).toBeFalsy();
        expect(createSpy.called).toBeFalsy();
      });
    });

  });
});