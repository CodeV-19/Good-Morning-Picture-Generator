const UPSTREAM = 'https://codev-19.github.io/Good-Morning-Picture-Generator';
const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
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
    return new Response(JSON.stringify({ error: 'File too large' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  let formData;
  try {
    formData = await request.formData();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid form data' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const file = formData.get('photo');
  if (!file || typeof file === 'string') {
    return new Response(JSON.stringify({ error: 'Missing photo' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
  if (!ALLOWED_TYPES.includes(file.type)) {
    return new Response(JSON.stringify({ error: 'Unsupported file type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }
  if (file.size > MAX_FILE_BYTES) {
    return new Response(JSON.stringify({ error: 'File too large' }), {
      status: 413,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    });
  }

  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const id = crypto.randomUUID();
  const key = `pending/${id}.${ext}`;

  await env.PHOTOS_BUCKET.put(key, file.stream(), {
    httpMetadata: { contentType: file.type },
  });

  return new Response(JSON.stringify({ id, key }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
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
};
