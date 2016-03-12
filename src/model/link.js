
const EventEmitter = require('events').EventEmitter;
const util = require('util');



//////////
// LINK //
//////////

function Link(src, dst) {
	this.class = null;
	this.id = null;
	this.params = {};
	this.script = src.script;

	this.src = src;
	this.dst = dst;
	this.src.addOut(this);
	this.dst.addIn(this);
	this.script.addLink(this);
	this.attached = true;
}
util.inherits(Link, EventEmitter);


Link.prototype.set = function(k,v) { this.params[k] = v; this.emit('change', {key:k, value:v});};
Link.prototype.get = function(k) { return this.params[k]; };

Link.prototype.delete = function() {
	this.src.removeOut(this);
	this.dst.removeIn(this);
	this.script.removeLink(this);
};

Link.prototype.reattach = function() {
	this.src.addOut(this);
	this.dst.addIn(this);
	this.script.addLink(this);
};

Link.prototype.needsRead = function() {
	return false; // TODO
};

Link.prototype.needsWrite = function() {
	return false; // TODO
};
Link.prototype.isProcedural = function() {
	return true; // TODO
}

module.exports = Link;
