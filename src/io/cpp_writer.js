const fs = require('fs');
const Q = require("q");
const DBG = require("../utils/utils").DBG;


var SYS_INCLUDES = [];


function CPPWriter(script) {
  this.script = script;
}

CPPWriter.prototype.write = function(outdir) {
  var that = this;
  fs.mkdirSync(outdir);
  return Q.all(this.script.processes.map(function(p) {
    that.writeProcess(p, outdir + "/" + p.name + ".cpp");
  }));
}


CPPWriter.prototype.writeProcess = function(proc, filename) {
  var defered = Q.defer();
  var that = this;
  fs.open(filename, 'w', 0664, function( e, file ) {
    var promise = Q();
    var nbTabs = 0;

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


    // EFFECTIVE WRITING
    SYS_INCLUDES.forEach(function(i) { INCLUDE("<"+i+">"); });
    INCLUDE('"pgcc-script.h"');
    proc.includes.forEach(function(i) { INCLUDE('"' + i + '"')});
    W();

    FUNCTION("void", "init", []);
    proc.scanAll(function(l) {
      CALL(l.dst.id + ".init", []);
    });
    END();
    W();

    FUNCTION("void", "deinit", []);
    proc.scanAll(function(l) {
      CALL(l.dst.id + ".deinit", []);
    });
    END();
    W();

    FUNCTION("void", "process", []);
    proc.scanAll(function(l) {
      MODULE_CALL(l.dst);
    });
    END();

  });
  return defered.promise;
}

module.exports = CPPWriter;
