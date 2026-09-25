'use client'

import { useState, useEffect, useRef } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Loader2, Upload, ImageIcon } from 'lucide-react'
import { cn, Modal, Combobox } from '@bytebank/ui'
import {
  getCategoriesByType,
  getSubcategories,
  normalizeTransactionType,
  MAX_ATTACHMENT_BYTES,
  type Transaction,
  type TransactionInput,
} from '@bytebank/domain'
import { useCreateTransactionMutation, useUpdateTransactionMutation, errorMessage, type ApiErrorBody } from '@/store/api/transactionsApi'
import { formatDecimal } from '@/lib/format'
import { isSafeImageDataUri, formatFileSize, fileToBase64 } from '@/lib/file'

const schema = z.object({
  type: z.enum(['Credit', 'Debit'], { required_error: 'Selecione o tipo' }),
  value: z
    .number({ invalid_type_error: 'Informe o valor' })
    .finite('Informe um valor válido')
    .positive('O valor deve ser positivo'),
  from: z.string().min(1, 'Selecione uma categoria'),
  to: z.string().optional(),
  anexo: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface TransactionModalProps {
  isOpen: boolean
  onClose: () => void
  editTransaction?: Transaction | null
}

const inputClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ' +
  'placeholder:text-muted-foreground ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

const labelClass = 'text-sm font-medium text-foreground/80 block mb-1.5'

const MAX_FILE_SIZE = MAX_ATTACHMENT_BYTES // regra do domínio (5 MB)
const CREATE_DEFAULT_VALUES: FormData = {
  type: 'Credit',
  value: undefined as unknown as number,
  from: '',
  to: '',
  anexo: '',
}

// ─── CurrencyInput ───────────────────────────────────────────────────────────

interface CurrencyInputProps {
  value: number
  onChange: (v: number) => void
  inputRef?: React.RefObject<HTMLInputElement>
  hasError?: boolean
}

function CurrencyInput({ value, onChange, inputRef, hasError }: CurrencyInputProps) {
  const [display, setDisplay] = useState(value > 0 ? formatDecimal(value) : '')

  useEffect(() => {
    setDisplay(value > 0 ? formatDecimal(value) : '')
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '')
    if (!digits) {
      setDisplay('')
      onChange(NaN)
      return
    }
    const cents = parseInt(digits, 10)
    const reais = cents / 100
    setDisplay(formatDecimal(reais))
    onChange(reais)
  }

  return (
    <input
      ref={inputRef}
      id="transaction-value"
      type="text"
      inputMode="decimal"
      placeholder="0,00"
      value={display}
      onChange={handleChange}
      aria-describedby={hasError ? 'value-error' : undefined}
      className={cn(inputClass, hasError && 'border-destructive')}
    />
  )
}

// ─── TransactionModal ────────────────────────────────────────────────────────

export function TransactionModal({
  isOpen,
  onClose,
  editTransaction,
}: TransactionModalProps) {
  const [createTransaction, createState] = useCreateTransactionMutation()
  const [updateTransaction, updateState] = useUpdateTransactionMutation()
  const isSubmitting = createState.isLoading || updateState.isLoading
  const [serverError, setServerError] = useState<string | null>(null)
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number } | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [previewSrc, setPreviewSrc] = useState<string | null>(null)
  const firstInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const isEditing = !!editTransaction

  const {
    register,
    handleSubmit,
    reset,
    watch,
    control,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'Credit', from: '', to: '', anexo: '' },
  })

  const selectedType = watch('type')
  const selectedCategory = watch('from') ?? ''
  const selectedSubcategory = watch('to') ?? ''

  const categories = getCategoriesByType(selectedType)
  const subcategories = getSubcategories(selectedType, selectedCategory)

  const resetCreateState = () => {
    reset(CREATE_DEFAULT_VALUES)
    setFileInfo(null)
    setFileError(null)
    setPreviewSrc(null)
    setServerError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  useEffect(() => {
    if (isOpen) {
      if (editTransaction) {
        const normalizedType = normalizeTransactionType(editTransaction.type)
        const normalizedValue = Number(editTransaction.value)

        reset({
          type: normalizedType,
          value: Number.isFinite(normalizedValue) ? Math.abs(normalizedValue) : (undefined as unknown as number),
          from: editTransaction.from ?? '',
          to: editTransaction.to ?? '',
          anexo: editTransaction.anexo ?? '',
        })
        if (editTransaction.anexo && isSafeImageDataUri(editTransaction.anexo)) {
          setFileInfo({ name: 'Imagem existente', size: 0 })
          setPreviewSrc(editTransaction.anexo)
        } else {
          setFileInfo(null)
          setPreviewSrc(null)
        }
      } else {
        resetCreateState()
      }
      setFileError(null)
      setTimeout(() => firstInputRef.current?.focus(), 50)
    }
  }, [isOpen, editTransaction, reset])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_FILE_SIZE) {
      setFileError('Imagem muito grande (máx. 5 MB)')
      return
    }

    setFileError(null)
    setFileInfo({ name: file.name, size: file.size })

    try {
      const base64 = await fileToBase64(file)
      setValue('anexo', base64)
      setPreviewSrc(base64)
    } catch {
      setFileError('Erro ao processar a imagem')
      setFileInfo(null)
      setPreviewSrc(null)
    }
  }

  const removeFile = () => {
    setFileInfo(null)
    setFileError(null)
    setPreviewSrc(null)
    setValue('anexo', '')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (data: FormData) => {
    setServerError(null)
    // accountId NÃO é enviado: o BFF resolve a conta a partir da sessão.
    const input: TransactionInput = {
      type: data.type,
      value: data.value,
      from: data.from,
      to: data.to,
      anexo: data.anexo,
    }
    try {
      if (isEditing && editTransaction) {
        await updateTransaction({ id: editTransaction.id, input }).unwrap()
      } else {
        await createTransaction(input).unwrap()
      }
      onClose()
    } catch (err: unknown) {
      // 422 do BFF: erros de regra de negócio vindos do domínio, por campo
      const fieldErrors = (err as { data?: ApiErrorBody })?.data?.errors
      fieldErrors?.forEach(({ field, message }) => {
        if (field in schema.shape) setError(field as keyof FormData, { message })
      })
      setServerError(errorMessage(err, 'Erro ao salvar transação'))
    }
  }

  if (!isOpen) return null

  return (
    <Modal onClose={onClose} aria-labelledby="modal-title">
      <div className="relative rounded-lg border bg-card text-card-foreground shadow-sm w-full max-w-md mx-4 p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 id="modal-title" className="text-lg font-semibold text-foreground">
            {isEditing ? 'Editar transação' : 'Nova transação'}
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar modal"
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {/* Tipo */}
          <fieldset>
            <legend className={labelClass}>Tipo</legend>
            <div className="grid grid-cols-2 gap-2" role="radiogroup">
              {(['Credit', 'Debit'] as const).map((type) => (
                <label
                  key={type}
                  className={cn(
                    'flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium',
                    selectedType === type
                      ? type === 'Credit'
                        ? 'border-success bg-success/10 text-success'
                        : 'border-destructive bg-destructive/10 text-destructive'
                      : 'border-border text-muted-foreground hover:border-input'
                  )}
                >
                  <input
                    type="radio"
                    value={type}
                    {...register('type')}
                    onChange={(e) => {
                      register('type').onChange(e)
                      setValue('from', '')
                      setValue('to', '')
                    }}
                    className="sr-only"
                  />
                  {type === 'Credit' ? '↓ Crédito' : '↑ Débito'}
                </label>
              ))}
            </div>
            {errors.type && (
              <p role="alert" className="text-xs text-destructive mt-1">{errors.type.message}</p>
            )}
          </fieldset>

          {/* Valor */}
          <div>
            <label htmlFor="transaction-value" className={labelClass}>Valor (R$)</label>
            <Controller
              name="value"
              control={control}
              render={({ field: { onChange, value } }) => (
                <CurrencyInput
                  value={value ?? 0}
                  onChange={onChange}
                  inputRef={firstInputRef}
                  hasError={!!errors.value}
                />
              )}
            />
            {errors.value && (
              <p id="value-error" role="alert" className="text-xs text-destructive mt-1">
                {errors.value.message}
              </p>
            )}
          </div>

          {/* Categoria / Subcategoria */}
          <div className="grid grid-cols-2 gap-3">
            {/* Categoria — obrigatória */}
            <div>
              <div className="h-6 flex items-center mb-1.5">
                <span className="text-sm font-medium text-foreground/80">
                  Categoria <span className="text-destructive" aria-hidden="true">*</span>
                </span>
              </div>
              <Controller
                name="from"
                control={control}
                render={({ field }) => (
                  <Combobox
                    id="transaction-category"
                    placeholder="Selecione..."
                    searchPlaceholder="Buscar categoria..."
                    emptyText="Nenhuma categoria encontrada."
                    value={field.value || undefined}
                    onValueChange={(val) => {
                      field.onChange(val)
                      setValue('to', '')
                    }}
                    error={errors.from?.message}
                    options={categories.map((c) => ({ value: c.value, label: c.value }))}
                  />
                )}
              />
            </div>

            {/* Subcategoria — opcional, com botão de limpar */}
            <div>
              <div className="h-6 flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium text-foreground/80">Subcategoria</span>
                {selectedSubcategory && (
                  <button
                    type="button"
                    onClick={() => setValue('to', '')}
                    aria-label="Limpar subcategoria"
                    className="flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3 h-3" aria-hidden="true" />
                    Limpar
                  </button>
                )}
              </div>
              <Controller
                name="to"
                control={control}
                render={({ field }) => (
                  <Combobox
                    id="transaction-subcategory"
                    placeholder="Selecione..."
                    searchPlaceholder="Buscar subcategoria..."
                    emptyText="Nenhuma subcategoria encontrada."
                    value={field.value || undefined}
                    onValueChange={field.onChange}
                    disabled={!selectedCategory || subcategories.length === 0}
                    options={subcategories.map((s) => ({ value: s, label: s }))}
                  />
                )}
              />
            </div>
          </div>

          {/* Imagem (anexo) */}
          <div>
            <span className={labelClass}>Imagem (opcional)</span>

            {previewSrc ? (
              <div className="relative rounded-lg overflow-hidden border border-border bg-muted/20">
                <img
                  src={previewSrc}
                  alt="Preview do anexo"
                  className="w-full max-h-48 object-contain"
                />
                <button
                  type="button"
                  onClick={removeFile}
                  aria-label="Remover imagem"
                  className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {fileInfo && fileInfo.size > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 bg-black/50 text-xs text-white/80 flex items-center justify-between">
                    <span className="truncate">{fileInfo.name}</span>
                    <span className="flex-shrink-0 ml-2">{formatFileSize(fileInfo.size)}</span>
                  </div>
                )}
              </div>
            ) : (
              <label
                htmlFor="transaction-file"
                className="flex items-center justify-center gap-2 h-10 px-3 rounded-md border border-dashed border-border text-sm text-muted-foreground cursor-pointer hover:border-ring hover:text-foreground transition-colors"
              >
                <Upload className="w-4 h-4" aria-hidden="true" />
                Selecionar imagem
                <span className="text-xs text-muted-foreground/60">(JPG, PNG, GIF, WebP)</span>
              </label>
            )}

            <input
              ref={fileInputRef}
              id="transaction-file"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              aria-label="Upload de imagem"
            />

            {!previewSrc && (
              <p className="text-xs text-muted-foreground/60 mt-1 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                Apenas imagens · máx. 5 MB
              </p>
            )}

            {fileError && (
              <p role="alert" className="text-xs text-destructive mt-1">{fileError}</p>
            )}
          </div>

          {serverError && (
            <p role="alert" className="text-xs text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-lg">
              {serverError}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-sm text-muted-foreground hover:bg-muted transition-colors font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              {isSubmitting ? 'Salvando...' : isEditing ? 'Salvar edição' : 'Confirmar'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  )
}
