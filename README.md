Wolfpack
========

[![Build Status](https://travis-ci.org/fdvj/wolfpack.svg?branch=master)](https://travis-ci.org/fdvj/wolfpack)

__Wolfpack helps you test your SailsJS models without the need for a db or lifting your sails app.__

Basically, this is a library that instantiates your Sails models so that you can use them in your tests, without worrying about setting up a db, which introduces latency to your tests. By defaults it spies all Model functions with sinonJS, so you can test if the correct parameters are being sent to the model. It works like this:

```javascript
var wolfpack = require('wolfpack');
var sinon = require('sinon');

// We put in the global scope our instantiated model to be used by the controller
global.Chatroom = wolfpack('path_to_models/Chatroom'); 

// We load our controller for unit tests
var ChatController = require('path_to_controllers'/ChatroomController);

// We build some fake data for our tests
var request = {
  params: {
    username: 'testuser',
    chatroom: 'awesomeness'
  }
};

var response = {
  send: sinon.stub() // And we can spy on what we expect to receive
};

describe('ChatController', function(){
  
  describe('#addUser', function(){

    it("should add a user to a given chatroom", function(){
      ChatController.addUser(request, response);      
      
      // Our model Chatroom takes care of adding a user to a chatroom,
      // so we must verify if the controller called it       
      expect(Chatroom.addUser.lastCall.args[0]).toBe(request.params.username);
      expect(Chatroom.addUser.lastCall.args[1]).toBe(request.params.chatroom);
    
    });

    // And we can do our asynchronous test easily

    it("should return a HTTP 200 response if the user was added successfully", function(){
      // Run first part of test asynchronously (jasmine function)
      runs(function(){
        ChatController.addUser(request, response);
      });

      // When the callback executes, it should call res.send, so we should wait for it
      waitsFor(function(){
        return response.send.called;
      });

      // Now we can test if the proper code was sent
      runs(function(){
        expect(response.send.lastCall.calledWith(200)).toBeTruthy();
      });
    });

  });

});
```

The above example might look a little bit intimidating, especially if you are new to asynchronous testing. So in the
next sections we are going to see how each component works separately.

## Table of Contents
1. [Installation](#installation)
2. [Usage](#usage)
3. [API](#api)
  1. [wolpack](#wolpackpath_to_model)
  2. [wolfpack().setFindResults](#swolfpacksetfindresultsobject--array-of-objects)
  3. [wolfpack().setCreateResults](#wolfpacksetcreateresultsobject--array-of-objects)
  4. [wolfpack().setUpdateResults](#wolfpacksetupdateresultsobject--array-of-objects)
  5. [wolfpack().clearResults](#wolfpackclearresults)
  6. [wolfpack().setErrors](#wolfpackseterrorserrors)
  7. [wolfpack().clearErrors](#wolfpackclearerrors)
  8. [wolfpack().spy](#wolfpackspyfind--create-update--destroy)
  9. [wolfpack().resetSpy](#wolfpackresetspyfind--create--update--destroy)
  10. [wolfpack().resetSpies](#wolfpackresetspies)
4. [Examples](#examples)
  1. [Mocking Model Results](#mocking-model-results)
  2. [Mocking Errors](#mocking-errors)
  3. [Testing Sails Controllers](#testing-sails-controllers)
  4. [Asynchronous Testing](#asynchronous-testing)
  5. [Testing Sails Models](#testing-sails-models)

## Installation

To install wolfpack, simply do an `npm install wolfpack`. To use it in your applications, just require it in node as you usually do.

```javascript
var wolfpack = require('wolfpack');
```

## Usage

As stated in the pitch, Wolfpack lets you instantiate your Sails model so that you can test your model without having to connect to a database.

If you have Backbone testing backgrounds, this will be familiar to you. When testing a backbone model or collection, you instantiate it and provide mock data to test the methods. Rarely do you need your model or collection to communicate with the server to provide the results.  That's because you want to test your model or collection, not how or if backbone is doing what it is supposed to do.

Instantiating a Sails model is simple. You just call the wolfpack() function and provide either the path to where the model is, or the model itself.  In return it will provide you a Sails model.

```javascript
var wolfpack = require('wolfpack');

var MyPathModel = wolfpack('path_to_app/api/models/MyModel');

var MyObjModel = wolfpack({
  attributes:{
    name: 'string',
    date: 'date'
  }
});
  
```

This will in return give you an Instantiated model you can use to test the model itself, or controller behvaiour, with all the model methods originally provided by Sails, such as `findOne`, `create`, `find`, and dynamic finders.  You can read more of the methods provided by Sails in their [Models documentation](http://sailsjs.org/#!documentation/models).

The best part of this is that wolfpack, by default, spies on ALL methods, whether they were provided by Sails, you or your instance. The spies are provided by SinonJS, which therefore lets you know if a given method is called or not, with what it was called, etc. To know what properties and methods are available for your spies, please read the [SinonJS spies documentation](http://sinonjs.org/docs/#spies-api).

## API

### wolfpack('path_to_model')

The wolfpack constructor allows you to instantiate a spied upon Sails model. You use by calling `wolfpack('path_to_model' || object)` and pass it either a string with the location of the model, or an object from which to build the model. All class and instance methods are spied on with [SinonJS spies](http://sinonjs.org/docs/#spies-api). Once instantiated, you can make your usual model calls.

```javascript
var wolfpack = require('wolfpack');

var MyModel = wolfpack('path_to_app/api/models/MyModel');

MyModel.find({name: 'test'}).done(function(err, results){
  // ... more code ...
});
```

For testing ccontrollers, you instantiate your model globally as Sails does on the background, like this:

```javascript
var wolfpack = require('wolfpack');

global.MyModel = wolfpack('path_to_app/api/models/MyModel');

// You can now load your controller and it will have access to your wolfpack instantiated model
var MyController = require('path_to_app/api/controllers/MyController');
```

For more information and examples on how to test, please go forward and read the examples sections, were we present several samples on how to use wolpack to test controllers, model classes, and instances of models.

### wolfpack().setFindResults(object || array of objects)

The `wolfpack().setFindResults` allows you to mock/fake data coming from the database. In other words, you can fake data coming from the database, and Sails will treat it as real data and build and instance from it (or not).

To fake the data, use `wolfpack().setFindResults(results)` where `results` is an object or an array of objects with the response "coming" from the database. Please notice that __no arguments__ are passed to the `wolfpack` function.

```javascript
var wolfpack = require('wolfpack');

var MyModel = wolfpack('path_to_app/api/models/MyModel');

// Lets fake data from the db
wolfpack().setFindResults({name: 'John'});

MyModel.find({id:1}).done(function(err, results){
  // results will be {name: 'John'}
});

```

Please note, if you set any results with the `wolfpack().setFindResults` method, __all future find calls to any model__ will return those results. If you call it to set other results, then those results will always be returned, and so on. To stop sending those fake results, use the `wolfpack().clearResults` method.

### wolfpack().setCreateResults(object || array of objects)

Just as the `wolfpack().setFindResults`, the `wolfpack().createResults` method will allow you to set the fake db response for any create operation. As the argument, you pass an object or array of objects for the response you want.

```javascript
var wolfpack = require('wolfpack');

var MyModel = wolfpack('path_to_app/api/models/MyModel');

// Lets fake data from the db
wolfpack().setCreateResults({name: 'John'});

MyModel.create({name: 'Doe'}).done(function(err, results){
  // Results will be {name: 'John', updatedAt: someDate, createdAt: someDate}
  // Notice that even though we sent 'Doe' as name, the setCreateResults returned 'John' as we requested
});
```

Again, as with `setFindResults`, all future create events will have this response, until changed with another `setCreateResults` or until the `clearResults` method is called.

### wolfpack().setUpdateResults(object || array of objects)

The `wolfpack().setUpdateResults` allows you to set the fake db results for all update operations. You pass an object or array of objects for the results you want to fake.

It is __important__ that, when faking update actions,  the instantiated model has an id set. Otherwise, the update action will throw an error.

```javascript
var wolfpack = require('wolfpack');

var MyModel = wolfpack('path_to_app/api/models/MyModel');

// First we need a model to update, so lets fake it
wolfpack().setFindResults({id: 1, name: 'John'});
wolfpack().setUpdateResults({id: 1, name: 'Johnson'});

// Now we need an instantiated model to perform the update, so lets "find" one
MyModel.findOne(1).done(function(err, model){
  model.name = 'Doe'; // Our fake will not return this because the setUpdateResults says something different
  // Now we can update
  model.save(function(err, results){
    // results will be {id: 1, name: 'Johnson', updatedAt: someDate, createdAt: someDate}
  });
});

```

Same as the other _faker_ methods, all future update results will have this result, unless they are changed or the `clearResults` method is called.

### wolfpack().clearResults()

The `wolfpack().clearResults` method clears any fake db responses that have been previously set by any or all of the `setFindResults`, `setCreateResults`, and/or `setUpdateResults` methods.

```javascript
var wolfpack = require('wolfpack');

var MyModel = wolfpack('path_to_app/api/models/MyModel');

// Lets fake some responses
wolfpack().setFindResults({id: 1, name: 'John'});
wolfpack().setCreateResults({name: 'myself'});

// Now let's clear those responses
wolfpack().clearResults();

MyModel.find({id: 1}).done(function(err, results){
  // results will be []
});

MyModel.create({name: 'Awesome developer'}).done(function(err, results){
  // results will be {name: 'Awesome developer', updatedAt: someDate, createdAt: someDate}
});
```

### wolfpack().setErrors(errors)

The `wolfpack().setErrors` method allows you to fake an error or group of errors coming from the database. This way, you can test your failure scenarios.

To use it, pass as an argument that will be the fake error coming from the database.

```javascript
var wolfpack = require('wolfpack');

var MyModel = wolfpack('path_to_app/api/models/MyModel');

// Lets fake a db error now
wolfpack().setErrors('DB_CONNECTION_ERROR');
MyModel.findOne(1).done(function(err, results){
  // Now we are getting the err arguments, so we can handle it
  if (err) {
    // lets do our error handling
  }
});
```

When you set an error, just as the fake result methods, it will be set for all db calls. Most importantly, it will take precedence, which means that it doesn't matter that you use set a fake result with `setFindResults` or any other method like that, the error will always trigger first.

To stop/clear the errors, use the `clearErrors` method.

### wolfpack().clearErrors()

When you no longer want the to fake errors, you can call the `clearErrors` method which will stop sending errors to your model calls.

```javascript
var wolfpack = require('wolfpack');

var MyModel = wolfpack('path_to_app/api/models/MyModel');

// Lets fake a db error now
wolfpack().setErrors('DB_CONNECTION_ERROR');

// Now lets reset it
wolfpack().clearErrors();

MyModel.findOne(1).done(function(err, results){
  // Now we should get results again
});
```

### wolfpack().spy('find | create |update | destroy')

There might be situations in which we need to know if a certain CRUD operation is being performed.  For example, when calling the save method of a model, we want to be sure that the proper parameters are being called on save.  In those scenarios, it is useful to test what update operation is happening in the adapter.

Wolfpack provides the `spy` method which in allows spying all four CRUD operations in the adapter.  As the argument, you send which operation you want to check.  The available operations are `find`, `create`, `update`, and `destroy`.

```javascript
var wolfpack = require('wolfpack');

var MyModel = wolfpack('path_to_app/api/models/MyModel');

// Lets spy on the create
var spy = wolfpack().spy('create');

wolfpack().create({name: 'test'}).done(function(err, results){
  // Lets see if the parameters were sent correctly
  return spy.calledWith({name: 'test'}); // returns true
});
```

### wolfpack().resetSpy('find | create | update | destroy')

Since in wolfpack all operations are spied upon, including CRUDs, there might be some cases in which you need your CRUD spy to be set to its beginning value for easier testing. For those cases you can use the `resetSpy` method.

```javascript
var wolfpack = require('wolfpack');

var MyModel = wolfpack('path_to_app/api/models/MyModel');

// Lets spy on the create
var spy = wolfpack().spy('create');

wolfpack().create({name: 'test'}).done(function(err, results){
  spy.called; // returns true
  wolfpack().resetSpy('create');
  spy.called; // returns false
});
```

### wolfpack().resetSpies()

The `resetSpies` methods resets all CRUD spies at once, so you don't have to call them one by one.

```javascript
var wolfpack = require('wolfpack');

var MyModel = wolfpack('path_to_app/api/models/MyModel');

// Lets spy on the create
var spy = wolfpack().spy('create');

wolfpack().create({name: 'test'}).done(function(err, results){
  spy.called; // returns true
  wolfpack().resetSpies();
  spy.called; // returns false
});
```

## Examples

### Mocking Model Results

Wolfpack provides an adapter which mocks a database.  This allow us to predetermine the data we are expecting back from the database, without the need of one.  In other words, we can tell wolfack to give the model certain results when it performs an operation. We do it by using _result operators_, as shown below.

To set the results for a find operation, we use `wolfpack().setFindResults({results: 'we want'})`.  Please note that no arguments are provided to the wolfpack function.

```javascript
var wolfpack = require('wolfpack');

var Model = wolfpack('path_to_model');

// Set results for a find operation
wolfpack().setFindResults({id:1, name:'John Doe'});

Model.find({id: 1}).done(function(err, result){
  return result; // {id: 1, name: 'John Doe'}
});
  
```

You can do the same for create and update operations as well via the `setCreateResults` and `setUpdateResults`. Mocking update results is a little bit trickier as updates only happen on models from results, so we need to mock up first a find result.

```javascript
var wolfpack = require('wolfpack');

var Model = wolfpack('path_to_model');

// Set results for a create operation
wolfpack().setCreateResults({id:1, name:'John Doe'});

Model.create({name: 'A completely different name'}).done(function(err, result){
  return result; // {id: 1, name: 'John Doe'}
});

// To set the results for an update, we first need to mockup a find operation
wolfpack().setFindResults({id: 2, name: 'Myself'});

// Now we can set the results for the update
wolfpack().setUpdateResults({id: 2, name: 'Grumpy cat'});
Model.findOne(2).done(function(err, model){
  // Model will be {id: 2, name: 'Myself'}
  model.name = 'Not me';
  model.save(function(err, results){
    return results; // {id: 2, name: 'Grumpy cat'}
  });
});
```

Notice that even though we set one thing in the create and update values, the mocks give us something different. If we specify results, no matter what is given to the CRUD operation, the results will be the mocks we provide.

Now, what if I didn't mock up any operation? Well, results will be default, as shown below:

```javascript
var wolfpack = require('wolfpack');

var Model = wolfpack('path_to_model');

Model.find().done(function(err, results){
  return results; // returns []
});

Model.findOne(1).done(function(err, results){
  return results; // returns undefined
});

Model.create({name:'John'}).done(function(err, results){
  return results; // returns {name: 'John', updatedAt: date(), createdAt: date()}
});

// For updates we need a result first, so we need to mock
wolfpack().setFindResults({id: 1, name: 'Test'});
Model.findOne(1).done(function(err, model){
  model.name = 'Another name';
  model.save(function(err, results){
    return results; // returns {id: 1, name: 'Another name', createdAt: new Date, updatedAt: new Date}
  });
});
```

Finally, there might be situations in which we no longer want to mock results, after we've mocked some.  This because once we set a mock, wolfpack will always return that mock for that operation, no matter where in our tests we are.  In some cases we need to clear those results. Wolfpack therefore provides a method to clear the mocks: `clearResults`.

```javascript
var wolfpack = require('wolfpack');

var Model = wolfpack('path_to_model');

// Lets set a mock result first
wolfpack().setFindResults({id: 1, name: 'Test'});
Model.findOne(1).done(function(err, result){
  return result; // returns {id: 1, name: 'Test'}
});

// Great! Now I dont want to use any more mock results
wolfpack().clearResults();
Model.findOne(1).done(function(err, results){
    return results; // returns undefined
});
```

### Mocking Errors

I have a confession to make.  I'm obsessed with getting 100% coverage on my code. To achieve 100% coverage, I need to test every scenario, including error scenarios, which are sometimes quite hard to produce.

To facilitate errors coming from the db or adapters, wolfpack provides a `setErrors` method, which will basically return an error for every CRUD operation performed on a model. Lets take a look:

```javascript
var wolfpack = require('wolfpack');

var Model = wolfpack('path_to_model');

// I need to test errors, so Im gonna set one
wolfpack().setErrors('MySQL is having an identity crisis right now');

try {
  Model.findOne(1).done(function(err, results){
    if (err) { // This is true
      throw new Error(err + ': Its calling itself Maria'); // It will throw
    }
    return results;
  });  
} catch (e) {
  console.log(e); // It will ouput the error
}


try {
  Model.create({name: 'test'}).done(function(err, results){
    if (err) { // still true
      throw new Error('Still in crisis'); // Will throw as
    }
    return results;
  });  
} catch (e) {
  console.log(e);  // Still outputing the error
}
```
We don't always want to test the error. By setting the errors, all CRUD operations will return with an error.  If we want to clear the errors, wolfack provides us a function to do so called `clearErrors`.

```javascript
var wolfpack = require('wolfpack');

var Model = wolfpack('path_to_model');

// I need to test errors, so Im gonna set one
wolfpack().setErrors('MySQL is having an identity crisis right now');

try {
  Model.findOne(1).done(function(err, results){
    if (err) { // This is true
      throw new Error(err + ': Its calling itself Maria'); // It will throw
    }
    return results;
  });  
} catch (e) {
  console.log(e); // It will ouput the error
}

wolfpack().clearErrors();

try {
  Model.create({name: 'test'}).done(function(err, results){
    if (err) { // not true anymore
      throw new Error('Still in crisis');
    }
    return 'Ok, it just composed itself!'; // It will return
  });  
} catch (e) {
  console.log(e);  // Will not output
}
```

### Testing Sails Controllers

The whole point of wolfpack is to make testing Sails models and apps easier. Great! So how do we do it? Let's start by testing a simple Sails controllers.  Let's say we have a controller that should add or kick users from a chatroom when a given url is hit.  Let's not worry about routes right now and just focus on the controller.

```javascript
// Chat Controller

module.exports = {
  
  addUser: function(req, res) {
    // Chatroom is our Sails model
    Chatroom.addUser(req.params.username, req.params.chatroom, function(err, results){
      if (err) {
        return res.send(403); // There could be a lot of errors, but lets just say is this one only
      }
      return res.send(200);
    });
  },

  kickUser: function(req, res) {
    // ... some other code here ...
  }
}
```

So as you can see we have some route in our sails app allowing us to add a user to a chatroom. Question is, how can we test if the controller is adding the user to the chatroom? If we lift the sails app and call it, all we get is a 500 response or a 200 response. We have to hope that the controller is doing the appropriate stuff to return the 200 hundred. We can also check the database and see if after the call our user was added, but thats adding complexity to our test.  Let's see how we would test it with wolfpack.

First of all, lets notice something in the controller. SailsJS adds all the models it loads to the global object, so the `Chatroom` model is already instantiated when the controller access it. Therefore, we need to make it global as well when we instantiate within our tests:

```javascript
var wolfpack = require('wolfpack');
var sinon = require('sinon'); // We'll need this soon

// Lets instantiate the model globally
global.Chatroom = wolpack('path_to_models/Chatroom'); // now we can access it anywhere as Chatroom

var ChatController = require('path_to_controllers'/ChatController);
```

Great! Now we have the Chatroom model instantiated globally and accessible by the controllers. Now we can do our testing. To make things simpler, we've added a couple of fixtures and spies to our test so we can focus on our expectations.

```javascript
var wolfpack = require('wolfpack');
var sinon = require('sinon');

// Lets instantiate the model globally
global.Chatroom = wolpack('path_to_models/Chatroom'); // now we can access it anywhere as Chatroom

var ChatController = require('path_to_controllers/ChatController');

var request = {
  params: {
    username: 'testuser',
    chatroom: 'awesomeness'
  }
};

var response = {
  send: sinon.stub() // lets stub the function to check results only
};

describe('ChatController', function(){
  
  describe('#addUser', function(){

    it("should add a user to a given chatroom", function(){
      
      // This is basically how sails will call the controller when the route is met
      ChatController.addUser(request, response);
      
      // Wolfpack already spied on the model methods, so we can start checking them
      
      // Lets make sure it was called with the correct arguments
      expect(Chatroom.addUser.lastCall.args[0]).toBe(request.params.username);
      expect(Chatroom.addUser.lastCall.args[1]).toBe(request.params.chatroom);
    
    });
    

    it("should return a HTTP 200 response if the user was added successfully", function(){
      // ... some asynchronous testing ..
    });
    it("should return a HTTP 403 response if the user cannot be added", function(){
      // ... more asynchronous testing ..
    });
  });

});
```

The above test will pass because arguments are provided in the correct order to the model. Now, let's notice something here. If you look closely to the tests, I'm only testing exactly what the controller should be doing, and not the model itself.  My ChatController#addUser should use the Chatroom model to add the user. The controller does this by calling the Chatroom#addUser method. Right now my only concern is that the controller calls the model's method thats supposed to add the user. I don't care if the model adds it or not; I'm not testing if the model is working. I'm testing that the controllers does what it is supposed to do, and focus only on controller testing. Whethere the model is working or not, that's another test done separately.

The beauty of wolfpack for controller testing is that it instantiates an actual sails Model for us, so we can test custom methods and sails methods happening in the controller.  It also spies on every method so we can keep track of what's going on in the application.  That means we can have a controller that uses a `findOne` model method, and we would only care that it is using the method correctly, for example:

```javascript
var wolfpack = require('wolfpack');
var sinon = require('sinon');

// Lets supposed we already filled these
var req = {};
var res = {};

// Lets instantiate the model globally
global.Model = wolfpack('path_to_models/Model');

var SampleController = require('path_to_controllers/SampleController');

describe('SampleController', function(){

  describe("#returnUser", function(){

    it("look for a given user and return it", function(){
      SampleController.returnUser(req, res);

      expect(Model.findOne.calledWith(req.params.username)).toBeTruthy();

    });

  });
});
```

As you can see, we can make sure that the controller is performing the correct action in the Model, which is the one that handles the data.

### Asynchronous testing

One thing we shouldn't forget is that Sails model operations are asynchronous, therefore if we want our test to behave correctly, we should treat them as asynchronous operations.

In the controller test of the previous section, we have to events that we need to test that occur asynchronously, the 200 OK response, and the 403 Forbidden response. They both happen after we've search through our fake db for results, and called the callback function.

Asynchronous operations are dealed differently on test regarding the tools you use. For these examples, I'm using jasmine's async functions and sinonJS as well.

```javascript
// Here comes our test again
var wolfpack = require('wolfpack');
var sinon = require('sinon');

global.Chatroom = wolpack('path_to_models/Chatroom');

var ChatController = require('path_to_controllers/ChatController');

var request = {
  params: {
    username: 'testuser',
    chatroom: 'awesomeness'
  }
};

var response = {
  send: sinon.stub()
};

describe('ChatController', function(){
  
  describe('#addUser', function(){
    
    beforeEach(function(){      
      // We should reset the spy in Chatroom#addUser so that is clear for each test
      Chatroom.addUser.reset();
      
      // Also the send spy as we are gonna be testing different situations
      response.send();

      // In one test we'll mock errors, so lets reset error states
      wolfpack().clearErrors();
    });

    it("should add a user to a given chatroom", function(){
      ChatController.addUser(request, response);
      expect(Chatroom.addUser.lastCall.args[0]).toBe(request.params.username);
      expect(Chatroom.addUser.lastCall.args[1]).toBe(request.params.chatroom);
    });
    
    // Lets start testing asynchronously

    it("should return a HTTP 200 response if the user was added successfully", function(){
      // Run first part of test asynchronously (jasmine function)
      runs(function(){
        // Lets mock some results
        wolfpack().setFindResults({id: 1, room_name: 'awesome', users:[1,2,3]});
        // Now test
        ChatController.addUser(request, response);
      });

      // When the callback executes, it should call res.send, so we should wait for it
      waitsFor(function(){
        return response.send.called;
      });

      // Now we can test if the proper code was sent
      runs(function(){
        expect(response.send.calledWith(200)).toBeTruthy();
      });
    });
    
    // Testing for 403 should be the same as above, but we will mock an error this time
    it("should return a HTTP 403 response if the user cannot be added", function(){
      // First, lets mock the error
      wolfpack().setErrors('You broke the internet');
      
      // Lets run our action.
      runs(function(){
        ChatController.addUser(request, response);
      });

      // When the callback executes, it should call res.send, so we should wait for it
      waitsFor(function(){
        return response.send.called;
      });

      // Now we can test if the proper 403 code was sent
      runs(function(){
        expect(response.send.calledWith(403)).toBeTruthy();
      });
    });
  });
});
```

### Testing Sails Models

Great! We've seen how wolfpack can help us test thoroughly a controller by providing us an instantiated model all spied upon. The controller is correctly calling the Model to add the user to the chatroom. Now we must make sure the model is adding the user to the chatroom.

Let's define our sails model first.

```javascript

module.exports = {
  // My model attributes
  attributes: {
    room_name: 'string',
    id: 'integer',
    users: 'array',

    // Custom instance methods
    addUser: function(username, callback) {
      this.users.push(username);
      this.save(callback);
    }
  },

  // My Custom class methods
  addUser: function(username, chatroom, callback) {
    this.findOne({room_name: chatroom}).done(function(err, room){
      if (err) {
        return callback(err.message || err);
      }

      if (room === undefined) {
        return callback('Room not found');
      }

      // If more than 5 users in chatroom, deny
      if (room.users.length >= 5) {
        return callback('Room full');
      }

      // Add user to chatroom
      room.addUser(username, callback);
    });
  }
};
```

Above is our model definition that will be instantiated by wolfpack. Seems a little messy, especially because of all methods called addUser, but it serves its point.  Let's move on to testing.

There's a couple of stuff we need to test in our model. We need to test the class method is doing what it is supposed to, and we need to test the instance method is doing what it is supposed to.  Lets write first the test for the class.

```javascript
var wolfpack = require('wolfpack');
var sinon = require('sinon');

describe("Chatroom Class", function(){
  
  var Chatroom = wolfpack('path_to_models/Chatroom');
  
  describe("#addUser", function(){
    
    // Lets stub a callback function to see whats happening in the results
    var callback = sinon.stub();;

    beforeEach(function(){
      // Lets clear all mock results and errors
      wolfpack().clearResults();
      wolfpack().clearErrors();

      // And reset our callback spy
      callback.reset();
    });

    it("needs to find the right room where to add the user", function(){
      // This is an async operation, so treat it accordingly
      runs(function(){
        Chatroom.addUser('myself', 'awesome', callback);
      });
      
      waitsFor(function(){
        return callback.called;
      });

      runs(function(){
        // Lets make sure it looked for the correct room
        expect(Chatroom.findOne.firstCall.args[0].room_name).toBe('awesome')
      });
      
    });

    it("if it does not find the room, it should return an error to the callback", function(){
      // No need to mock as no results set means it will be empty by default
      
      // Run async
      runs(function(){
        Chatroom.addUser('myself', 'awesome', callback);
      });

      // Wait for the callback to be called
      waitsFor(function(){
        return callback.called;
      });

      // Now test
      runs(function(){
        // We should be getting an error as the first argument in the callback
        expect(callback.lastCall.args[0]).toBe('Room not found');
      });
    });

    it("if there are 5 or more users in the room, it should return an error", function(){
      // We should mock the results so that there are five users in the room
      wolfpack().setFindResults({room_name: 'awesome', id: 1, users: [1,2,3,4,5]});

      runs(function(){
        Chatroom.addUser('myself', 'awesome', callback);
      });

      waitsFor(function(){
        return callback.called;
      });

      // Check to see if the error was sent to the callback
      runs(function(){
        expect(callback.lastCall.args[0]).toBe('Room full');
      });
    });


    // This is a more complex test as we need to make sure we are calling the instance's
    // addUser method

    it("if there are less than 5, it should add the user to the chatroom", function(){    

      var fn, spy, ready; // This are a containers which we will soon use

      // Lets mock so we have at least 4 users
      wolfpack().setFindResults({room_name: 'awesome', id: 1, users: [1,2,3,4]});

      runs(function(){
        Chatroom.addUser('myself', 'awesome', callback);
      });

      waitsFor(function(){
        return callback.called;
      });

      runs(function(){
        // Lets get the callback function that findOne executes so we can test it
        fn = Chatroom.findOne.lastCall.args[1];

        // Lets get an instantiate method asynchronously
        Chatroom.findOne(1).done(function(err, results){
          ready = true;
          spy = results;
        });
      });

      // Lets wait for the findOne to give us back our instantiated model
      waitsFor(function(){
        return ready === true;
      });

      // Now lest make sure the callback function is calling the addUser instance method
      runs(function(){
        fn(null, spy);
        expect(spy.addUser.called).toBeTruthy();
      });
    });
  });

});

```

Really long test that one, especially the last part.  However, are you may soon be noticing, we are achieving 100% test coverage, which was something really hard to do before.

We still need to test the instance method.  All instances get the save method. We could try and test the save method, but since no parameters are passed to it, we cannot be actually sure if it is creating or updating a record.

Wolfpack provides the `spy` method which allows us to view CRUD operations happening in the adapter. That way we can test if the correct operation is being performed, and if the correct data is being passed to it. This is one way to do it:

```javascript
var wolfpack = require('wolfpack');
var sinon = require('sinon');

describe("Chatroom Class", function(){
// .. all the chatroom class tests ..
});

describe("Chatroom instance", function(){

  var Chatroom = wolfpack('path_to_models/Chatroom');

  // Setup async testing pattern
  // (this is a pattern I use to make async testing easier)
  var ready, model;

  function async(err, results) {
    ready = true;
    model = results;
  }

  function asyncDone() {
    return ready === true;
  }

  function resetAsync() {
    ready = false;
    model = null;
  }

  describe('#addUser', function(){

    it("should add the user to the room's user list and save", function(){
      var callback = sinon.stub();
      
      // Lets get a mockup model so we can test
      wolfpack.setFindResults({id:1, room_name: 'awesome', users: [1,2,3,4]});

      runs(function(){
        Chatroom.findOne(1).done(async);
      });

      waitsFor(asyncReady);

      // Now we have our model instantiated
      runs(function(){
        model.addUser('test', callback);
      });

      // Lets wait for the callback to be executed
      waitsFor(function(){
        return callback.called;
      });

      // Now lets see if our chatroom was updated
      runs(function(){
        var update = wolfpack().spy('update');
        expect(update.lastCall.args[2].users).toEqual([1,2,3,4,'test']);
      });
    });
  });
});
```
