#!/bin/bash

# "Press any key to quit" handler
function quit {
	procs=`ps -o pid --no-headers --ppid $$`
	for proc in $procs; do
		kill -s INT $proc 2>/dev/null
	done
	echo
	exit 0
}
trap quit SIGINT SIGTERM SIGHUP EXIT


# Launch all processes
for i in `ls processes`; do
	./processes/$i &
done


# Wait for a keypress to quit
read -n1 -r
