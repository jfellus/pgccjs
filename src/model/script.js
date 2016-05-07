const ScriptReader = require("../io/script_reader");
const ScriptWriter = require("../io/script_writer");
const Module = require("./module");
const Link = require("./link");
const DBG = require("../utils/utils").DBG;
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const Process = require("./process");

var SCRIPT = null;

////////////
// SCRIPT //
////////////

function Script(filename) {
	this.modules = [];
	this.links = [];
	this.includes = [];
	this.processes = [];

	if(filename) this.read(filename);
}
util.inherits(Script, EventEmitter);


// IO

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

// Manipulation

Script.prototype.addModule = function(module) {
	this.modules.push(module);
};

Script.prototype.removeModule = function(module) {
	this.modules.remove(module);
};

Script.prototype.addLink = function(link) {
	this.links.push(link);
};

Script.prototype.removeLink = function(link) {
	this.links.remove(link);
};

Script.prototype.getModule = function(id) {
	var m = this.modules.filter(function(m) { return m.id === id; });
	return m.length>=1 ? m[0] : null;
};

Script.prototype.hasModule = function(id) {
	return this.modules.filter(function(m) {return m.id === id; }).length >= 1;
}


// Script properties

/** Declare a new script-global property */
Script.prototype.declare = function(k, v) {
	if(k == 'script') this.name = v;
	else if(k == 'include') this.include(v);
};

/** Include a modules library to this script */
Script.prototype.include = function(lib) {
	if(this.includes.indexOf(lib)===-1) this.includes.push(lib);
};


// Computations

/** Assign a connected component number to each module,
 * such that two modules have the same number iff they belong to the same connected component of the graph */
Script.prototype.computeConnectedComponents = function() {
	var that = this;
	this.getSourceModules().forEach(function(m, i) {
		that.scan(m, function(l) { return l.isProcedural(); }, function(l) {
			l.dst.connectedComponent = l.src ? l.src.connectedComponent : i;
		});
	});
	this.getLeafModules().forEach(function(m, i) {
		that.reverseScan(m, function(l) { return l.isProcedural(); }, function(l) {
			if(l.dst) l.src.connectedComponent = l.dst.connectedComponent;
		});
	});
}

/** Compute this script's processes (each process is a subgraph representing a single connected component) */
Script.prototype.computeProcesses = function() {
	var that = this;
	if(!this.processes || this.processes.length) this.processes = [];
	this.computeConnectedComponents();

	this.modules.forEach(function(m) {
		while(that.processes.length < m.connectedComponent + 1 ) that.processes.push(new Process(that, that.processes.length));
		that.processes[m.connectedComponent].addModule(m);
	});

	return this.processes;
}



// Dataflow scan

/**
 * Scan this script's graph, starting flowing from the given <startModules>,
 * and calling <callback> for each met module except those for which <filter> returns false
 */
Script.prototype.scan = function(startModules, filter, callback) {
	var fifo = startModules;
	if(!fifo.push) fifo = [startModules];

	while(fifo.length) {
		var l = fifo.splice(0,1)[0];
		var m = l.dst ? l.dst : l;
		if(!l.dst) l = {dst:m};

		m.outs.forEach(function(l) {if(!filter || filter(l)) fifo.push(l);});
		callback(l);
	}
};

/**
 * Scan this script's graph in reverse flow, starting from the given <startModules>,
 * and calling <callback> for each met module except those for which <filter> returns false
 */
Script.prototype.reverseScan = function(startModules, filter, callback) {
	var fifo = startModules;
	if(!fifo.push) fifo = [startModules];

	while(fifo.length) {
		var l = fifo.splice(0,1)[0];
		var m = l.src ? l.src : l;
		if(!l.src) l = {src:m};

		m.ins.forEach(function(l) {if(!filter || filter(l)) fifo.push(l);});
		callback(l);
	}
};

/** Behaves as #scan, but don't exploit modules more than once */
Script.prototype.scanOnce = function(startModules, filter, callback) {
	this.modules.forEach(function(m) { m._toScan = true; });

	var fifo = startModules;
	if(!fifo.push) fifo = [startModules];

	while(fifo.length) {
		var l = fifo.splice(0,1)[0];
		var m = l.dst ? l.dst : l;
		if(!l.dst) l = {dst:m};

		m.outs.forEach(function(l) {if(!filter || filter(l)) fifo.push(l);});
		if(l.dst._toScan) { callback(l); delete l.dst._toScan; }
	}
};

/** Behaves as #reverseScan, but don't exploit modules more than once */
Script.prototype.reverseScanOnce = function(startModules, filter, callback) {
	this.modules.forEach(function(m) { m._toScan = true; });

	var fifo = startModules;
	if(!fifo.push) fifo = [startModules];

	while(fifo.length) {
		var l = fifo.splice(0,1)[0];
		var m = l.src ? l.src : l;
		if(!l.src) l = {src:m};

		m.ins.forEach(function(l) {if(!filter || filter(l)) fifo.push(l);});
		if(l.src._toScan) { callback(l); delete l.src._toScan; }
	}
};


/** Call #scan, starting with all source modules */
Script.prototype.scanAll = function(filter, callback) {
	return this.scan(this.getSourceModules(), filter, callback);
};

/** Call #reverseScan, starting with all leaf modules */
Script.prototype.reverseScanAll = function(filter, callback) {
	return this.scan(this.getLeafModules(), filter, callback);
};

/** Call #scanOnce, starting with all source modules */
Script.prototype.scanAllOnce = function(filter, callback) {
	return this.scan(this.getSourceModules(), filter, callback);
};

/** Call #reverseScanOnce, starting with all leaf modules */
Script.prototype.reverseScanAllOnce = function(filter, callback) {
	return this.reverseScanOnce(this.getLeafModules(), filter, callback);
};

/** @return all source modules (i.e., modules with no inputs) */
Script.prototype.getSourceModules = function() {
	var sm = [];
	this.modules.forEach(function(m) { if(m.nbIns()===0) sm.push(m); });
	return sm;
};

/** @return all leaf modules (i.e., modules with no outputs) */
Script.prototype.getLeafModules = function() {
	var sm = [];
	this.modules.forEach(function(m) { if(m.nbOuts()===0) sm.push(m); });
	return sm;
};


module.exports = Script;
