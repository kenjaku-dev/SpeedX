fetch('http://localhost:3000/api/download?size=1')
  .then(async (res) => {
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    const buf = await res.arrayBuffer();
    console.log("Downloaded Size (Bytes):", buf.byteLength);
  })
  .catch(err => {
    console.error("Fetch failed:", err);
  });
