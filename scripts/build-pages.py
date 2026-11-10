"""Build Pages while preserving historical chunks in their pinned Git revision.

Only existing chunk URLs change in the published copy. Source files, saved
versions, chunk hashes, engine code, and artwork remain in the repository.
"""
from pathlib import Path
import json
import os
import subprocess
import sys

root = Path(__file__).resolve().parents[1]
revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
repository = os.environ.get('GITHUB_REPOSITORY', 'ragingaxolotl-art/cyber-pet-play')
base = f'https://raw.githubusercontent.com/{repository}/{revision}/chunks/'
output = Path(sys.argv[1]).resolve()
if output.exists():
    raise SystemExit('Output must be a new dedicated build directory')
if output == root or root in output.parents:
    raise SystemExit('Build outside the source checkout')
paths = subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0')
output.mkdir(parents=True)
changed = []
total = 0
count = 0
for name in filter(None, paths):
    if name.startswith(('chunks/', '.github/', 'scripts/')):
        continue
    source = root / name
    if source.is_symlink() or not source.is_file():
        raise SystemExit('Missing or unsupported source: ' + name)
    original = source.read_bytes()
    data = original
    if source.suffix in {'.html', '.js', '.json'}:
        data = data.replace(b'../../chunks/', base.encode())
    # Pinned external manifests also contain relative bases. Redirect those at
    # use time, preserving already-external URLs and hash-checked metadata.
    if name.endswith('/asset-loader.js'):
        data = data.replace(
            b'metadata.bases[directory] + sha256',
            b"metadata.bases[directory].replace('../../' + 'chunks/', '"
            + base.encode() + b"') + sha256",
        )
    target = output / name
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    total += len(data)
    count += 1
    if data != original:
        changed.append(name)
if total > 900_000_000:
    raise SystemExit(f'Pages payload must stay below 900 MB: {total}')
print(json.dumps({
    'revision': revision, 'files': count, 'bytes': total,
    'rewritten': changed, 'chunkBase': base,
}, indent=2))
