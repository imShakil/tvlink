#!/bin/sh

wget -O bdixtv247.m3u8 https://bdixtv247.techpriyo.com/m3u/play32.php?e=.m3u

sed -i '1,3d' bdixtv247.m3u8
