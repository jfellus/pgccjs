const fs = require('fs');
const Q = require("q");
const DBG = require("../utils/utils").DBG;
const IndexLookup = require("../indexer/lookup");


/////////////////////////////////////////////////////////////////////////
// JavascriptWriter : Compile a Process to Javascript (nodejs) sources //
/////////////////////////////////////////////////////////////////////////

function JavascriptWriter() {
}

/**
 *	Compile a single Process to a Javascript (nodejs) source file
 *	@return a Promise
*/
JavascriptWriter.prototype.writeProcess = function(proc, outdir) {
	var filename = outdir + "/" + proc.name + ".js";
	var defered = Q.defer();
	var that = this;
	console.log("[js] " + filename);

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
		function INCLUDE(x) {
			x = x.before(".js");
			var moduleName = "module_"+x.afterLast("/");
			W("const " + moduleName + " = require('" + x + "');");
		}
		function FUNCTION(name, params) { if(!params) params = []; if(typeof(params)==='string') params = [params]; W("function " + name + '(' +  params.join(', ') +') {'); TAB(); }
		function CALL(func, params) { if(!params) params = []; if(typeof(params)==='string') params = [params]; S(func + "(" + params.join(', ') + ")");}


		// PROCESSING FLOW DIRECTIVES
		function LINK_DECLARE_IN(l) 	{ if(l.needsInit && l.needsInit())   S("var _link_"+l.src.id+"_"+l.dst.id + " = new PGCC.LinkIn()"); }
		function LINK_DECLARE_OUT(l) 	{ if(l.needsInit && l.needsInit())   S("var _link_"+l.src.id+"_"+l.dst.id + " = new PGCC.LinkOut()"); }
		function LINK_INIT(l) 			{ if(l.needsInit && l.needsInit())   CALL("_link_"+l.src.id+"_"+l.dst.id + ".init"); }
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
			m.ins.forEach(function(l) { LINK_START_READ(l); });
			m.outs.forEach(function(l) { LINK_START_WRITE(l); });
			CALL(m.id + ".process", m.ins.map(function(l) { return l.srcPin ? (l.src.id + "." + l.srcPin) : l.src.id; }));
			m.ins.forEach(function(l) { LINK_END_READ(l); });
			m.outs.forEach(function(l) { LINK_END_WRITE(l); });
		}


		// EFFECTIVELY WRITE THE CPP SOURCES
		S("const PGCC = require('pgcc')");
		proc.includes.forEach(function(i) { INCLUDE(i); });
		W();

		proc.modules.forEach(function(m) {
			var req = "module_"+IndexLookup.lookupModule(m.class).file.before(".js").afterLast('/');
			S("var " + m.id + " = new " + req + "." + m.class + "()");
		});
		W();

		DECLARE_EXTERNAL_LINKS();
		W();

		FUNCTION("init");
		proc.scanAllOnce(function(l){return l.isProcedural();}, function(l) {
			LINK_INIT(l);
			for(var i in l.dst.params) S(l.dst.id + "." + i + " = " + l.dst.params[i]);
			CALL(l.dst.id + ".init", []);
		});
		INIT_EXTERNAL_LINKS();
		END();
		W();

		FUNCTION("deinit");
		proc.reverseScanAllOnce(function(l){return l.isProcedural();}, function(l) {
			CALL(l.src.id + ".deinit", []);
		});
		UNINIT_EXTERNAL_LINKS();
		END();
		W();

		FUNCTION("process");
		proc.scanAllOnce(function(l){return l.isProcedural();}, function(l) {
			MODULE_CALL(l.dst);
		});
		END();
		W();

		FUNCTION("main");
			FOR("var iteration = 0", "", "iteration++");
				CALL("process");
			END();
		END();
		W();
		CALL("main");

	});
	return defered.promise;
}

module.exports = JavascriptWriter;
