#!/bin/sh
# Rebuild "Ánh Sáng Của Ngài" from scratch: plates -> score -> picture -> mix -> master.
set -e
LIB=${LIB:-$HOME/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the Lemo-Opuscar library folder"; exit 1; }
mkdir -p "$HERE/out"
cd "$LIB"
.venv/bin/python -I "$HERE/tools/preprocess.py" "$HERE"           # storyboard panels -> reference plates + value groups
.venv/bin/python "$HERE/music/score.py"                            # score (sampled CC0 instruments)
node core/render/events.mjs "$HERE"                                # DUR + EV -> events.json
.venv/bin/python "$HERE/mix.py"                                    # foley, beds, true silence -> out/mix.wav
node core/render/video.mjs "$HERE" --fps 24 --workers ${WORKERS:-2} --out "$HERE/out/video.mp4"
sh "$HERE/tools/master.sh" "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/anh-sang-cua-ngai.mp4"
.venv/bin/python core/render/srt.py "$HERE/out/cues.json" "$HERE/anh-sang-cua-ngai.srt"
