const UPSTREAM = 'https://codev-19.github.io/Good-Morning-Picture-Generator';
const MAX_FILE_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

const R2_FREE_STORAGE_BYTES = 10 * 1024 * 1024 * 1024;
const STORAGE_CAP_RATIO = 0.8;
const STORAGE_CAP_BYTES = R2_FREE_STORAGE_BYTES * STORAGE_CAP_RATIO;
const USAGE_KV_KEY = 'usage:totalBytes';

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

function jsonResponse(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}

async function getCachedUsageBytes(env) {
  const raw = await env.USAGE_KV.get(USAGE_KV_KEY);
  return raw ? Number(raw) : 0;
}

async function recomputeUsageBytes(env) {
  let totalBytes = 0;
  let cursor;
  do {
    const listing = await env.PHOTOS_BUCKET.list({ cursor, limit: 1000 });
    for (const obj of listing.objects) totalBytes += obj.size;
    cursor = listing.truncated ? listing.cursor : undefined;
  } while (cursor);
  await env.USAGE_KV.put(USAGE_KV_KEY, String(totalBytes));
  return totalBytes;
}

async function handleUpload(request, env) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders() });
  }
  if (request.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405, headers: corsHeaders() });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_FILE_BYTES) {
    return jsonResponse({ error: 'file_too_large', message: '照片檔案太大，請壓縮後再試（上限 3MB）' }, 413);
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    return jsonResponse({ error: 'invalid_form_data' }, 400);
  }

  const file = formData.get('photo');
  if (!file || typeof file === 'string') {
    return jsonResponse({ error: 'missing_photo' }, 400);
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return jsonResponse({ error: 'unsupported_file_type' }, 400);
  }
  if (file.size > MAX_FILE_BYTES) {
    return jsonResponse({ error: 'file_too_large', message: '照片檔案太大，請壓縮後再試（上限 3MB）' }, 413);
  }

  // Cheap cache read -- refreshed daily by the scheduled handler below,
  // plus optimistically bumped after every accepted upload so a burst of
  // submissions on the same day doesn't overshoot before the next refresh.
  const cachedUsage = await getCachedUsageBytes(env);
  if (cachedUsage + file.size > STORAGE_CAP_BYTES) {
    return jsonResponse({
      error: 'storage_cap_reached',
      message: '目前投稿空間已達上限，暫時無法接受新的照片投稿，請稍後再試',
    }, 507);
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const id = crypto.randomUUID();
  const key = `pending/${id}.${ext}`;

  await env.PHOTOS_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  await env.USAGE_KV.put(USAGE_KV_KEY, String(cachedUsage + file.size));

  return jsonResponse({ id, key }, 200);
}

async function handleProxy(request) {
  const url = new URL(request.url);
  const target = `${UPSTREAM}${url.pathname}${url.search}`;

  const upstreamResponse = await fetch(target, {
    method: request.method,
    headers: {
      Accept: request.headers.get('Accept') || '*/*',
      'Accept-Language': request.headers.get('Accept-Language') || '',
      'User-Agent': request.headers.get('User-Agent') || '',
    },
    redirect: 'follow',
  });

  const headers = new Headers(upstreamResponse.headers);
  headers.delete('content-security-policy');
  headers.delete('x-frame-options');

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers,
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/upload-photo') {
      return handleUpload(request, env);
    }
    return handleProxy(request);
  },

  // Cloudflare Cron Trigger (configure daily, e.g. "0 3 * * *") keeps the
  // cached usage figure honest -- corrects any drift from the optimistic
  // per-upload bump above, and reflects photos removed by the review app.
  async scheduled(event, env) {
    await recomputeUsageBytes(env);
  },
};
