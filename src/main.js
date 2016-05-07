const utils = require("./utils/utils");
var Script = require("./model/script");
var Compiler = require("./compiler");
const DBG = utils.DBG;

process.title = 'pgcc';

function usage() {
    console.error("PGCC - The dataflow system compiler");
    console.error("-----------------------------------");
    console.error(" Usage : pgcc <file.script>");
}

function compile(scriptfile) {
    var s = new Script(scriptfile);
    s.on('loaded', function(nbErrors) {
        try {
            new Compiler().compile(s, scriptfile.replace(".script", ""));
            s.computeProcesses();
        } catch(e) {console.error(e.stack);}
    });
}

var filename = process.argv[2];
if(!filename) usage();

compile(scriptfile);
