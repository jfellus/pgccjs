const readline = require('readline');
const fs = require('fs');
const Script = require('../model/script');
const Module = require('../model/module');
const Link = require('../model/link');
const DBG = require("../utils/utils").DBG;
const Q = require("q");


/////////////////////////////////////////////////////////////
// ScriptReader : Reads a Script model from a .script file //
/////////////////////////////////////////////////////////////

function ScriptReader(script) {
    this.script = script ? script : new Script();
}


ScriptReader.prototype.read = function(filename) {
    var defered = Q.defer();
    var that = this;
    this.errors = 0;
    var i = 1;
    const rl = readline.createInterface({input: fs.createReadStream(filename), output: process.stdout, terminal: false});
    rl.on('line', function (line) {
        line = line.trim(); line = line.before("#");
        if(line.length)
        try { that.parseStatement(line);}
        catch(err) {
            console.error(filename + " at line " + i + " : " + err );
            that.errors++;
        }
        i++;
    });
    rl.on('close' ,function() { defered.resolve();});
    return defered.promise;
}

/** Parses a single statement from a .script file */
ScriptReader.prototype.parseStatement = function(statement) {
    if(statement[0]=='[') return this.section = statement.toLowerCase();

    if(statement.indexOf("=") !== -1) {
        var k = statement.before("=").trim();
        var v = statement.after("=").trim();
        if(!this.section) return script.declare(k,v);
        else if(this.section === '[modules]') {
            if(!this.module) throw "Warning : ignoring statement '" + statement + "'";
            return this.module.set(k,v);
        }
        else if(this.section === '[links]') {
            if(!this.link) throw "Warning : ignoring statement '" + statement + "'";
            return this.link.set(k,v);
        }
    } else if(statement.indexOf("->") !== -1){
        this.link = null;
        var _src = statement.before("->").trim();
        var srcName = _src.split('.')[0];
        var srcPin = _src.split('.')[1];
        var vs = statement.after("->").trim().split(" ");
        var _dst = vs[0].trim();
        var dstName = _dst.split('.')[0];
        var dstPin = _dst.split('.')[1];
        var src = this.script.getModule(srcName);
        var dst = this.script.getModule(dstName);
        if(!src) throw 'No such src module \'' + srcName + "' in '" + statement + "'";
        if(!dst) throw 'No such dst module \'' + dstName + "' in '" + statement + "'";
        if(this.section === '[links]') {
            this.link = new Link(this.script, src, dst);
            this.link.srcPin = srcPin;
            this.link.dstPin = dstPin;
            this.link.options = vs.slice(1);
            return this.link;
        }
    } else {
        var k = statement.split(" ")[0].trim();
        var v = statement.split(" ")[1].trim();
        if(!this.section) return this.script.declare(k.toLowerCase(),v);
        else if(this.section === '[modules]') {
            this.module = this.script.getModule(v);
            if(!this.module) this.module = new Module(this.script);
            this.module.class = k;
            this.module.id = v;
            this.module.options = statement.split(" ").slice(2);
            return this.module;
        }
    }

    throw "Bad statement : '" + statement + "'";
}


module.exports = ScriptReader;
