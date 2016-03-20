
const EventEmitter = require('events').EventEmitter;
const util = require('util');


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


Module.prototype.set = function(k,v) { this.params[k] = v; this.emit('change', {key:k, value:v}); };
Module.prototype.get = function(k) { return this.params[k]; };

Module.prototype.connect = function(module) { new Link(this.script, this, module); };

Module.prototype.addOut = function(link) { this.outs.push(link); }
Module.prototype.addIn = function(link) { this.ins.push(link); }
Module.prototype.removeOut = function(link) { this.outs.remove(link); };
Module.prototype.removeIn = function(link) { this.ins.remove(link); };
Module.prototype.nbOuts = function() { return this.outs.length; };
Module.prototype.nbIns = function() { return this.ins.length; };

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


module.exports = Module;
