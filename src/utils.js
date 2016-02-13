const util = require("util");


String.prototype.before = function(str) {
  var i = this.indexOf(str);
  if(i===-1) return this;
  return this.substr(0, i);
}

String.prototype.after = function(str) {
  var i = this.indexOf(str);
  if(i===-1) return this;
  return this.substr(i, this.length);
}


Array.prototype.remove = function(o) {
	var i = this.indexOf(o);
	if(i===-1) return false;
	return this.splice(i,1,0);
}


utils = {};

utils.DBG = function(x) {
	console.log(util.inspect(x, {depth:null}));
};

module.exports = utils;
