const utils = require("./utils/utils");
var Script = require("./model/script");
var Compiler = require("./compiler");
const DBG = utils.DBG;

process.title = 'pgcc';

function usage() {
    console.error("\nPGCC - The dataflow system compiler\n");
    console.error(" Usage : pgcc <file.script>\n\n");
    process.exit(1);
}

function compile(scriptfile) {
    var s = new Script(scriptfile);
    s.on('loaded', function(nbErrors) {
        try {
            s.computeProcesses();
            new Compiler().compile(s, scriptfile.replace(".script", ""));
        } catch(e) {console.error(e.stack);}
    });
}

var filename = process.argv[2];
if(!filename) usage();

compile(filename);
