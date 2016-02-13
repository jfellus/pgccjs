const ScriptReader = require("./script_reader");
const ScriptWriter = require("./script_writer");
const Module = require("./module");
const Link = require("./link");
const DBG = require("./utils").DBG;
const EventEmitter = require('events').EventEmitter;
const util = require('util');

var SCRIPT = null;

function Script(filename) {
	this.modules = [];
	this.links = [];
	this.includes = [];

	if(filename) this.read(filename);
}
util.inherits(Script, EventEmitter);

Script.prototype.read = function(filename) {
	var that = this;
	var sr = new ScriptReader(this);
	return sr.read(filename).then(function(){
		that.emit("loaded", sr.errors);
	});
}

Script.prototype.write = function(filename) {
	return new ScriptWriter(this).write(filename);
}

Script.prototype.computeConnectedComponents = function() {
	var that = this;
	this.getSourceModules().forEach(function(m, i) {
		that.scan(m, function(l) {
			l.dst.connectedComponent = l.src ? l.src.connectedComponent : i;
		});
	});
	this.getLeafModules().forEach(function(m, i) {
		that.scan(m, function(l) {
			if(l.dst) l.src.connectedComponent = l.dst.connectedComponent;
		});
	});
}

Script.prototype.declare = function(k, v) {
	if(k == 'script') this.name = v;
	else if(k == 'include') this.include(v);
};

Script.prototype.include = function(lib) {
	if(this.includes.indexOf(lib)===-1) this.includes.push(lib);
};

Script.prototype.addModule = function(module) {
	this.modules.push(module);
};

Script.prototype.addLink = function(link) {
	this.links.push(link);
};

Script.prototype.getModule = function(id) {
	var m = this.modules.filter(function(m) { return m.id === id; });
	return m ? m[0] : null;
};

Script.prototype.scan = function(startModules, callback) {
	var fifo = startModules;
	if(!fifo.push) fifo = [startModules];

	while(fifo.length) {
		var l = fifo.splice(0,1,0);
		var m = l.dst ? l.dst : l;
		if(!l.dst) l = {dst:m};

		m.outs.forEach(function(l) {fifo.push(l);});
		callback(l);
	}
};

Script.prototype.reverseScan = function(startModules, callback) {
	var fifo = startModules;
	if(!fifo.push) fifo = [startModules];

	while(fifo.length) {
		var l = fifo.splice(0,1,0);
		var m = l.src ? l.src : l;
		if(!l.src) l = {src:m};

		m.ins.forEach(function(l) {fifo.push(l);});
		callback(l);
	}
};

Script.prototype.scanAll = function(callback) {
	return this.scan(getSourceModules(), callback);
};

Script.prototype.getSourceModules = function() {
	var sm = [];
	this.modules.forEach(function(m) { if(m.nbIns()===0) sm.push(m); });
	return sm;
};

Script.prototype.getLeafModules = function() {
	var sm = [];
	this.modules.forEach(function(m) { if(m.nbOuts()===0) sm.push(m); });
	return sm;
};


module.exports = Script;
