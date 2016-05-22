const utils = require("./utils/utils");
var Script = require("./model/script");
var Compiler = require("./compiler");
var Index = require("./indexer/index");
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const DBG = utils.DBG;

process.title = 'pgcc';
var PGCC_LIBS_DIR = process.env['HOME'] + "/.pgcc/libs";

/////////////////////////


function usage() {
    console.error("\nPGCC - The dataflow system compiler");
    console.error(" Usage : ");
    console.error("   pgcc <file.script>");
    console.error("   pgcc -i <sourcefile.c> | <sourcefile.cpp> | <sourcefile.py> | <somefile.pgso> ... outfile.pgso");
    console.error("   pgcc -d <file.pgso> ... ");
    console.error("   pgcc -l [<function> | file.pgso]\n");
    process.exit(1);
}

/** Compile the given script file */
function compile(scriptfile) {
    var s = new Script(scriptfile);
    s.on('loaded', function(nbErrors) {
        try {
            s.computeProcesses();
            new Compiler().compile(s, scriptfile.replace(".script", ""));
        } catch(e) {console.error(e.stack);}
    });
}

/** Index the content of the given <sourcefiles> and write the resulting modules library to <outfile> */
function index(sourcefiles, outfile) {
    var i = new Index();
    sourcefiles.forEach(function(f) { i.append(f); });
    i.write(outfile);
}

/** Declare the given library files to be used globally (i.e., symlink them to ~/.pgcc/libs) */
function declare(files) {
    childProcess.execSync("mkdir -p " + PGCC_LIBS_DIR);
    files.forEach(function(f) {
        fs.symlink(path.resolve(f), PGCC_LIBS_DIR + "/" + path.basename(f), function(){});
    });
}

/** List all globally defined modules */
function list_all() {
    process.stdout.write(childProcess.execSync("cat " + PGCC_LIBS_DIR + "/*").toString()); // TODO !
}

/** List the modules defined in the given library <file> */
function list_file(file) {
    process.stdout.write(childProcess.execSync("cat " + file).toString()); // TODO !
}

/** Find the give <func> module in the globally declared libraries */
function lookup_function(func) {
    try {
        func = func.replace("*", "[a-z0-9A-Z_]*");
        process.stdout.write(childProcess.execSync("cat " + PGCC_LIBS_DIR + "/* 2>/dev/null | grep -e '^"+func+" '").toString()); // TODO !
    } catch(e) {}
}


//////////////////////////////


// Args parsing
if(!process.argv[2]) usage();
else if(process.argv[2] === '-i') {
    if(!process.argv[3] || !process.argv[4]) usage();
    index(process.argv.slice(3,process.argv.length-1), process.argv[process.argv.length-1]);
} else if(process.argv[2] === '-d') {
    if(!process.argv[3]) usage();
    declare(process.argv.slice(3));
} else if(process.argv[2] === '-l') {
    if(!process.argv[3]) list_all();
    else if(process.argv[3].endsWith(".pgso")) list_file(process.argv[3]);
    else lookup_function(process.argv[3]);
} else {
    compile(process.argv[2]);
}
