
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

Link.prototype.set = function(k,v) { this.params[k] = v; };
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


module.exports = Link;
