const fs = require('fs');
const Script = require('../model/script');
const Module = require('../model/module');
const Link = require('../model/link');
const DBG = require("../utils/utils").DBG;
const Q = require("q");


////////////////////////////////////////////////////////////
// ScriptWriter : Writes a Script model to a .script file //
////////////////////////////////////////////////////////////

function ScriptWriter(script) {
    this.script = script;
}


ScriptWriter.prototype.write = function(filename) {
    var _defered = Q.defer();
    var that = this;
    fs.open(filename, 'w', 444, function( e, file ) {
        var promise = Q();

        // Async writing helper
        function W(str) {
            if(!str) str = "";
            promise = promise.then(function(){
                var defered = Q.defer();
                fs.write( file, str + "\n", null, 'utf8', function(){ return defered.resolve();  });
                return defered.promise;
            });
        }

        // LANGUAGE SPECIFICATION

        function END() {
            promise = promise.then(function() {
                var defered = Q.defer();
                fs.close(file, function(){
                    _defered.resolve();
                    return defered.resolve();
                });
                return defered.promise;
            });
        }

        // EFFECTIVELY WRITE .script

        // Script section
        W("Script " + that.script.name);
        that.script.includes.forEach(function(i) {
            W("Include " + i);
        });
        W("\n");

        // Modules section
        W('[Modules]');
        that.script.modules.forEach(function(m) {
            W(m.class + " " + m.id +  (m.get('options') ? " "+m.get('options').join(" ") : "") );
            for(p in m.params) {
                if(p==='options') continue;
                W(p + " = " + m.params[p]);
            }
            W();
        });
        W("\n");

        // Links section
        W('[Links]');
        that.script.links.forEach(function(l) {
            var src = l.src.id;
            var dst = l.dst.id;
            if(l.srcPin) src += "." + l.srcPin;
            if(l.dstPin) dst += "." + l.dstPin;
            W(src + " -> " + dst + (l.get('options') ? " "+l.get('options').join(" ") : "") );
            for(p in l.params) {
                if(p==='options' || p==='src' || p==='dst' || p==='srcPin' || p==='dstPin') continue;
                W(p + " = " + l.params[p]);
            }
            W();
        });

        END();
    });
    return _defered.promise;
};

module.exports = ScriptWriter;
