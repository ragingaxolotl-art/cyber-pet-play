// Reassemble checked release chunks as the original Godot fetch responses.
(() => {
  let assetsReady;
  async function loadAssets() {
    const response = await nativeFetch(new URL("https://raw.githubusercontent.com/ragingaxolotl-art/cyber-pet-play/818c9af6b38391d0e40ccbdcb610de824b799e47/manifests/123ab3ebe5e5f7996a2a9d3f36d49b62edfae69a783d16be1fc6d187a8461a6e.json", base));
    if (!response.ok) throw Error('Could not load game details. Please reload.');
    const metadata = await response.json();
    if (metadata.format !== 2) throw Error('Invalid game details.');
    for (const asset of Object.values(metadata.assets)) {
      asset.parts = asset.parts.map(([index, offset, length]) => {
        const [directory, sha256, size] = metadata.chunks[index];
        return {path: metadata.bases[directory] + sha256 + '.bin', sha256, size, offset, length};
      });
    }
    return metadata.assets;
  }
  const nativeFetch = window.fetch.bind(window);
  const base = new URL('.', document.baseURI);
  window.fetch = async (input, options) => {
    assetsReady ||= loadAssets();
    const assets = await assetsReady;
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, base);
    const name = Object.keys(assets).find(name => new URL(name, base).href === url.href);
    if (!name) return nativeFetch(input, options);
    const asset = assets[name];
    let next = 0;
    const signal = options?.signal || (input instanceof Request ? input.signal : undefined);
    const downloads = new Map();
    const remaining = new Map();
    for (const part of asset.parts) remaining.set(part.sha256, (remaining.get(part.sha256) || 0) + 1);
    const abort = new AbortController();
    const cancel = () => abort.abort();
    if (signal?.aborted) cancel();
    else signal?.addEventListener('abort', cancel, {once: true});
    const finish = () => signal?.removeEventListener('abort', cancel);
    // Share verified bytes across slices. Release each chunk after its last use.
    // Four parts ahead overlap network latency without downloading the whole pack
    // concurrently. Settled results prevent unhandled prefetch rejections.
    function download(part) {
      if (!downloads.has(part.sha256)) {
        downloads.set(part.sha256, (async () => {
          const response = await nativeFetch(new URL(part.path, base), {signal: abort.signal});
          if (!response.ok) throw Error('Game download failed. Please reload to try again.');
          const data = await response.arrayBuffer();
          const digest = await crypto.subtle.digest('SHA-256', data);
          const hash = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
          if (data.byteLength !== part.size || hash !== part.sha256) throw Error('Game download was incomplete. Please reload.');
          return data;
        })().then(data => ({data}), error => ({error})));
      }
      return downloads.get(part.sha256);
    }
    const body = new ReadableStream({
      async pull(controller) {
        try {
          if (next === asset.parts.length) { finish(); controller.close(); return; }
          for (let index = next; index < Math.min(next + 4, asset.parts.length); index++) download(asset.parts[index]);
          const part = asset.parts[next++];
          const result = await download(part);
          if (result.error) throw result.error;
          abort.signal.throwIfAborted();
          const data = result.data;
          const offset = part.offset ?? 0, length = part.length ?? data.byteLength;
          if (data.byteLength !== part.size || !Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length <= 0 || offset + length > data.byteLength) throw Error('Invalid game download slice.');
          const uses = remaining.get(part.sha256) - 1;
          remaining.set(part.sha256, uses);
          if (!uses) downloads.delete(part.sha256);
          controller.enqueue(new Uint8Array(data, offset, length));
        } catch (error) { cancel(); finish(); downloads.clear(); controller.error(error); }
      },
      cancel() { cancel(); finish(); downloads.clear(); }
    });
    return new Response(body, {headers: {'Content-Type': asset.type, 'Content-Length': String(asset.size)}});
  };
})();
