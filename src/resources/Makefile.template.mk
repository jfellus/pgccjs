
PROCESSES_BIN:=$(addprefix processes/, $(PROCESSES))

INCLUDES:=$(shell ~/.pgcc/pgcc-include-path)
INCLUDES:=$(addprefix -I, $(INCLUDES))



all: processes/ $(PROCESSES_BIN)

processes/:
	mkdir -p processes/

processes/%: src/%.cpp
	g++ -o $@ $< $(INCLUDES)