// Reassemble checked release chunks as the original Godot fetch responses.
(() => {
  const assets = {"index.wasm":{"size":39514754,"parts":[{"path":"../../chunks/637fc7be2e6c8cff1a32a2fd4aed411c05ac1ef10c6a7b925365638f3f0527e2.bin","sha256":"637fc7be2e6c8cff1a32a2fd4aed411c05ac1ef10c6a7b925365638f3f0527e2","size":16777216},{"path":"../../chunks/7aebdd16b11ac91d1fcd39c0923997f5a73a3d17263a6ebf6f4722167d94a0ed.bin","sha256":"7aebdd16b11ac91d1fcd39c0923997f5a73a3d17263a6ebf6f4722167d94a0ed","size":16777216},{"path":"../../chunks/219249da87c3cfda9a89fba24e253e60d6efd5191d0b108120ad93e51e54d707.bin","sha256":"219249da87c3cfda9a89fba24e253e60d6efd5191d0b108120ad93e51e54d707","size":5960322}],"type":"application/wasm"},"index.pck":{"size":194767600,"parts":[{"path":"../../chunks/ed7a5285fe02c8a3b50478e1ebbdaf6cc30c256b2cbab7833d68328b345ff06d.bin","sha256":"ed7a5285fe02c8a3b50478e1ebbdaf6cc30c256b2cbab7833d68328b345ff06d","size":16777216},{"path":"../../chunks/16a5180468672ab1643b796387c490df0907556d71226e9dedbce6f341c438d2.bin","sha256":"16a5180468672ab1643b796387c490df0907556d71226e9dedbce6f341c438d2","size":16777216},{"path":"../../chunks/b59a919ca273e6ce3c6cfbab274f2c4c03a8d89ef147375bed6e33c3245dff66.bin","sha256":"b59a919ca273e6ce3c6cfbab274f2c4c03a8d89ef147375bed6e33c3245dff66","size":16777216},{"path":"../../chunks/8b27dfac5dacf3d6e128823eff370411b4583927a6db10bfa623baeab9dd7a19.bin","sha256":"8b27dfac5dacf3d6e128823eff370411b4583927a6db10bfa623baeab9dd7a19","size":16777216},{"path":"../../chunks/67132448c64e1a67237c638f9ce0a53c695b2672d37657cad23c2102570324cc.bin","sha256":"67132448c64e1a67237c638f9ce0a53c695b2672d37657cad23c2102570324cc","size":16777216},{"path":"../../chunks/ef8427f2894bc6e705ea23a80ccbbc489a67d60af498748ee15203e264c7a722.bin","sha256":"ef8427f2894bc6e705ea23a80ccbbc489a67d60af498748ee15203e264c7a722","size":16777216},{"path":"../../chunks/3b19ad745558cdb379aa9cd19e802dcb5b7f239bf04ec89a36b1a2db060ace5e.bin","sha256":"3b19ad745558cdb379aa9cd19e802dcb5b7f239bf04ec89a36b1a2db060ace5e","size":16777216},{"path":"../../chunks/7dfcc2236c7ce0cfb02258a3baab76d736ab6705de5f35c732c87de3b1782071.bin","sha256":"7dfcc2236c7ce0cfb02258a3baab76d736ab6705de5f35c732c87de3b1782071","size":16777216},{"path":"../../chunks/321ffef28beed4c9b93f46a03c282b7257b490f940a5708caadaff6089c135a7.bin","sha256":"321ffef28beed4c9b93f46a03c282b7257b490f940a5708caadaff6089c135a7","size":16777216},{"path":"../../chunks/30c76b6934d20e34c33e19ab92b8e8c4abc3527c5841789980d4e5e6c284b0e9.bin","sha256":"30c76b6934d20e34c33e19ab92b8e8c4abc3527c5841789980d4e5e6c284b0e9","size":16777216},{"path":"../../chunks/e48a93b238540c1aded9367f9e7d540d55d792ec1b5d68acb2e46df196797a15.bin","sha256":"e48a93b238540c1aded9367f9e7d540d55d792ec1b5d68acb2e46df196797a15","size":16777216},{"path":"../../chunks/9f090d0d9177a2fe2834ba5cca269d41446ed3b7be5bc4e81a588b0ce219e318.bin","sha256":"9f090d0d9177a2fe2834ba5cca269d41446ed3b7be5bc4e81a588b0ce219e318","size":10218224}],"type":"application/octet-stream"}};
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
