var wolfpack = require(__dirname + '/../../lib/wolfpack');

describe('Wolfpack', function(){

  describe('when called with an argument', function(){

  });

  describe('when called without arguments', function(){

    it("should provide a method for setting find results", function(){
      expect(wolfpack().findResults).toBeDefined();
    });

    it("should provide a method for resetting results", function(){
      expect(wolfpack().resetResults).toBeDefined();
    });

  });
});