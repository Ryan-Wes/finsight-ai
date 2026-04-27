import { supabase } from './supabaseClient'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function getAccessTokenWithRetry() {
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token

    if (token) {
      return token
    }

    await wait(150)
  }

  throw new Error('Sessão expirada. Faça login novamente.')
}

export async function authFetch(path, options = {}) {
  const token = await getAccessTokenWithRetry()

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`,
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  })

  if (response.status !== 401) {
    return response
  }

  const { data } = await supabase.auth.refreshSession()
  const refreshedToken = data.session?.access_token

  if (!refreshedToken) {
    return response
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${refreshedToken}`,
    },
  })
}