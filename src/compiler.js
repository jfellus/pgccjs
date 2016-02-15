var CPPWriter = require("./io/cpp_writer");
var MakefileWriter = require("./io/makefile_writer");
var Q = require("q");
var fs = require("fs");
var cp = require("./utils/utils").cp;
var DBG = require("./utils/utils").DBG;

function Compiler() {
}

Compiler.prototype.compile = function(script, outdir) {
	var that = this;
	this.script = script;
	this.outdir = outdir;

	try { fs.mkdirSync(outdir); } catch(e){}

	return Q.all([
		new CPPWriter(this.script).write(outdir + "/src"),
		new MakefileWriter(this.script).write(outdir + "/Makefile"),
		cp("./src/resources/runner.sh", outdir + "/" + that.script.name)
		.then(function() { fs.chmodSync(outdir + "/" + that.script.name, 0775); })
	]);
}

module.exports = Compiler;
