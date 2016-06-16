all: reader writer

reader: test_reader.cpp ../include/pgcc-script.h
	g++ -pthread -o reader test_reader.cpp -lrt -I../include

writer: test_writer.cpp ../include/pgcc-script.h
	g++ -pthread -o writer test_writer.cpp -lrt -I../include
