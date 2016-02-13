const readline = require('readline');
const fs = require('fs');
const Script = require('./script');
const Module = require('./module');
const Link = require('./link');
const DBG = require("./utils").DBG;


function ScriptReader(script) {
  this.script = script ? script : new Script();
}


ScriptReader.prototype.read = function(filename) {
  var that = this;
  var i = 1;
  DBG(filename);
  const rl = readline.createInterface({input: fs.createReadStream(filename), output: process.stdout, terminal: false});
  rl.on('line', function (line) {
    DBG(line);
    line = line.trim(); line = line.before("#");
    if(line.length) try {that.parseStatement(line);} catch(err) { console.error(filename + " at line " + i + " : " + err ); }
    i++;
  });
}

ScriptReader.prototype.parseStatement = function(statement) {
  if(statement[0]=='[') return this.section = statement.toLowerCase();

  if(statement.indexOf("=") !== -1) {
    var k = statement.before("=").trim();
    var v = statement.after("=").trim();
    if(!this.section) return script.declare(k,v);
    else if(this.section === '[modules]') return this.module.set(k,v);
    else if(this.section === '[links]') return this.link.set(k,v);
  } else if(statement.indexOf("->") !== -1){
    var _src = statement.split("->")[0].trim();
    var srcName = _src.split('.')[0];
    var srcPin = _src.split('.')[1];
    var vs = statement.split("->")[1].trim().split(" ");
    var _dst = vs[0].trim();
    var dstName = _dst.split('.')[0];
    var dstPin = _dst.split('.')[1];
    var src = this.script.getModule(srcName);
    var dst = this.script.getModule(dstName);
    if(!src) throw 'Not such src module : ' + statement;
    if(!dst) throw 'Not such dst module : ' + statement;
    if(this.section === '[links]') {
      this.link = new Link(src, dst);
      this.link.set("srcPin", srcPin);
      this.link.set("dstPin", dstPin);
      this.link.set("options", vs.slice(1));
      return this.link;
    }
  } else {
    var k = statement.split(" ")[0].trim().toLowerCase();
    var v = statement.split(" ")[1].trim();
    if(!this.section) return this.script.declare(k,v);
    else if(this.section === '[modules]') {
      this.module = this.script.getModule(v);
      if(!this.module) this.module = new Module(this.script);
      this.module.set("class", k);
      this.module.set("id", v);
      this.module.set("options", statement.split(" ").slice(2));
      return this.module;
    }
  }

  throw "Bad statement : " + statement;
}


module.exports = ScriptReader;
