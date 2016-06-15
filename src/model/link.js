
const EventEmitter = require('events').EventEmitter;
const util = require('util');
const IndexLookup = require('../indexer/lookup');



//////////
// LINK //
//////////

function Link(script, src, dst) {
	this.class = null;
	this.id = null;
	this.params = {};
	this.script = script;

	this.set("src", src);
	this.set("dst", dst);
}
util.inherits(Link, EventEmitter);


Link.prototype.set = function(k,v) {
	if(k === "src") {
		if(typeof v === 'string') v = this.script.getModule(v);
		if(this.src) this.detach();
		this.src = v;
		if(!v) return;
		v = this.src.id;
	} else if(k === "dst") {
		if(typeof v === 'string') v = this.script.getModule(v);
		if(this.dst) this.detach();
		this.dst = v;
		if(!v) return;
		v = this.dst.id;
	}

	if((k==="src" || k==="dst") && this.src && this.dst && !this.attached) this.reattach();

	this.params[k] = v; this.emit('change', {key:k, value:v});
};

Link.prototype.unset = function(k) {
	delete this.params[k]; this.emit('change', {key:k, value:undefined});
};

Link.prototype.get = function(k) { return this.params[k]; };

Link.prototype.detach = function() {
	this.delete();
}

Link.prototype.delete = function() {
	this.src.removeOut(this);
	this.dst.removeIn(this);
	this.script.removeLink(this);
	this.attached = false;
};

Link.prototype.reattach = function() {
	this.src.addOut(this);
	this.dst.addIn(this);
	this.script.addLink(this);
	this.attached = true;
};

Link.prototype.needsInit = function() {
	return !this.isProcedural();
};

Link.prototype.needsRead = function() {
	return !this.isProcedural();
};

Link.prototype.needsWrite = function() {
	return !this.isProcedural();
};

Link.prototype.isProcedural = function() {
	return !this.get("type") &&
		IndexLookup.getModuleLang(this.src.class) === IndexLookup.getModuleLang(this.dst.class);
};

Link.prototype.copyTo = function(l) {
	l.class = this.class;
	l.id = this.id;
	for(var k in this.params) l.params[k] = this.params[k];
};

module.exports = Link;
