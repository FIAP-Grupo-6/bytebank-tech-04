/**
 * Logout sem carregar `next-auth/react` nesta zona (~30 kB a menos no bundle).
 * O endpoint do NextAuth vive no HOST (mesma origem via proxy): pedimos o
 * token CSRF e fazemos o POST de signout, exatamente como o client oficial.
 */
export async function signOutViaHost(callbackUrl = '/login'): Promise<void> {
  try {
    const { csrfToken } = (await fetch('/api/auth/csrf', { credentials: 'same-origin' }).then((r) => r.json())) as {
      csrfToken: string
    }
    await fetch('/api/auth/signout', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ csrfToken, callbackUrl, json: 'true' }),
    })
  } finally {
    window.location.href = callbackUrl
  }
}
