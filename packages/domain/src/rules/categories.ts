import type { TransactionType } from '../entities/transaction'

export interface CategoryOption {
  value: string
  subcategories: readonly string[]
}

/** Catálogo de categorias — conhecimento de negócio, fonte única para UI e validação. */
export const CREDIT_CATEGORIES: readonly CategoryOption[] = [
  { value: 'Trabalho', subcategories: ['Salário', 'Freelance', 'Bônus', 'Comissão', 'Hora extra', 'Adiantamento'] },
  { value: 'Investimentos', subcategories: ['Dividendos', 'Rendimentos', 'Venda de ativos', 'Juros', 'Fundos imobiliários'] },
  { value: 'Transferência recebida', subcategories: ['Pix recebido', 'TED/DOC recebido', 'Devolução', 'Reembolso'] },
  { value: 'Aluguel', subcategories: ['Aluguel residencial', 'Aluguel comercial', 'Temporada'] },
  { value: 'Outros', subcategories: ['Presente', 'Herança', 'Prêmio', 'Cashback', 'Outros'] },
]

export const DEBIT_CATEGORIES: readonly CategoryOption[] = [
  { value: 'Alimentação', subcategories: ['Restaurante', 'Supermercado', 'Delivery', 'Padaria', 'Lanche', 'Cafeteria', 'Feira'] },
  { value: 'Transporte', subcategories: ['Combustível', 'Uber/99', 'Transporte público', 'Estacionamento', 'Manutenção veículo', 'Pedágio'] },
  { value: 'Moradia', subcategories: ['Aluguel', 'Condomínio', 'Conta de luz', 'Conta de água', 'Internet', 'Gás', 'IPTU'] },
  { value: 'Saúde', subcategories: ['Farmácia', 'Consulta médica', 'Exame', 'Plano de saúde', 'Academia', 'Dentista', 'Psicólogo'] },
  { value: 'Lazer', subcategories: ['Cinema/Teatro', 'Streaming', 'Viagem', 'Esportes', 'Jogos', 'Eventos', 'Restaurante especial'] },
  { value: 'Educação', subcategories: ['Curso', 'Livros', 'Escola/Faculdade', 'Material escolar', 'Assinatura', 'Idiomas'] },
  { value: 'Vestuário', subcategories: ['Roupas', 'Calçados', 'Acessórios', 'Moda íntima'] },
  { value: 'Casa', subcategories: ['Móveis', 'Eletrodomésticos', 'Decoração', 'Reforma', 'Limpeza', 'Jardinagem'] },
  { value: 'Transferência enviada', subcategories: ['Pix enviado', 'TED/DOC enviado', 'Boleto', 'Empréstimo'] },
  { value: 'Outros', subcategories: ['Presente', 'Doação', 'Pet', 'Serviços domésticos', 'Assinatura', 'Outros'] },
]

export function getCategoriesByType(type: TransactionType): readonly CategoryOption[] {
  return type === 'Credit' ? CREDIT_CATEGORIES : DEBIT_CATEGORIES
}

export function getSubcategories(type: TransactionType, category: string): readonly string[] {
  return getCategoriesByType(type).find((c) => c.value === category)?.subcategories ?? []
}
