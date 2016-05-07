const fs = require('fs');
const Q = require("q");
const DBG = require("../utils/utils").DBG;


var SYS_INCLUDES = []; // System headers to include in all C++ source files

/////////////////////////////////////////////////
// CPPWriter : Compile a Script to C++ sources //
/////////////////////////////////////////////////

function CPPWriter(script) {
	this.script = script;
}

CPPWriter.prototype.write = function(outdir) {
	var that = this;
	try { fs.mkdirSync(outdir); } catch(e) {}
	if(!this.script.processes || !this.script.processes.length) this.script.computeProcesses();
	return Q.all(this.script.processes.map(function(p) {
		that.writeProcess(p, outdir + "/" + p.name + ".cpp");
	}));
}

/**
 *	Compile a single Process to a C++ source file
 *	@return a Promise
*/
CPPWriter.prototype.writeProcess = function(proc, filename) {
	var defered = Q.defer();
	var that = this;
	console.log("[cpp] " + filename);
	fs.open(filename, 'w', 0664, function( e, file ) {
		var promise = Q();
		var nbTabs = 0;

		// Async writing helper
		function W(str) {
			if(!str) str = "";
			str = '\t'.repeat(nbTabs) + str + "\n";
			promise = promise.then(function(){
				var defered = Q.defer();
				fs.write( file, str, null, 'utf8', function(){ return defered.resolve();  });
				return defered.promise;
			});
		}

		// LANGUAGE DEFINITION
		function S(str) { return W(str + ";");}
		function TAB() { nbTabs++; }
		function UNTAB() { nbTabs--; }

		function FOR(a,b,c) { W("for(" + a + "; " + b + "; " + c + ") {"); TAB(); }
		function END() { UNTAB(); W("}");}
		function INCLUDE(x) { W("#include " + x); }
		function FUNCTION(ret_type, name, params) { if(typeof(params)==='string') params = [params]; W(ret_type + " " + name + '(' +  params.join(', ') +') {'); TAB(); }
		function CALL(func, params) { if(typeof(params)==='string') params = [params]; S(func + "(" + params.join(', ') + ")");}


		// PROCESSING FLOW DIRECTIVES
		function LINK_READ(l) {
			// TODO
		}
		function LINK_WRITE(l) {
			// TODO
		}

		function MODULE_CALL(m) {
			m.ins.forEach(function(l) { if(l.needsRead()) LINK_READ(l); });
			CALL(m.id + ".process", m.ins.map(function(l) { return l.srcPin ? (l.src.id + "." + l.srcPin) : l.src.id; }));
			m.outs.forEach(function(l) { if(l.needsWrite()) LINK_WRITE(l); })
		}


		// EFFECTIVELY WRITE THE CPP SOURCES
		SYS_INCLUDES.forEach(function(i) { INCLUDE("<"+i+">"); });
		INCLUDE('"pgcc-script.h"');
		proc.includes.forEach(function(i) { INCLUDE('<' + i + '>')});
		proc.modules.forEach(function(m) { INCLUDE('<' + m.class + '.h>')});
		W();

		proc.scanAllOnce(function(l){return l.isProcedural();}, function(l) {
			S(l.dst.class + " " + l.dst.id);
		});
		W();

		FUNCTION("void", "init", []);
		proc.scanAllOnce(function(l){return l.isProcedural();}, function(l) {
			for(var i in l.dst.params) S(l.dst.id + "." + i + " = " + l.dst.params[i]);
			CALL(l.dst.id + ".init", []);
		});
		END();
		W();

		FUNCTION("void", "deinit", []);
		proc.reverseScanAllOnce(function(l){return l.isProcedural();}, function(l) {
			CALL(l.src.id + ".deinit", []);
		});
		END();
		W();

		FUNCTION("void", "process", []);
		proc.scanAllOnce(function(l){return l.isProcedural();}, function(l) {
			MODULE_CALL(l.dst);
		});
		END();

	});
	return defered.promise;
}

module.exports = CPPWriter;
