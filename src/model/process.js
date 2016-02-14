
var Script = require("./script");
var DBG = require("../utils/utils").DBG;


function Process(script, iProcess) {
  this.script = script;
  this.id = iProcess;
  this.modules = [];
  this.includes = [];
  this.name = script.name + "_p" + iProcess;
}

Process.prototype.addModule = function(m) {
  this.modules.push(m);
}

Process.prototype.getModule = function(id) {
	var m = this.modules.filter(function(m) { return m.id === id; });
	return m ? m[0] : null;
};

Process.prototype.scan = function(startModules, callback) {
	var fifo = startModules;
	if(!fifo.push) fifo = [startModules];

	while(fifo.length) {
    var l = fifo.splice(0,1)[0];
		var m = l.dst ? l.dst : l;
		if(!l.dst) l = {dst:m};

		m.outs.forEach(function(l) {fifo.push(l);});
		callback(l);
	}
};

Process.prototype.reverseScan = function(startModules, callback) {
	var fifo = startModules;
	if(!fifo.push) fifo = [startModules];

	while(fifo.length) {
		var l = fifo.splice(0,1)[0];
		var m = l.src ? l.src : l;
		if(!l.src) l = {src:m};

		m.ins.forEach(function(l) {fifo.push(l);});
		callback(l);
	}
};


Process.prototype.scanAll = function(callback) {
	return this.scan(this.getSourceModules(), callback);
};

Process.prototype.getSourceModules = function() {
	var sm = [];
	this.modules.forEach(function(m) { if(m.nbIns()===0) sm.push(m); });
	return sm;
};

Process.prototype.getLeafModules = function() {
	var sm = [];
	this.modules.forEach(function(m) { if(m.nbOuts()===0) sm.push(m); });
	return sm;
};



module.exports = Process;
