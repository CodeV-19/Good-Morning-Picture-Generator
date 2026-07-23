import fs from 'fs';
import path from 'path';

const API_KEY = process.env.PEXELS_API_KEY;
const OUT_DIR = path.join('images', 'flowers');
const COUNT = 20;
const QUERY = 'flower';
const MAX_PAGE = 50;
const PER_PAGE = 80;

async function main() {
  if (!API_KEY) throw new Error('Missing PEXELS_API_KEY environment variable');

  const page = Math.floor(Math.random() * MAX_PAGE) + 1;
  const searchUrl = `https://api.pexels.com/v1/search?query=${encodeURIComponent(QUERY)}&per_page=${PER_PAGE}&page=${page}&orientation=square`;
  const res = await fetch(searchUrl, { headers: { Authorization: API_KEY } });
  if (!res.ok) throw new Error(`Pexels API error: ${res.status} ${res.statusText}`);
  const data = await res.json();
  const photos = data.photos || [];
  if (photos.length === 0) throw new Error('Pexels returned no photos');

  const picked = photos.sort(() => Math.random() - 0.5).slice(0, COUNT);

  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const f of fs.readdirSync(OUT_DIR)) {
    if (f.endsWith('.jpg')) fs.unlinkSync(path.join(OUT_DIR, f));
  }

  const manifest = [];
  for (let i = 0; i < picked.length; i++) {
    const photo = picked[i];
    const imgRes = await fetch(photo.src.large);
    if (!imgRes.ok) continue;
    const buf = Buffer.from(await imgRes.arrayBuffer());
    const filename = `flower-${String(i + 1).padStart(2, '0')}.jpg`;
    fs.writeFileSync(path.join(OUT_DIR, filename), buf);
    manifest.push({ file: filename, photographer: photo.photographer, pexelsUrl: photo.url });
  }

  if (manifest.length === 0) throw new Error('Failed to download any photos');

  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`Saved ${manifest.length} flower photos to ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
