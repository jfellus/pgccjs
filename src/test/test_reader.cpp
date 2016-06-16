#include <pgcc-script.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

float* data = 0;


int main(int argc, char const *argv[]) {
	PgccLinkIn in;
	data = in.init_shm("writer_reader", data, SYNC);
	for(int i=0; i<1000; i++) {
		in.startRead_sync();
		usleep(100000);
		printf("read %u\n", i);
		in.endRead_sync();
		printf("x=%f\n", *data);
	}
	in.destroy();
	return 0;
}
