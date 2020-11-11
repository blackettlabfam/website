#!/bin/bash

find -type f \! -name '*.map' | xargs du -b | perl -e '$s=0; while(<>) {/^(\d+)/; $s+=$1;} $kb=$s/1000; print $kb."KB\n";'
