import { describe, expect, it } from 'vitest'
import { open, openJson, seal, sealJson, signMessage, verifyMessage } from '../src'

const opts = { secret: 'um-segredo-de-teste-bem-longo', purpose: 'dashboard-settings', context: 'user-1' }

describe('AES-256-GCM (seal/open)', () => {
  it('faz roundtrip e não expõe o texto original', () => {
    const sealed = sealJson({ monthlyLimit: 3000 }, opts)
    expect(sealed).toMatch(/^v1\./)
    expect(sealed).not.toContain('3000')
    expect(openJson(sealed, opts)).toEqual({ monthlyLimit: 3000 })
  })

  it('usa IV aleatório: mesmo texto gera cifras diferentes', () => {
    expect(seal('abc', opts)).not.toBe(seal('abc', opts))
  })

  it('detecta adulteração (tag de autenticação)', () => {
    const [v, iv, tag, ct] = seal('dado sensível', opts).split('.')
    const flipped = Buffer.from(ct!, 'base64url')
    flipped[0] = flipped[0]! ^ 1
    expect(open([v, iv, tag, flipped.toString('base64url')].join('.'), opts)).toBeNull()
  })

  it('valor cifrado para um usuário não abre para outro', () => {
    const sealed = seal('meta: viagem', opts)
    expect(open(sealed, { ...opts, context: 'user-2' })).toBeNull()
  })

  it('valor cifrado para uma finalidade não abre em outra', () => {
    expect(open(seal('x', opts), { ...opts, purpose: 'outra' })).toBeNull()
  })

  it('rejeita segredo fraco e formato inválido', () => {
    expect(() => seal('x', { ...opts, secret: 'curto' })).toThrow()
    expect(open('não-é-um-token', opts)).toBeNull()
  })
})

describe('HMAC com timestamp', () => {
  const secret = 'segredo-compartilhado-entre-zonas'
  it('aceita assinatura válida dentro da janela', () => {
    const { signature, timestamp } = signMessage('user-1', secret)
    expect(verifyMessage('user-1', signature, timestamp, secret)).toBe(true)
  })

  it('rejeita mensagem trocada, segredo errado e replay antigo', () => {
    const now = Date.now()
    const { signature, timestamp } = signMessage('user-1', secret, now)
    expect(verifyMessage('user-2', signature, timestamp, secret, now)).toBe(false)
    expect(verifyMessage('user-1', signature, timestamp, 'outro-segredo', now)).toBe(false)
    expect(verifyMessage('user-1', signature, timestamp, secret, now + 5 * 60_000)).toBe(false)
    expect(verifyMessage('user-1', null, timestamp, secret, now)).toBe(false)
  })
})
