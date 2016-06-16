default: all

all:
	@mkdir -p ~/.pgcc/include
	@cp -r src/include/* ~/.pgcc/include

install:
	@mkdir -p /usr/include/pgcc
	@cp -r src/include/* /usr/include/pgcc
