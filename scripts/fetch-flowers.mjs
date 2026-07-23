import fs from 'fs';
import path from 'path';

const API_KEY = process.env.PEXELS_API_KEY;
const OUT_DIR = path.join('images', 'flowers');
const COUNT = 20;
const QUERY = 'flower';
const PER_PAGE = 80;
const MAX_PAGE_CEILING = 25;

async function searchPexels(page) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(QUERY)}&per_page=${PER_PAGE}&page=${page}`;
  const res = await fetch(url, { headers: { Authorization: API_KEY } });
  if (!res.ok) throw new Error(`Pexels API error: ${res.status} ${res.statusText}`);
  return res.json();
}

async function main() {
  if (!API_KEY) throw new Error('Missing PEXELS_API_KEY environment variable');

  const firstPage = await searchPexels(1);
  const totalResults = firstPage.total_results || 0;
  if (totalResults === 0 || !(firstPage.photos || []).length) {
    throw new Error('Pexels returned no results for the query');
  }

  const maxPage = Math.min(MAX_PAGE_CEILING, Math.max(1, Math.floor(totalResults / PER_PAGE)));
  const page = Math.floor(Math.random() * maxPage) + 1;
  const data = page === 1 ? firstPage : await searchPexels(page);
  // Fall back to the (known-good) first page if the randomly picked page happens to be empty.
  const photos = (data.photos && data.photos.length > 0) ? data.photos : firstPage.photos;

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
