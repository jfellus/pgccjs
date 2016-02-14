const utils = require("./utils/utils");
var Script = require("./model/script");
var CPPWriter = require("./io/cpp_writer");
const DBG = utils.DBG;


var s = new Script("./test.script");
s.on('loaded', function(nbErrors) {
  console.log("Script " + s.name + " loaded with " + nbErrors + " errors");
  try { s.computeProcesses(); } catch(e) {console.error(e.stack);}

  s.write('./out.script').then(function() {
    console.log('Script ' + s.name + ' written to out.script');
    new CPPWriter(s).write("out");
  });
});
