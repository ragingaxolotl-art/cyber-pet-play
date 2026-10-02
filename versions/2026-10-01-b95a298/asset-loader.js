// Reassemble checked release chunks as the original Godot fetch responses.
(() => {
  const assets = {"index.wasm":{"size":37902138,"parts":[{"path":"../../chunks/749aaa39cc88b1e48e463bab3b414025d22a0efe3d80ed0ee4e201f75c45bd49.bin","sha256":"749aaa39cc88b1e48e463bab3b414025d22a0efe3d80ed0ee4e201f75c45bd49","size":16777216},{"path":"../../chunks/6948ae05aa26b3f091dddccf99361028bd890b6207360224b184987e2692bfd7.bin","sha256":"6948ae05aa26b3f091dddccf99361028bd890b6207360224b184987e2692bfd7","size":16777216},{"path":"../../chunks/c508336f810fa0a6813368e1f2dd10d31ae934a5f959122cd86573f18e643008.bin","sha256":"c508336f810fa0a6813368e1f2dd10d31ae934a5f959122cd86573f18e643008","size":4347706}],"type":"application/wasm"},"index.pck":{"size":176635552,"parts":[{"path":"../../chunks/5d81d64af49954e69e017b24524d82ea897f3d77c4841daaa77e2266af87bb79.bin","sha256":"5d81d64af49954e69e017b24524d82ea897f3d77c4841daaa77e2266af87bb79","size":16777216},{"path":"../../chunks/16a5180468672ab1643b796387c490df0907556d71226e9dedbce6f341c438d2.bin","sha256":"16a5180468672ab1643b796387c490df0907556d71226e9dedbce6f341c438d2","size":16777216},{"path":"../../chunks/b59a919ca273e6ce3c6cfbab274f2c4c03a8d89ef147375bed6e33c3245dff66.bin","sha256":"b59a919ca273e6ce3c6cfbab274f2c4c03a8d89ef147375bed6e33c3245dff66","size":16777216},{"path":"../../chunks/8b27dfac5dacf3d6e128823eff370411b4583927a6db10bfa623baeab9dd7a19.bin","sha256":"8b27dfac5dacf3d6e128823eff370411b4583927a6db10bfa623baeab9dd7a19","size":16777216},{"path":"../../chunks/67132448c64e1a67237c638f9ce0a53c695b2672d37657cad23c2102570324cc.bin","sha256":"67132448c64e1a67237c638f9ce0a53c695b2672d37657cad23c2102570324cc","size":16777216},{"path":"../../chunks/ef8427f2894bc6e705ea23a80ccbbc489a67d60af498748ee15203e264c7a722.bin","sha256":"ef8427f2894bc6e705ea23a80ccbbc489a67d60af498748ee15203e264c7a722","size":16777216},{"path":"../../chunks/3b19ad745558cdb379aa9cd19e802dcb5b7f239bf04ec89a36b1a2db060ace5e.bin","sha256":"3b19ad745558cdb379aa9cd19e802dcb5b7f239bf04ec89a36b1a2db060ace5e","size":16777216},{"path":"../../chunks/7dfcc2236c7ce0cfb02258a3baab76d736ab6705de5f35c732c87de3b1782071.bin","sha256":"7dfcc2236c7ce0cfb02258a3baab76d736ab6705de5f35c732c87de3b1782071","size":16777216},{"path":"../../chunks/537f3d50422fd92363754ac2b6a8317ffa56229ee4a21006f53787b4e4552908.bin","sha256":"537f3d50422fd92363754ac2b6a8317ffa56229ee4a21006f53787b4e4552908","size":16777216},{"path":"../../chunks/d376bd3c2a890509d56bd2375405a329106287bc58903eff7613de5e91ad5cd6.bin","sha256":"d376bd3c2a890509d56bd2375405a329106287bc58903eff7613de5e91ad5cd6","size":16777216},{"path":"../../chunks/0025bdc9197be3ec54a25b0094f56429618c8edcb83b08779714f291086d9e90.bin","sha256":"0025bdc9197be3ec54a25b0094f56429618c8edcb83b08779714f291086d9e90","size":8863392}],"type":"application/octet-stream"}};
  const nativeFetch = window.fetch.bind(window);
  const base = new URL('.', document.baseURI);
  window.fetch = async (input, options) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, base);
    const name = Object.keys(assets).find(name => new URL(name, base).href === url.href);
    if (!name) return nativeFetch(input, options);
    const asset = assets[name];
    let next = 0;
    const signal = options?.signal || (input instanceof Request ? input.signal : undefined);
    const body = new ReadableStream({
      async pull(controller) {
        try {
          if (next === asset.parts.length) { controller.close(); return; }
          const part = asset.parts[next++];
          const response = await nativeFetch(new URL(part.path, base), {signal});
          if (!response.ok) throw Error('Game download failed. Please reload to try again.');
          const data = await response.arrayBuffer();
          const digest = await crypto.subtle.digest('SHA-256', data);
          const hash = Array.from(new Uint8Array(digest), n => n.toString(16).padStart(2, '0')).join('');
          if (data.byteLength !== part.size || hash !== part.sha256) throw Error('Game download was incomplete. Please reload.');
          controller.enqueue(new Uint8Array(data));
        } catch (error) { controller.error(error); }
      }
    });
    return new Response(body, {headers: {'Content-Type': asset.type, 'Content-Length': String(asset.size)}});
  };
})();
