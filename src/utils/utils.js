const util = require("util");


String.prototype.before = function(str) {
  var i = this.indexOf(str);
  if(i===-1) return this;
  return this.substr(0, i);
}

String.prototype.after = function(str) {
  var i = this.indexOf(str);
  if(i===-1) return this;
  return this.substr(i+str.length, this.length);
}

if (!String.prototype.repeat) {
  String.prototype.repeat = function(count) {
    'use strict';
    if (this == null) {
      throw new TypeError('can\'t convert ' + this + ' to object');
    }
    var str = '' + this;
    count = +count;
    if (count != count) {
      count = 0;
    }
    if (count < 0) {
      throw new RangeError('repeat count must be non-negative');
    }
    if (count == Infinity) {
      throw new RangeError('repeat count must be less than infinity');
    }
    count = Math.floor(count);
    if (str.length == 0 || count == 0) {
      return '';
    }
    // Ensuring count is a 31-bit integer allows us to heavily optimize the
    // main part. But anyway, most current (August 2014) browsers can't handle
    // strings 1 << 28 chars or longer, so:
    if (str.length * count >= 1 << 28) {
      throw new RangeError('repeat count must not overflow maximum string size');
    }
    var rpt = '';
    for (;;) {
      if ((count & 1) == 1) {
        rpt += str;
      }
      count >>>= 1;
      if (count == 0) {
        break;
      }
      str += str;
    }
    // Could we try:
    // return Array(count + 1).join(this);
    return rpt;
  }
}


Array.prototype.remove = function(o) {
	var i = this.indexOf(o);
	if(i===-1) return false;
	return this.splice(i,1,0);
}


utils = {};

utils.DBG = function(x) {
	console.log(util.inspect(x, {depth:2}));
};

module.exports = utils;