var _lookup =  null;


module.exports = {
	lookupModule: function(moduleClass) {
		if(!_lookup) this._loadLookup();
		var mc = _lookup[moduleClass];
		if(!mc) throw("Module class not found : " + moduleClass);
		return mc;
	},

	getModuleFile: function(moduleClass) {
		var mc = this.lookupModule(moduleClass);
		return mc ? mc.file : null;
	},

	getModuleLang: function(moduleClass) {
		var mc = this.lookupModule(moduleClass);
		return mc ? mc.lang : null;
	},

	getModulePins: function(moduleClass) {
		var mc = this.lookupModule(moduleClass);
		return mc ? mc.pins : null;
	},




// Internals

	_loadLookup: function() {
		var that = this;
		_lookup = {};
		var raw = require('child_process').execSync("pgcc -l ").toString().split("\n");
		raw.forEach(function(statement) {
			var prototype = statement.trim().split(" | ");
			if(prototype.length<7) return;

			name = prototype[0];
			var signature = prototype[6].substr(1, prototype[6].length-2).split(',');
			var lang = prototype[4];
			var pins = signature.map(function(arg) {return {name: arg.trim()}; });
			if(lang==='C++' || lang==='C') {
				pins = pins.map(function(pin){
					return {
						type:pin.name.beforeLast(" "),
						name:pin.name.afterLast(" ")
					};
				});
			}
			_lookup[name] = {
				name: name,
				file: prototype[1],
				pgso: prototype[2],
				line: prototype[3],
				lang: lang,
				pins: pins
			};
		});
	}

}
