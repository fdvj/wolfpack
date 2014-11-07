var wolfpack = require(__dirname + '/../../lib/wolfpack');

describe('Wolfpack', function(){

  describe('when called with an argument', function(){
    it("should receive either an object or a path to the model", function(){
      var passing_obj = function() {
        wolfpack({
          attributes: {
            name: {
              type: 'string'
            }
          }
        });
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

    it("should remove any associations and the associated attribute to json type", function(){
      var Assoc1 = wolfpack({
        attributes: {
          name: {
            type: 'string'
          },
          association: {
            via: 'model',
            dominant: true,
            collection: 'test',
            model: 'another'
          }
        }
      });
      var attributes = Assoc1._attributes;
      expect(attributes.association.dominant).not.toBeDefined();
      expect(attributes.association.via).not.toBeDefined();
      expect(attributes.association.model).not.toBeDefined();
      expect(attributes.association.collection).not.toBeDefined();
      expect(attributes.association.type).toEqual('json');
    });

    it("should provide spies for custom class methods", function(){
      var Model = wolfpack(__dirname + '/../fixtures/Model');
      expect(Model.modelMethod.called).toBeDefined();
      // The fixture returns true so calling it should return true
      expect(Model.modelMethod()).toBeTruthy();
    });

    it("should provide spies for custom instance methods", function(){
      var Model = wolfpack(__dirname + '/../fixtures/Model');
      var fixture = {name: 'My Name', date: new Date()};
      var data, ready;
      
      runs(function(){
        wolfpack().setFindResults(fixture);
        Model.findOne(1).then(function(results){
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

  describe('when called the object itself', function(){
    var Model = wolfpack(__dirname + '/../fixtures/Model');
    var ready, data, fixture, errors;

    function async(results) {
      ready = true;
      data = results;
    }

    function asyncErr(err) {
      errors = err;
      ready = true;
    }

    function asyncForDone(err, results) {
      asyncErr(err);
      async(results);
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
      fixtures = [
        {
          name: 'My Name', date: new Date()
        },
        {
          name: 'Another Name', date: new Date('2011-01-01')
        },
        {
          name: 'Last Name', date: new Date('2012-01-01')
        }
      ];
      fixture = fixtures[0];
      data = null;
      ready = false;
      errors = null;
      wolfpack.clearErrors();
      wolfpack.clearResults();
    });

    it("should provide a way to set the results given by the ORM", function(){
      expect(wolfpack.setFindResults).toBeDefined();
      expect(wolfpack.setCreateResults).toBeDefined();
      expect(wolfpack.setUpdateResults).toBeDefined();
    });

    it("results provided can only be an object or an array of objects", function(){
      var passing_obj = function() {
        wolfpack.setFindResults({name: 'test'});
      };

      var passing_arr = function() {
        wolfpack.setFindResults([{name: 'test'}]);
      };

      var failing = function() {
        wolfpack.setFindResults(123);
      };

      expect(passing_obj).not.toThrow();
      expect(passing_arr).not.toThrow();
      expect(failing).toThrow();
    });

    it("should be able to set the results for a find operation to the given values", function(){
     
      runs(function(){
        wolfpack.setFindResults(fixture);
        Model.findOne(1).then(async).catch(asyncErr);
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(data.name).toBe(fixture.name);
        expect(data.date).toBe(fixture.date);
      });
    });

    it("should be able to set the results for a create operation to the given values", function(){
      runs(function(){
        wolfpack.setCreateResults(fixture);
        Model.create(fixture).then(async).catch(asyncErr);
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(data.name).toBe(fixture.name);
        expect(data.date).toBe(fixture.date);
      });
    });

    it("should be able to set the results for an update operation to the given values", function(){
      var updateResults;
      runs(function(){
        fixture.id = 1;
        wolfpack.setFindResults(fixture);
        wolfpack.setUpdateResults({id:1, name: 'Test', date: new Date()});
        Model.findOne(1).then(function(model){
          model.name = 'Test';
          model.save(function(err, data){
            updateResults = data;
          });
        });
      });

      waitsFor(function(){
        return updateResults;
      });

      runs(function(){
        expect(updateResults.name).toBe('Test');
      });
    });

    describe('when multiple results are given', function(){

      // Find
      it("should return the results in the order they were given (find)", function(){
        runs(function(){
          wolfpack.setFindResults.apply(this, fixtures);
          Model.findOne(1).then(async).catch(asyncErr);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[0].name);
          expect(data.date).toBe(fixtures[0].date);
          asyncReset();
          Model.findOne(2).then(async).catch(asyncErr);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[1].name);
          expect(data.date).toBe(fixtures[1].date);
          asyncReset();
          Model.findOne(3).then(async).catch(asyncErr);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[2].name);
          expect(data.date).toBe(fixtures[2].date);
        });
      });

      it("should return an the last given result when all previous have been returned (find)", function(){
        runs(function(){
          wolfpack.setFindResults.apply(this, fixtures);
          Model.findOne(1).then(async).catch(asyncErr);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[0].name);
          expect(data.date).toBe(fixtures[0].date);
          asyncReset();
          Model.findOne(2).then(async).catch(asyncErr);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[1].name);
          expect(data.date).toBe(fixtures[1].date);
          asyncReset();
          Model.findOne(3).then(async).catch(asyncErr);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[2].name);
          expect(data.date).toBe(fixtures[2].date);
          asyncReset();
          Model.findOne(3).then(async).catch(asyncErr);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[2].name);
          expect(data.date).toBe(fixtures[2].date);
        });
      });

      // Create
      it("should return the results in the order they were given (create)", function(){
        runs(function(){
          wolfpack.setCreateResults.apply(this, fixtures);
          Model.create(fixture).then(async).catch(asyncErr);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[0].name);
          expect(data.date).toBe(fixtures[0].date);
          asyncReset();
          Model.create(fixture).then(async).catch(asyncErr);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[1].name);
          expect(data.date).toBe(fixtures[1].date);
          asyncReset();
          Model.create(fixture).then(async).catch(asyncErr);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[2].name);
          expect(data.date).toBe(fixtures[2].date);
        });
      });

      it("should return an the last given result when all previous have been returned (create)", function(){
        runs(function(){
          wolfpack.setCreateResults.apply(this, fixtures);
          Model.create(fixture).then(async).catch(asyncErr);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[0].name);
          expect(data.date).toBe(fixtures[0].date);
          asyncReset();
          Model.create(fixture).then(async).catch(asyncErr);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[1].name);
          expect(data.date).toBe(fixtures[1].date);
          asyncReset();
          Model.create(fixture).then(async).catch(asyncErr);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[2].name);
          expect(data.date).toBe(fixtures[2].date);
          asyncReset();
          Model.create(fixture).then(async).catch(asyncErr);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[2].name);
          expect(data.date).toBe(fixtures[2].date);
        });
      });
      
      // Update
      it("should return the results in the order they were given (update)", function(){
        function update(model) {
          model.name = 'Test';
          model.date = Date('2000-01-01');
          model.save(function(err, results){
            async(results);
          });
        }

        runs(function(){
          fixture.id = 1;
          wolfpack.setUpdateResults.apply(this, fixtures);
          wolfpack.setFindResults(fixture);
          Model.findOne(1).then(update);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[0].name);
          expect(data.date).toBe(fixtures[0].date);
          asyncReset();
          Model.findOne(1).then(update);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[1].name);
          expect(data.date).toBe(fixtures[1].date);
          asyncReset();
          Model.findOne(1).then(update);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[2].name);
          expect(data.date).toBe(fixtures[2].date);
        });
      });

      it("should return an the last given result when all previous have been returned (update)", function(){
        function update(model) {
          model.name = 'Test';
          model.date = Date('2000-01-01');
          model.save(function(err, results){
            async(results);
          });
        }

        runs(function(){
          fixture.id = 1;
          wolfpack.setUpdateResults.apply(this, fixtures);
          wolfpack.setFindResults(fixture);
          Model.findOne(1).then(update);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[0].name);
          expect(data.date).toBe(fixtures[0].date);
          asyncReset();
          Model.findOne(1).then(update);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[1].name);
          expect(data.date).toBe(fixtures[1].date);
          asyncReset();
          Model.findOne(1).then(update);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[2].name);
          expect(data.date).toBe(fixtures[2].date);
          Model.findOne(1).then(update);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data.name).toBe(fixtures[2].name);
          expect(data.date).toBe(fixtures[2].date);
        });
      });

    });

    it("if a result is provided, it should be given as an instance of the Model", function(){
      wolfpack.setFindResults(fixture);

      runs(function(){
        Model.findOne(1).then(async).catch(asyncErr);
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
      runs(function(){
        wolfpack.clearResults();
        Model.findOne(1).then(async).catch(asyncErr);
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(data).not.toBeDefined();
      });
    });

    it("if no results are provided for create operation, it should return the given create values", function(){
      runs(function(){
        wolfpack.clearResults();
        Model.create(fixture).then(async).catch(asyncErr);
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(data.name).toBe(fixture.name);
        expect(data.date).toBe(fixture.date);
      });
    });

    it("if an error occurs in create operation, it should return the error and stack", function(){
      runs(function(){
        wolfpack.setErrors('errors');
        Model.create(fixture).then(async).catch(asyncErr);
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(errors.originalError).toBe('errors');
        expect(errors.rawStack).toBeDefined();
      });
    });

    it("if no results are provided for update operation it should return the model values", function(){
      runs(function(){
        wolfpack.clearResults();
        fixture.id = 1;
        wolfpack.setFindResults(fixture);
        Model.findOne(1).then(function(model){
          model.name = 'another';
          model.save(asyncForDone);
        });
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(data.name).toBe('another');
      });
    });

    it("if an error occurs in update operation, it should return the error", function(){
      runs(function(){
        fixture.id = 1;
        wolfpack.setFindResults(fixture);
        Model.findOne(1).then(function(model){
          wolfpack.setErrors('errors');
          model.name = 'different';
          model.save(asyncForDone);
        });
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(errors.originalError).toBe('errors');
        expect(errors.rawStack).toBeDefined();
      });
    });

    it("if an error occurs during a destroy operation, it should return the error", function(){
      runs(function(){
        fixture.id = 1;
        wolfpack.setFindResults(fixture);
        Model.findOne(1).then(function(model){
          wolfpack.setErrors('errors');
          model.destroy(asyncErr);
        });
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(errors.originalError).toBe('errors');
        expect(errors.rawStack).toBeDefined();
      });
    });

    it("if no errors occur, it should return nothing as always", function(){
      runs(function(){
        fixture.id = 1;
        wolfpack.setFindResults(fixture);
        Model.findOne(1).then(function(model){
          model.destroy(async);
        });
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(data).toBeNull();
      });
    });

    it("should provide a method for resetting results", function(){
      runs(function(){
        wolfpack.setFindResults(fixture);
        wolfpack.clearResults();
        Model.findOne(1).then(async);
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(data).not.toBeDefined();
      });
    });

    it("should provide a way for setting errors", function(){
      runs(function(){
        wolfpack.setErrors('error');
        Model.findOne(1).then(async).catch(asyncErr);
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(errors.originalError).toBe('error');
        expect(errors.rawStack).toBeDefined();
      });
    });

    it("should provide a way for resetting errors", function(){
      runs(function(){
        wolfpack.clearErrors();
        Model.findOne(1).then(async).catch(asyncErr);
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(errors).toBeNull();
      });
    });

    it("should provide a way for testing if a CRUD operation was performed in the adapter", function(){
      var spy;
      runs(function(){
        wolfpack.resetSpies();
        spy = wolfpack.spy('find');
        Model.findOne(1).then(async);
      });

      waitsFor(asyncReady);

      runs(function(){
        expect(spy.called).toBeTruthy();
        // Test if the other CRUD spies have been set
        expect(wolfpack.spy('create').called).toBeDefined();
        expect(wolfpack.spy('update').called).toBeDefined();
        expect(wolfpack.spy('destroy').called).toBeDefined();
      });
    });

    it("should provide a way for individually resetting CRUD spies", function(){
      var spy;
      runs(function(){
        spy = wolfpack.spy('find');
        Model.findOne(1).then(async);
      });

      waitsFor(asyncReady);

      runs(function(){
        // Reset the spy and see if it resetted
        wolfpack.resetSpy('find');
        expect(spy.called).toBeFalsy();
      });
    });

    it("should provide a way for resetting all CRUD spies at once", function(){
      var findSpy = wolfpack.spy('find');
      var createSpy = wolfpack.spy('create');

      runs(function(){
        findSpy = wolfpack.spy('find');
        createSpy = wolfpack.spy('create');
        Model.findOne(1).then(async);
      });

      waitsFor(asyncReady);

      runs(function(){
        // Reset async to execute another call
        asyncReset();
        Model.create({name: 'test'}).then(async);
      });

      waitsFor(asyncReady);

      runs(function(){
        wolfpack.resetSpies();
        expect(findSpy.called).toBeFalsy();
        expect(createSpy.called).toBeFalsy();
      });
    });

    it("should provide class methods to allow mocking specific scenarions", function(){
      expect(Model.wolfpack).toBeDefined();
      expect(Model.wolfpack.setFindResults).toBeDefined();
      expect(Model.wolfpack.setCreateResults).toBeDefined();
      expect(Model.wolfpack.setUpdateResults).toBeDefined();
    });

    it("should provide shortcut methods to class mocking result methods", function(){
      expect(Model.setFindResults).toBeDefined();
      expect(Model.setCreateResults).toBeDefined();
      expect(Model.setUpdateResults).toBeDefined();
      expect(Model.setFindResults).toEqual(Model.wolfpack.setFindResults);
      expect(Model.setCreateResults).toEqual(Model.wolfpack.setCreateResults);
      expect(Model.setUpdateResults).toEqual(Model.wolfpack.setUpdateResults);
    });

    it("should be able to set find results based in a condition", function(){
      runs(function(){
        Model.setFindResults({id:1}, fixtures[0]);
        Model.setFindResults({name: 'test'}, fixtures[1]);
        Model.setFindResults({id:1, name: 'test'}, fixtures[2]);
        Model.find({id:1}).then(async).catch(asyncErr);
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(data[0].name).toBe(fixtures[0].name);
        expect(data[0].date).toBe(fixtures[0].date);
        asyncReset();
        Model.find({name: 'test'}).then(async);
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(data[0].name).toBe(fixtures[1].name);
        expect(data[0].date).toBe(fixtures[1].date);
        asyncReset();
        Model.find({name: 'test', id:1}).then(async);
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(data[0].name).toBe(fixtures[2].name);
        expect(data[0].date).toBe(fixtures[2].date);
      });
    });

    it("should be able to set create results based in a condition", function(){
      runs(function(){
        Model.setCreateResults({name: 'test'}, fixtures[0]);
        Model.setCreateResults({date: new Date('2010-09-09')}, fixtures[1]);
        Model.setCreateResults({date: new Date('2010-09-09'), name: 'test'}, fixtures[2]);
        Model.create({name: 'test'}).then(async).catch(asyncErr);
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(data.name).toBe(fixtures[0].name);
        expect(data.date).toBe(fixtures[0].date);
        asyncReset();
        Model.create({date: new Date('2010-09-09')}).then(async);
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(data.name).toBe(fixtures[1].name);
        expect(data.date).toBe(fixtures[1].date);
        asyncReset();
        Model.create({date: new Date('2010-09-09'), name: 'test'}).then(async);
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(data.name).toBe(fixtures[2].name);
        expect(data.date).toBe(fixtures[2].date);
      });
    });

    it("should be able to set update results based in a condition", function(){
      runs(function(){
        fixture.id = 1;
        wolfpack.setFindResults(fixture);
        Model.setUpdateResults({name: 'test'}, fixtures[0]);
        Model.setUpdateResults({date: new Date('2010-09-09')}, fixtures[1]);
        Model.setUpdateResults({date: new Date('2012-01-01'), name: 'test2'}, fixtures[2]);
        Model.findOne(1).then(function(model){
          model.name = 'test';
          model.save(function(err, results){
            async(results);
          });
        });
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(data.name).toBe(fixtures[0].name);
        expect(data.date).toBe(fixtures[0].date);
        asyncReset();
        Model.findOne(1).then(function(model){
          model.date = new Date('2010-09-09');
          model.save(function(err, results){
            async(results);
          });
        });
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(data.name).toBe(fixtures[1].name);
        expect(data.date).toBe(fixtures[1].date);
        asyncReset();
        Model.findOne(1).then(function(model){
          model.name = 'test2';
          model.date = new Date('2012-01-01');
          model.save(function(err, results){
            async(results);
          });
        });
      });
      waitsFor(asyncReady);
      runs(function(){
        expect(data.name).toBe(fixtures[2].name);
        expect(data.date).toBe(fixtures[2].date);
      });
    });

    it("if when setting results for a condition, no condition is given, it should throw", function(){
      var failing = function() {
        Model.setFindResults(null, fixture);
      };
      var failing2 = function() {
        Model.setCreateResults(null, fixture);
      };
      var failing3 = function() {
        Model.setUpdateResults(null, fixture);
      };
      expect(failing).toThrow();
      expect(failing2).toThrow();
      expect(failing2).toThrow();
    });

    it("if when setting results for a condition, no results are given, it should throw", function(){
      var failing = function() {
        Model.setFindResults(fixture);
      };
      var failing2 = function() {
        Model.setCreateResults(fixture);
      };
      var failing3 = function() {
        Model.setUpdateResults(fixture);
      };
      expect(failing).toThrow();
      expect(failing2).toThrow();
      expect(failing2).toThrow();
    });
  });

  describe('legacy support', function(){

    describe('when called without arguments', function(){
      var Model = wolfpack(__dirname + '/../fixtures/Model');
      var ready, data, fixture, errors;

      function async(results) {
        ready = true;
        data = results;
      }

      function asyncErr(err) {
        errors = err;
        ready = true;
      }

      function asyncForDone(err, results) {
        asyncErr(err);
        async(results);
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
        wolfpack().clearResults();
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
          Model.findOne(1).then(async).catch(asyncErr);
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
          Model.create(fixture).then(async).catch(asyncErr);
        });

        waitsFor(asyncReady);

        runs(function(){
          expect(data.name).toBe(fixture.name);
          expect(data.date).toBe(fixture.date);
        });
      });

      it("should be able to set the results for an update operation to the given values", function(){
        var updateResults;
        runs(function(){
          fixture.id = 1;
          wolfpack().setFindResults(fixture);
          wolfpack().setUpdateResults({id:1, name: 'Test', date: new Date()});
          Model.findOne(1).then(function(model){
            model.name = 'Test';
            model.save(function(err, data){
              updateResults = data;
            });
          });
        });

        waitsFor(function(){
          return updateResults;
        });

        runs(function(){
          expect(updateResults.name).toBe('Test');
        });
      });

      it("if a result is provided, it should be given as an instance of the Model", function(){
        wolfpack().setFindResults(fixture);

        runs(function(){
          Model.findOne(1).then(async).catch(asyncErr);
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
        runs(function(){
          wolfpack().clearResults();
          Model.findOne(1).then(async).catch(asyncErr);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data).not.toBeDefined();
        });
      });

      it("if no results are provided for create operation, it should return the given create values", function(){
        runs(function(){
          wolfpack().clearResults();
          Model.create(fixture).then(async).catch(asyncErr);
        });

        waitsFor(asyncReady);

        runs(function(){
          expect(data.name).toBe(fixture.name);
          expect(data.date).toBe(fixture.date);
        });
      });

      it("if an error occurs in create operation, it should return the error and stack", function(){
        runs(function(){
          wolfpack().setErrors('errors');
          Model.create(fixture).then(async).catch(asyncErr);
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(errors.originalError).toBe('errors');
          expect(errors.rawStack).toBeDefined();
        });
      });

      it("if no results are provided for update operation it should return the model values", function(){
        runs(function(){
          wolfpack().clearResults();
          fixture.id = 1;
          wolfpack().setFindResults(fixture);
          Model.findOne(1).then(function(model){
            model.name = 'another';
            model.save(asyncForDone);
          });
        });

        waitsFor(asyncReady);

        runs(function(){
          expect(data.name).toBe('another');
        });
      });

      it("if an error occurs in update operation, it should return the error", function(){
        runs(function(){
          fixture.id = 1;
          wolfpack().setFindResults(fixture);
          Model.findOne(1).then(function(model){
            wolfpack().setErrors('errors');
            model.name = 'different';
            model.save(asyncForDone);
          });
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(errors.originalError).toBe('errors');
          expect(errors.rawStack).toBeDefined();
        });
      });

      it("if an error occurs during a destroy operation, it should return the error", function(){
        runs(function(){
          fixture.id = 1;
          wolfpack().setFindResults(fixture);
          Model.findOne(1).then(function(model){
            wolfpack().setErrors('errors');
            model.destroy(asyncErr);
          });
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(errors.originalError).toBe('errors');
          expect(errors.rawStack).toBeDefined();
        });
      });

      it("if no errors occur, it should return nothing as always", function(){
        runs(function(){
          fixture.id = 1;
          wolfpack().setFindResults(fixture);
          Model.findOne(1).then(function(model){
            model.destroy(async);
          });
        });
        waitsFor(asyncReady);
        runs(function(){
          expect(data).toBeNull();
        });
      });

      it("should provide a method for resetting results", function(){
        runs(function(){
          wolfpack().setFindResults(fixture);
          wolfpack().clearResults();
          Model.findOne(1).then(async);
        });

        waitsFor(asyncReady);

        runs(function(){
          expect(data).not.toBeDefined();
        });
      });

      it("should provide a way for setting errors", function(){
        runs(function(){
          wolfpack().setErrors('error');
          Model.findOne(1).then(async).catch(asyncErr);
        });

        waitsFor(asyncReady);

        runs(function(){
          expect(errors.originalError).toBe('error');
          expect(errors.rawStack).toBeDefined();
        });
      });

      it("should provide a way for resetting errors", function(){
        runs(function(){
          wolfpack().clearErrors();
          Model.findOne(1).then(async).catch(asyncErr);
        });

        waitsFor(asyncReady);

        runs(function(){
          expect(errors).toBeNull();
        });
      });

      it("should provide a way for testing if a CRUD operation was performed in the adapter", function(){
        var spy;
        runs(function(){
          wolfpack().resetSpies();
          spy = wolfpack().spy('find');
          Model.findOne(1).then(async);
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
        var spy;
        runs(function(){
          spy = wolfpack().spy('find');
          Model.findOne(1).then(async);
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
          findSpy = wolfpack().spy('find');
          createSpy = wolfpack().spy('create');
          Model.findOne(1).then(async);
        });

        waitsFor(asyncReady);

        runs(function(){
          // Reset async to execute another call
          asyncReset();
          Model.create({name: 'test'}).then(async);
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
});