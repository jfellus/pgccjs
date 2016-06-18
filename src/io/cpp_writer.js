const fs = require('fs');
const Q = require("q");
const DBG = require("../utils/utils").DBG;


var SYS_INCLUDES = ["pgcc-script.h"]; // System headers to include in all C++ source files

//////////////////////////////////////////////////
// CPPWriter : Compile a Process to C++ sources //
//////////////////////////////////////////////////

function CPPWriter() {
}

/**
 *	Compile a single Process to a C++ source file
 *	@return a Promise
*/
CPPWriter.prototype.writeProcess = function(proc, outdir) {
	var filename = outdir + "/" + proc.name + ".cpp";
	var defered = Q.defer();
	var that = this;
	console.log("[cpp] " + filename);

	proc.computeIncludes();

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
		function CALL(func, params) { if(!params) params = []; if(typeof(params)==='string') params = [params]; S(func + "(" + params.join(', ') + ")");}


		// PROCESSING FLOW DIRECTIVES
		function LINK_DECLARE_IN(l) 	{ if(l.needsInit && l.needsInit())   S("PgccLinkIn _link_"+l.src.id+"_"+l.dst.id); }
		function LINK_DECLARE_OUT(l) 	{ if(l.needsInit && l.needsInit())   S("PgccLinkOut _link_"+l.src.id+"_"+l.dst.id); }
		function LINK_INIT(l) 			{ if(l.needsInit && l.needsInit())   CALL("_link_"+l.src.id+"_"+l.dst.id + ".init", ['"'+l.src.id+"_"+l.dst.id+'"']); }
		function LINK_UNINIT(l) 		{ if(l.needsInit && l.needsInit())   CALL("_link_"+l.src.id+"_"+l.dst.id + ".destroy"); }
		function LINK_START_READ(l) 	{ if(l.needsRead && l.needsRead())   CALL("_link_"+l.src.id+"_"+l.dst.id + ".startRead"); }
		function LINK_END_READ(l) 		{ if(l.needsRead && l.needsRead())   CALL("_link_"+l.src.id+"_"+l.dst.id + ".endRead"); }
		function LINK_START_WRITE(l)	{ if(l.needsWrite && l.needsWrite()) CALL("_link_"+l.src.id+"_"+l.dst.id + ".startWrite"); }
		function LINK_END_WRITE(l) 		{ if(l.needsWrite && l.needsWrite()) CALL("_link_"+l.src.id+"_"+l.dst.id + ".endWrite"); }

		function DECLARE_EXTERNAL_LINKS() {
			proc.modules.forEach(function(m) {
				m.ins.forEach(function(l) { LINK_DECLARE_IN(l); } );
				m.outs.forEach(function(l) { LINK_DECLARE_OUT(l); } );
			});
		}

		function INIT_EXTERNAL_LINKS() {
			proc.modules.forEach(function(m) {
				m.ins.forEach(function(l) { LINK_INIT(l); });
				m.outs.forEach(function(l) { LINK_INIT(l); });
			});
		}

		function UNINIT_EXTERNAL_LINKS() {
			proc.modules.forEach(function(m) {
				m.ins.forEach(function(l) { LINK_UNINIT(l); });
				m.outs.forEach(function(l) { LINK_UNINIT(l); });
			});
		}

		function MODULE_CALL(m) {
			 // TODO lang == C ? -> just call function
			m.ins.forEach(function(l) { LINK_START_READ(l); });
			m.outs.forEach(function(l) { LINK_START_WRITE(l); });
			CALL(m.id + ".process", m.ins.map(function(l) { return l.srcPin ? (l.src.id + "." + l.srcPin) : l.src.id; }));
			m.ins.forEach(function(l) { LINK_END_READ(l); });
			m.outs.forEach(function(l) { LINK_END_WRITE(l); });
		}


		// EFFECTIVELY WRITE THE CPP SOURCES
		SYS_INCLUDES.forEach(function(i) { INCLUDE("<"+i+">"); });
		proc.includes.forEach(function(i) { INCLUDE('"' + i + '"')});
		W();

		proc.modules.forEach(function(m) {
			S(m.class + " " + m.id);
		});
		W();

		DECLARE_EXTERNAL_LINKS();
		W();

		FUNCTION("void", "init", []);
		proc.scanAllOnce(function(l){return l.isProcedural();}, function(l) {
			LINK_INIT(l);
			for(var i in l.dst.params) S(l.dst.id + "." + i + " = " + l.dst.params[i]);
			CALL(l.dst.id + ".init", []); // TODO lang == C ? -> no init !
		});
		INIT_EXTERNAL_LINKS();
		END();
		W();

		FUNCTION("void", "deinit", []);
		proc.reverseScanAllOnce(function(l){return l.isProcedural();}, function(l) {
			CALL(l.src.id + ".deinit", []); // TODO lang == C ? -> no init !
		});
		UNINIT_EXTERNAL_LINKS();
		END();
		W();

		FUNCTION("void", "process", []);
		proc.scanAllOnce(function(l){return l.isProcedural();}, function(l) {
			MODULE_CALL(l.dst);
		});
		END();
		W();

		FUNCTION("int", "main", ["int argc", "char** argv"]);
			FOR("int iteration = 0", "", "iteration++");
				CALL("process");
			END();
		END();

	});
	return defered.promise;
}

module.exports = CPPWriter;
