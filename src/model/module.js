
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const Pins = require('../indexer/pins');
const IndexLookup = require("../indexer/lookup");


////////////
// MODULE //
////////////


function Module(script) {
	this.class = null;
	this.id = null;
	this.params = {};
	this.script = script;
	this.outs = [];
	this.ins = [];

	if(this.script) {
		this.script.addModule(this);
		this.attached = true;
	}
}
util.inherits(Module, EventEmitter);


Module.prototype.set = function(k,v) {
	if(k === 'id' || k === 'name') this.id = v;
	else if(k === 'class' || k === 'type') {
		this.class = v;
		this.pins = null;
	}
	else this.params[k] = v;
	this.emit('change', {key:k, value:v});
};
Module.prototype.get = function(k) {
	if(k === 'id' || k === 'name') return this.id;
	else if(k === 'class' || k === 'type') return this.class;
	return this.params[k];
};
Module.prototype.unset = function(k) {
	if(k === 'id' || k === 'name') return;
	else if(k === 'class' || k === 'type') return;
	delete this.params[k]; this.emit('change', {key:k, value:undefined});
};

Module.prototype.connect = function(module) { new Link(this.script, this, module); };

Module.prototype.addOut = function(link) { this.outs.push(link); }
Module.prototype.addIn = function(link) { this.ins.push(link); }
Module.prototype.removeOut = function(link) { this.outs.remove(link); };
Module.prototype.removeIn = function(link) { this.ins.remove(link); };
Module.prototype.nbOuts = function(filter) { return filter ? this.outs.filter(filter).length : this.outs.length; };
Module.prototype.nbIns = function(filter) { return filter ? this.ins.filter(filter).length : this.ins.length; };

Module.prototype.delete = function() {
	this.script.removeModule(this);
};

Module.prototype.reattach = function() {
	this.script.addModule(this);
};


Module.prototype.copyTo = function(m) {
	m.script = this.script;
	m.class = this.class;
	m.id = this.id;
	for(var k in this.params) m.params[k] = this.params[k];
};

Module.prototype.getPin = function(name) {
	if(!this.pins) return null;
	return this.pins.filter(function(p) {return p.name = name;})[0];
};

Module.prototype.getPins = function() {
	if(!this.pins) this.pins = Pins.getPins(this.class);
	return this.pins;
};


// Index Lookup

Module.prototype.inferLanguage = function() {
	return IndexLookup.lookupModule(this.class).lang;
}

module.exports = Module;
