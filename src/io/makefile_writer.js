const fs = require('fs');
const Q = require("q");
const DBG = require("../utils/utils").DBG;

/////////////////////////////////////////////////////////////////////////////////
// MakefileWriter : Generate a Makefile to build binary from a compiled script //
/////////////////////////////////////////////////////////////////////////////////

// Note : Uses the template ../resources/Makefile.template.mk 

function MakefileWriter(script) {
	this.script = script;
}

MakefileWriter.prototype.write = function(filename) {
	var defered = Q.defer();
	var that = this;
	fs.open(filename, 'w', 0664, function( e, file ) {
	  var promise = Q();

	  // Async writing helper
	  function W(str) {
		if(!str) str = "";
		str = str + "\n";
		promise = promise.then(function(){
		  var defered = Q.defer();
		  fs.write( file, str, null, 'utf8', function(){ return defered.resolve();  });
		  return defered.promise;
		});
	  }

	  // LANGUAGE SPECIFICATION
	  function RULE(rule, deps) {
		  if(typeof(deps)==='string') deps = [deps];
		  return W(rule + ": " + deps.join(" "));
	  }

	  function CMD(cmd) {
		  return W("\t" + cmd);
	  }

	  var processes = that.script.processes.map(function(p) { return p.name; });
	  W("PROCESSES = " + processes.join(" "));

	  fs.readFile("./src/resources/Makefile.template.mk", function(err, data) {  W(data.toString());  });
  });
  return defered.promise;
}

module.exports = MakefileWriter;
