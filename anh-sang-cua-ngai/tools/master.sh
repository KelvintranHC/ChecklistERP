#!/bin/sh
# Master: two-pass loudnorm to -14 LUFS / TP -1.2 dB and mux, same settings as $LIB/core/render/mux.sh (no grain).
# (mux.sh's "decoded duration" check misreads this short file — ffmpeg's last progress line lags ~3 s — so we master here.)
set -e
V=$1; A=$2; O=$3
J=$(ffmpeg -nostdin -hide_banner -i "$A" -af loudnorm=I=-14:TP=-1.2:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p')
g() { echo "$J" | grep "\"$1\"" | sed 's/.*: "\(.*\)".*/\1/'; }
LN="loudnorm=I=-14:TP=-1.2:LRA=11:measured_I=$(g input_i):measured_TP=$(g input_tp):measured_LRA=$(g input_lra):measured_thresh=$(g input_thresh):offset=$(g target_offset):linear=true"
ffmpeg -nostdin -y -loglevel error -i "$V" -i "$A" -filter_complex "[0:v]fps=24,format=yuv420p[v];[1:a]$LN,aresample=48000[a]" \
  -map "[v]" -map "[a]" -c:v libx264 -preset slow -crf 19 -r 24 -c:a aac -b:a 256k -movflags +faststart -shortest "$O"
ffmpeg -hide_banner -nostats -i "$O" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|LRA|Peak):" | head -3
