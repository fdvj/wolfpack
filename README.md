Wolfpack
========

Wolfpack helps you test your SailsJS models without the need for a db. 

Basically, this is a library that instantiates your Sails models so that you can use them in your tests, without worrying about setting up a db, which introduces latency to your tests. By defaults it spies all Model functions with sinonJS, so you can test if the correct parameters are being sent to the model. It works like this:

```javascript
var wolfpack = require('wolfpack');

var MyModel = wolfpack('path_to_app/api/models/MyModel');

// Sample test with jasmine
describe('MyModel', function(){
  
  describe("#myCustomMethod", function(){

    it("should set the name to ME when called and save it", function(){

    });

  });
});
```

Work in Progress
