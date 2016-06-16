#include <pgcc-script.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>


float* data = 0;

int main(int argc, char const *argv[]) {
	PgccLinkOut out;
	data = out.init_shm("writer_reader", data, SYNC);
	*data = 0;
	for(int i=0; i<1000; i++) {
		out.startWrite_sync();
		usleep(100000);
		printf("write %u\n", i);
		*data += 0.01;
		out.endWrite_sync();
		printf("x=%f\n", *data);
	}
	out.destroy();
	return 0;
}
