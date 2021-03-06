const util = require("util");
const fs = require("fs");
const Q = require("q");

/////////////////////
// STRING POLYFILL //
/////////////////////

String.prototype.before = function(str) {
  var i = this.indexOf(str);
  if(i===-1) return this;
  return this.substr(0, i);
}

String.prototype.beforeLast = function(str) {
  var i = this.lastIndexOf(str);
  if(i===-1) return this;
  return this.substr(0, i);
}

String.prototype.after = function(str) {
  var i = this.indexOf(str);
  if(i===-1) return this;
  return this.substr(i+str.length, this.length);
}

String.prototype.afterLast = function(str) {
  var i = this.lastIndexOf(str);
  if(i===-1) return this;
  return this.substr(i+str.length, this.length);
}

String.prototype.nth = function(sep, i) {
    var sp = this.split(sep);
    if(i<0) return sp[sp.length+i];
    else return sp[i];
}

String.prototype.startsWith = function(str) {
    return this.indexOf(str) === 0;
}

String.prototype.endsWith = function(str) {
    return this.lastIndexOf(str) === this.length - str.length;
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


////////////////////
// ARRAY POLYFILL //
////////////////////

Array.prototype.remove = function(o) {
	var i = this.indexOf(o);
	if(i===-1) return false;
	return this.splice(i,1);
}



///////////////////////
// UTILITY FUNCTIONS //
///////////////////////

utils = {};

utils.DBG = function(x) {
	console.log(util.inspect(x, {depth:2}));
};

utils.cp = function(source, target) {
	var defered = Q.defer();
    var rd = fs.createReadStream(source);
    rd.on('error', defered.reject);
    var wr = fs.createWriteStream(target);
    wr.on('error', defered.reject);
    wr.on('finish', defered.resolve);
    rd.pipe(wr);
    return defered.promise;
}


module.exports = utils;
