var CPPWriter = require("./io/cpp_writer");
var JavascriptWriter = require("./io/javascript_writer");
var MakefileWriter = require("./io/makefile_writer");
var Q = require("q");
var fs = require("fs");
var childProcess = require("child_process");
var cp = require("./utils/utils").cp;
var DBG = require("./utils/utils").DBG;


//////////////
// COMPILER //
//////////////

function Compiler() {}

Compiler.prototype.compile = function(script, outdir) {
	var that = this;
	this.script = script;
	this.outdir = outdir;

	if(!this.script.processes || !this.script.processes.length) this.script.computeProcesses();

	// this.script.dumpProcesses();

	try {
		childProcess.execSync("rm -rf " + outdir);
		childProcess.execSync("mkdir -p " + outdir + "/src");
	} catch(e){}

	return Q.all([
		Q.all(
			that.script.processes.map(function(p) {
				return that.createProcessWriter(p).writeProcess(p, outdir + "/src");
			})
		),
		new MakefileWriter(this.script).write(outdir + "/Makefile"),
		cp("./src/resources/runner.sh", outdir + "/" + that.script.name)
		.then(function() { fs.chmodSync(outdir + "/" + that.script.name, 0775); })
	]).catch(function(e) { console.error("[Error] " + e); });
}


Compiler.prototype.createProcessWriter = function(p) {
	p.inferLanguage();
	if(p.language === 'C' || p.language === 'C++') return new CPPWriter();
	else if(p.language === 'JavaScript') return new JavascriptWriter();
	else {
		console.error('[Error ] Unhandled process language : ' + p.language);
		process.exit(-1);
	}
}


module.exports = Compiler;
