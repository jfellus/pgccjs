all: libpgcc.js

libpgcc.js: src/*.js src/io/*.js src/model/*.js src/utils/*.js
	browserify src/pgcc.js -o libpgcc.js
