#!/usr/bin/env bash
set -euo pipefail
src_dir="$(cd "$(dirname "$0")" && pwd)"
out_dir="$(cd "$src_dir/.." && pwd)"
page="file://$src_dir/index.html"
chrome="${CHROME_BIN:-/usr/bin/google-chrome}"
"$chrome" --headless --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1600,900 --screenshot="$out_dir/titans-ventures-strategic-investment-magne-ai-en-1600x900.png" "$page"
"$chrome" --headless --no-sandbox --disable-gpu --hide-scrollbars --force-device-scale-factor=1 --window-size=1080,1080 --screenshot="$out_dir/titans-ventures-strategic-investment-magne-ai-en-1080x1080.png" "$page"
