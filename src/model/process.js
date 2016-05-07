var Script = require("./script");
var DBG = require("../utils/utils").DBG;


/////////////
// PROCESS //
/////////////

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

/**
 * Scan this process's graph, starting flowing from the given <startModules>,
 * and calling <callback> for each met module except those for which <filter> returns false
 */
Process.prototype.scan = function(startModules, filter, callback) {
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
 * Scan this process's graph in reverse flow, starting from the given <startModules>,
 * and calling <callback> for each met module except those for which <filter> returns false
 */
Process.prototype.reverseScan = function(startModules, filter, callback) {
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
Process.prototype.scanOnce = function(startModules, filter, callback) {
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
Process.prototype.reverseScanOnce = function(startModules, filter, callback) {
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
Process.prototype.scanAll = function(filter, callback) {
	return this.scan(this.getSourceModules(), filter, callback);
};

/** Call #reverseScan, starting with all leaf modules */
Process.prototype.reverseScanAll = function(filter, callback) {
	return this.reverseScan(this.getLeafModules(), filter, callback);
};

/** Call #scanOnce, starting with all source modules */
Process.prototype.scanAllOnce = function(filter, callback) {
	return this.scanOnce(this.getSourceModules(), filter, callback);
};

/** Call #reverseScanOnce, starting with all leaf modules */
Process.prototype.reverseScanAllOnce = function(filter, callback) {
	return this.reverseScanOnce(this.getLeafModules(), filter, callback);
};

/** @return all source modules (i.e., modules with no inputs) */
Process.prototype.getSourceModules = function() {
	var sm = [];
	this.modules.forEach(function(m) { if(m.nbIns()===0) sm.push(m); });
	return sm;
};

/** @return all leaf modules (i.e., modules with no outputs) */
Process.prototype.getLeafModules = function() {
	var sm = [];
	this.modules.forEach(function(m) { if(m.nbOuts()===0) sm.push(m); });
	return sm;
};



module.exports = Process;
