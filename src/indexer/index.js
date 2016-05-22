const path = require('path');
const childProcess = require('child_process');
const fs = require('fs');

function Index() {
	this.tags = [];
}

/** Scan the given file for tags using Exuberant Ctags and add discovered functions to this Index */
Index.prototype.append = function(file) {
	try {
		var that = this;
		var f = path.resolve(file);
		var tags = childProcess.execSync('ctags --fields=+Snl --c++-kinds=+p -f - '+f+' | sed "s/[\\t]/##/g" | grep \'"##f##\\|##p##\'').toString().split("\n").map(function(tag){
			that.addCtagsTag(tag);
		});
	} catch(e) {}
}

/** Add a tag extracted by Exuberant Ctags to this Index */
Index.prototype.addCtagsTag = function(tag) {
	if(typeof tag === 'string') this.addCtagsTag(tag.split("##"));
	else if(Array.isArray(tag)) {
		if(tag.length<5) return;
		var _tag = {
			name: tag[0],
			file: tag[1],
			line: tag[4].after(":"),
			lang: tag[5].after(":"),
			ret: null,
			signature: null
		};
		if(_tag.lang === 'C++') {
			_tag.ret = tag[6].after(":").after(":");
			_tag.signature = tag[7].after(":");
		}
		else if(tag[6]) _tag.signature = tag[6].after(":");
		this.addCtagsTag(_tag);
	}
	else if(tag.name) this.tags.push(tag);
	else throw 'Unhandled tag type';
}

/** Write this Index to the given .pgso <file> */
Index.prototype.write = function(file) {
	childProcess.execSync("mkdir -p " + path.dirname(file));
	fs.unlink(file);
	this.tags.forEach(function(tag) {
		fs.appendFileSync(file,
			[tag.name, tag.file, tag.line, tag.lang, tag.ret, tag.signature].join(" | ") + "\n"
		);
	});
}



module.exports = Index;
