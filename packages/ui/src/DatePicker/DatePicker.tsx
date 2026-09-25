'use client'

import * as React from 'react'
import * as PopoverPrimitive from '@radix-ui/react-popover'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { cn } from '../cn'

/**
 * Lazy loading: o calendário (react-day-picker) só é necessário quando o
 * popover abre. Ele sai do bundle inicial de quem usa o DatePicker e é
 * pré-carregado no hover/foco do gatilho — ao clicar, já está pronto.
 */
const loadCalendar = () => import('./Calendar').then((m) => ({ default: m.Calendar }))
const LazyCalendar = React.lazy(loadCalendar)
const preloadCalendar = () => void loadCalendar()

function CalendarFallback() {
  return <div className="w-[280px] h-[300px] p-3" aria-busy="true" aria-label="Carregando calendário" />
}

export interface DatePickerProps {
  label?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  error?: string
  disabled?: boolean
  id?: string
  className?: string
}

export function DatePicker({
  label,
  placeholder = 'Selecionar data',
  value,
  onChange,
  error,
  disabled,
  id: idProp,
  className,
}: DatePickerProps) {
  const autoId = React.useId()
  const id = idProp ?? autoId
  const errorId = `${id}-error`

  const selected = value ? new Date(`${value}T12:00:00`) : undefined

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date ? format(date, 'yyyy-MM-dd') : '')
  }

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-foreground/80 block mb-1.5">
          {label}
        </label>
      )}

      <PopoverPrimitive.Root>
        <PopoverPrimitive.Trigger asChild>
          <button
            id={id}
            type="button"
            disabled={disabled}
            onMouseEnter={preloadCalendar}
            onFocus={preloadCalendar}
            onTouchStart={preloadCalendar}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
              'focus:outline-none focus:ring-2 focus:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50',
              !selected && 'text-muted-foreground',
              error && 'border-destructive'
            )}
          >
            {selected
              ? format(selected, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
              : placeholder}
            <CalendarIcon className="h-4 w-4 opacity-50 shrink-0" />
          </button>
        </PopoverPrimitive.Trigger>

        <PopoverPrimitive.Portal>
          <PopoverPrimitive.Content
            align="start"
            className={cn(
              'z-50 rounded-md border border-border bg-card shadow-md outline-none',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              'data-[side=bottom]:slide-in-from-top-2'
            )}
          >
            <React.Suspense fallback={<CalendarFallback />}>
              <LazyCalendar mode="single" selected={selected} onSelect={handleSelect} initialFocus />
            </React.Suspense>
          </PopoverPrimitive.Content>
        </PopoverPrimitive.Portal>
      </PopoverPrimitive.Root>

      {error && (
        <p id={errorId} role="alert" className="text-xs text-destructive mt-1.5">
          {error}
        </p>
      )}
    </div>
  )
}
