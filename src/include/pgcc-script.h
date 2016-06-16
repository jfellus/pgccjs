#include <stdlib.h>
#include <fcntl.h>
#include <sys/stat.h>
#include <semaphore.h>
#include <sys/mman.h>
#include <stdio.h>
#include <errno.h>
#include <string.h>
#include <unistd.h>


enum PgccLinkMode {	SYNC, ASYNC };

//////////////////////
// HELPER FUNCTIONS //
//////////////////////

inline sem_t* create_read_semaphore(const char* channel) {
	char semname[251];
	snprintf(semname, 251, "/semr_%s", channel);
	sem_t* s = sem_open(semname, O_CREAT, S_IRWXU, 0);
	if(!s) { fprintf(stderr, "Semaphore error for channel %s : %s\n", channel, strerror(errno)); exit(-1); }
	return s;
}

inline sem_t* create_write_semaphore(const char* channel) {
	char semname[251];
	snprintf(semname, 251, "/semw_%s", channel);
	sem_t* s = sem_open(semname, O_CREAT, S_IRWXU, 0);
	if(!s) { fprintf(stderr, "Semaphore error for channel %s : %s\n", channel, strerror(errno)); exit(-1); }
	return s;
}

inline void* create_shared_memory(const char* channel, void* variable, size_t size) {
	char name[251];
	snprintf(name, 251, "/%s", channel);
	int fd = shm_open(name, O_CREAT | O_RDWR, S_IRWXU);
	if (fd==-1 || ftruncate(fd, size) == -1) { fprintf(stderr, "Shared memory error for channel %s : %s\n", channel, strerror(errno)); exit(-1); }
	void* buf = mmap(NULL, size, PROT_READ | PROT_WRITE, MAP_SHARED, fd, (off_t)0);
	if(buf==(void*)-1) { fprintf(stderr, "Shared memory error for channel %s : %s\n", channel, strerror(errno)); exit(-1); }
	return buf;
}

inline void sem_reset(sem_t* sem) {
	int a = 0;
	sem_getvalue(sem, &a);
	while(a-->0) sem_wait(sem);
}


////////////////
// PGCC LINKS //
////////////////

class PgccLinkOut {
private:
	sem_t* sem_write;
	sem_t* sem_read;
	size_t size;
	void* buf;

public:
	PgccLinkOut() {	buf = 0; sem_write = sem_read = 0; }

	template <typename T> T* init_shm(const char* channel, T* variable, PgccLinkMode mode = SYNC) {	return (T*) init_shm_buffer(channel, variable, sizeof(T), mode); }
	inline void* init_shm_buffer(const char* channel, void* variable, size_t size, PgccLinkMode mode = SYNC) {
		if(mode == SYNC) {
			sem_read = create_read_semaphore(channel);
			sem_write = create_write_semaphore(channel);
			sem_reset(sem_write);
			sem_post(sem_write);
		}
		buf = create_shared_memory(channel, variable, size);
		this->size = size;
		return buf;
	}

	inline void destroy() {
		if(sem_write) sem_close(sem_write);
		if(sem_read) sem_close(sem_read);
 	}

	inline void startWrite_sync() { sem_wait(sem_write); }
	inline void endWrite_sync() { sem_post(sem_read); }
	inline void startWrite_async() { }
	inline void endWrite_async() { }
};

class PgccLinkIn {
private:
	sem_t* sem_write;
	sem_t* sem_read;
	void* buf;
	size_t size;

public:
	PgccLinkIn() { buf = 0;	sem_write = sem_read = 0; }

	template <typename T> T* init_shm(const char* channel, T* variable, PgccLinkMode mode = SYNC) {	return (T*) init_shm_buffer(channel, variable, sizeof(T), mode); }
	inline void* init_shm_buffer(const char* channel, void* variable, size_t size, PgccLinkMode mode = SYNC) {
		if(mode == SYNC) {
			sem_write = create_write_semaphore(channel);
			sem_read = create_read_semaphore(channel);
			sem_reset(sem_read);
			sem_post(sem_write);
			usleep(100);
			sem_reset(sem_write);
		}
		buf = create_shared_memory(channel, variable, size);
		this->size = size;
		return buf;
	}

	inline void destroy() {
		if(sem_write) sem_close(sem_write);
		if(sem_read) sem_close(sem_read);
	}

	inline void startRead_sync() { sem_wait(sem_read); }
	inline void endRead_sync() { sem_post(sem_write); }
	inline void startRead_async() {}
	inline void endRead_async() {}
};
