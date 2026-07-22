const sessionToken = document.querySelector('meta[name="buildr-session"]').content;

export async function api(resource, options = {}) {
  const response = await fetch(resource, {
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json', 'x-buildr-session': sessionToken } : {}),
      ...(options.headers || {}),
    },
  });
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error?.message || 'Buildr 请求失败。');
    error.code = body.error?.code;
    error.details = body.error?.details;
    throw error;
  }
  return body;
}
