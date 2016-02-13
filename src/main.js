Array.prototype.remove = function(o) {
	var i = this.indexOf(o);
	if(i===-1) return false;
	return this.splice(i,1,0);
}


var GRAPH = null;

function Graph() {
	this.modules = [];
	this.links = [];

	this.computeConnectedComponents = function() {
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

	this.addModule = function(module) {
		this.modules.push(module);
	};

	this.addLink = function(link) {
		this.links.push(link);
	};

	this.scan = function(startModules, callback) {
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

	this.reverseScan = function(startModules, callback) {
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

	this.scanAll = function(callback) {
		return this.scan(getSourceModules(), callback);
	};

	this.getSourceModules = function() {
		var sm = [];
		this.modules.forEach(function(m) { if(m.nbIns()===0) sm.push(m); });
		return sm;
	};

	this.getLeafModules = function() {
		var sm = [];
		this.modules.forEach(function(m) { if(m.nbOuts()===0) sm.push(m); });
		return sm;
	};

}

function Module() {
	this.class = null;
	this.id = null;
	this.params = {};
	this.graph = GRAPH;
	this.outs = [];
	this.ins = [];

	this.graph.addModule(this);
	this.attached = true;

	this.set = function(k,v) { this.params[k] = v; };
	this.get = function(k) { return this.params[k]; };

	this.connect = function(module) { new Link(this, module); };

	this.addOut = function(link) { this.outs.push(link); }
	this.addIn = function(link) { this.ins.push(link); }
	this.removeOut = function(link) { this.outs.remove(link); };
	this.removeIn = function(link) { this.ins.remove(link); };
	this.nbOuts = function() { return this.outs.length; };
	this.nbIns = function() { return this.ins.length; };

	this.delete = function() {
		this.graph.removeModule(this);
	};

	this.reattach = function() {
		this.graph.addModule(this);
	};
}


function Link(src, dst) {
	this.class = null;
	this.id = null;
	this.params = {};
	this.graph = src.GRAPH;

	this.src = src;
	this.dst = dst;
	this.src.addOut(this);
	this.dst.addIn(this);
	this.graph.addLink(this);
	this.attached = true;

	this.set = function(k,v) { this.params[k] = v; };
	this.get = function(k) { return this.params[k]; };

	this.delete = function() {
		this.src.removeOut(this);
		this.dst.removeIn(this);
		this.graph.removeLink(this);
	};

	this.reattach = function() {
		this.src.addOut(this);
		this.dst.addIn(this);
		this.graph.addLink(this);
	};

}
