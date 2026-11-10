"""Check every published file and all redirected historical chunk references."""
from pathlib import Path
import json, os, re, subprocess, sys
root = Path(__file__).resolve().parents[1]
output = Path(sys.argv[1]).resolve()
revision = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=root, text=True).strip()
repository = os.environ.get('GITHUB_REPOSITORY', 'ragingaxolotl-art/cyber-pet-play')
base = f'https://raw.githubusercontent.com/{repository}/{revision}/chunks/'
tracked = set(filter(None, subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0')))
expected = {name for name in tracked if not name.startswith(('chunks/', '.github/', 'scripts/'))}
actual = {str(path.relative_to(output)) for path in output.rglob('*') if path.is_file()}
assert actual == expected, f'Published file inventory differs: {actual ^ expected}'
rewritten = 0
referenced = set()
for name in sorted(expected):
    original = (root / name).read_bytes()
    published = (output / name).read_bytes()
    allowed = original.replace(b'../../chunks/', base.encode()) if Path(name).suffix in {'.html', '.js', '.json'} else original
    expression = b'metadata.bases[directory] + sha256'
    redirect = b"metadata.bases[directory].replace('../../' + 'chunks/', '" + base.encode() + b"') + sha256"
    if name.endswith('/asset-loader.js'):
        allowed = allowed.replace(expression, redirect)
    assert published == allowed, f'Unexpected change: {name}'
    if published != original:
        rewritten += 1
        assert b'../../chunks/' not in published, name
        # The rewrite is reversible; hashes, sizes, offsets, and all code stay intact.
        assert published.replace(redirect, expression).replace(base.encode(), b'../../chunks/') == original, name
        for digest in re.findall(rb'\.\./\.\./chunks/([a-f0-9]{64})\.bin', original):
            referenced.add(digest.decode())
        if name.endswith('release.json'):
            metadata = json.loads(original)
            for row in metadata.get('chunks', []):
                if metadata['bases'][row[0]] == '../../chunks/':
                    referenced.add(row[1])
for digest in referenced:
    assert f'chunks/{digest}.bin' in tracked, f'Missing historical chunk {digest}'
assert not (output / 'chunks').exists()
size = sum((output / name).stat().st_size for name in actual)
assert size < 900_000_000, size
print(json.dumps({'verifiedFiles': len(actual), 'rewrittenFiles': rewritten, 'verifiedChunkReferences': len(referenced), 'bytes': size, 'revision': revision}))
