'use client'

import { useEffect, useRef, useState } from 'react'
import { Subject, type Observable } from 'rxjs'

/**
 * Ponte RxJS ↔ React.
 * - `useObservableValue`: assina um Observable e expõe o último valor como estado.
 * - `useSubjectCallback`: cria um Subject estável + callback para empurrar
 *   eventos, e assina o stream derivado; a assinatura é encerrada no unmount
 *   (sem vazamento de memória nem setState após desmontar).
 */
export function useObservableValue<T>(factory: () => Observable<T>, initial: T): T {
  const [value, setValue] = useState(initial)
  useEffect(() => {
    const sub = factory().subscribe(setValue)
    return () => sub.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return value
}

export function useSubjectCallback<T, R>(
  pipeline: (source$: Observable<T>) => Observable<R>,
  onValue: (value: R) => void
): (value: T) => void {
  const subjectRef = useRef<Subject<T>>()
  subjectRef.current ??= new Subject<T>()
  const onValueRef = useRef(onValue)
  onValueRef.current = onValue

  useEffect(() => {
    const subject = subjectRef.current!
    const sub = pipeline(subject.asObservable()).subscribe((v) => onValueRef.current(v))
    return () => sub.unsubscribe()
    // o pipeline é definido uma vez por componente
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (value: T) => subjectRef.current!.next(value)
}
