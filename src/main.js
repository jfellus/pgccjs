const utils = require("./utils");
var Script = require("./script");
const DBG = utils.DBG;


var s = new Script("./test.script");
s.on('loaded', function(nbErrors) {
  DBG(s);
  console.log("Loaded with " + nbErrors + " errors");

  s.write('./out.script').then(function() {
    DBG('Written to out.script');
  })
});
