import { describe, expect, it } from 'vitest'
import { TestScheduler } from 'rxjs/testing'
import { createSearchPipeline } from './search-pipeline'

/** Marble tests: o tempo é virtual — cada caractere do diagrama é 1 ms. */
const scheduler = () => new TestScheduler((actual, expected) => expect(actual).toEqual(expected))

describe('createSearchPipeline', () => {
  it('só emite depois que o usuário para de digitar (debounce)', () => {
    scheduler().run(({ cold, expectObservable }) => {
      const typing = cold('a-b-c 10ms |', { a: 'a', b: 'al', c: 'alu' })
      // 3 teclas em 5 ms; emite "alu" 5 ms após a última tecla (4 + 5 = frame 9)
      expectObservable(createSearchPipeline(typing, { debounceMs: 5 })).toBe('---------c 5ms |', { c: 'alu' })
    })
  })

  it('normaliza espaços e não repete o mesmo termo efetivo', () => {
    scheduler().run(({ cold, expectObservable }) => {
      const typing = cold('a 9ms b 9ms c 9ms |', { a: 'pix', b: ' pix ', c: 'pix ted' })
      expectObservable(createSearchPipeline(typing, { debounceMs: 5 })).toBe('5ms a 19ms c 4ms |', { a: 'pix', c: 'pix ted' })
    })
  })

  it('limpar o campo emite string vazia (remove o filtro)', () => {
    scheduler().run(({ cold, expectObservable }) => {
      const typing = cold('a 9ms b 9ms |', { a: 'luz', b: '' })
      expectObservable(createSearchPipeline(typing, { debounceMs: 5 })).toBe('5ms a 9ms b 4ms |', { a: 'luz', b: '' })
    })
  })
})
