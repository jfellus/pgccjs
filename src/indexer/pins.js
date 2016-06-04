module.exports = {
	getPins: function(moduleClass) {
		return this._getPinsCache(moduleClass) || this._loadPins(moduleClass);
	},

// Internals
	_getPinsCache: function(moduleClass) {
		return this._pinsCache ? this._pinsCache[moduleClass] : null;
	},

	_loadPins: function(moduleClass) {
		try {
			var prototype = require('child_process').execSync("pgcc -l " + moduleClass).toString().trim().split(" | ");
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

			if(!this._pinsCache) this._pinsCache = {};
			return this._pinsCache[moduleClass] = pins;
		}
		catch(e) { console.error(e); }
	}
}
