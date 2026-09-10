export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      compras_analitico: {
        Row: {
          classe_cod: string | null
          classe_nome: string | null
          compra_id: string | null
          created_at: string
          data: string | null
          empresa_id: string
          fornecedor_cod: string | null
          fornecedor_nome: string | null
          id: number
          ncm: string | null
          nf_serie: string | null
          produto: string | null
          quantidade: number | null
          valor_total: number | null
          valor_unitario: number | null
        }
        Insert: {
          classe_cod?: string | null
          classe_nome?: string | null
          compra_id?: string | null
          created_at?: string
          data?: string | null
          empresa_id: string
          fornecedor_cod?: string | null
          fornecedor_nome?: string | null
          id?: never
          ncm?: string | null
          nf_serie?: string | null
          produto?: string | null
          quantidade?: number | null
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Update: {
          classe_cod?: string | null
          classe_nome?: string | null
          compra_id?: string | null
          created_at?: string
          data?: string | null
          empresa_id?: string
          fornecedor_cod?: string | null
          fornecedor_nome?: string | null
          id?: never
          ncm?: string | null
          nf_serie?: string | null
          produto?: string | null
          quantidade?: number | null
          valor_total?: number | null
          valor_unitario?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_analitico_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      compras_vendas_classe: {
        Row: {
          classe_cod: string | null
          classe_nome: string | null
          codigo_produto: string | null
          created_at: string
          data: string
          empresa_id: string
          id: number
          preco_medio_compra: number | null
          preco_medio_venda: number | null
          produto: string | null
          qtde_comprada: number | null
          qtde_vendida: number | null
          vlr_total_compras: number | null
          vlr_total_vendas: number | null
        }
        Insert: {
          classe_cod?: string | null
          classe_nome?: string | null
          codigo_produto?: string | null
          created_at?: string
          data: string
          empresa_id: string
          id?: never
          preco_medio_compra?: number | null
          preco_medio_venda?: number | null
          produto?: string | null
          qtde_comprada?: number | null
          qtde_vendida?: number | null
          vlr_total_compras?: number | null
          vlr_total_vendas?: number | null
        }
        Update: {
          classe_cod?: string | null
          classe_nome?: string | null
          codigo_produto?: string | null
          created_at?: string
          data?: string
          empresa_id?: string
          id?: never
          preco_medio_compra?: number | null
          preco_medio_venda?: number | null
          produto?: string | null
          qtde_comprada?: number | null
          qtde_vendida?: number | null
          vlr_total_compras?: number | null
          vlr_total_vendas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_vendas_classe_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      conferencia_caixa: {
        Row: {
          conta: string | null
          created_at: string
          data: string
          data_transacao: string | null
          descricao: string | null
          empresa_id: string
          forma_pagamento: string | null
          id: number
          saldo: number | null
          tipo_linha: string | null
          valor_pago: number | null
          valor_recebido: number | null
        }
        Insert: {
          conta?: string | null
          created_at?: string
          data: string
          data_transacao?: string | null
          descricao?: string | null
          empresa_id: string
          forma_pagamento?: string | null
          id?: never
          saldo?: number | null
          tipo_linha?: string | null
          valor_pago?: number | null
          valor_recebido?: number | null
        }
        Update: {
          conta?: string | null
          created_at?: string
          data?: string
          data_transacao?: string | null
          descricao?: string | null
          empresa_id?: string
          forma_pagamento?: string | null
          id?: never
          saldo?: number | null
          tipo_linha?: string | null
          valor_pago?: number | null
          valor_recebido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "conferencia_caixa_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_a_receber: {
        Row: {
          cod_cliente: string | null
          created_at: string
          data_referencia: string
          doc_cliente: string | null
          empresa_id: string
          id: number
          nome_cliente: string | null
          saldo_devedor: number | null
        }
        Insert: {
          cod_cliente?: string | null
          created_at?: string
          data_referencia: string
          doc_cliente?: string | null
          empresa_id: string
          id?: never
          nome_cliente?: string | null
          saldo_devedor?: number | null
        }
        Update: {
          cod_cliente?: string | null
          created_at?: string
          data_referencia?: string
          doc_cliente?: string | null
          empresa_id?: string
          id?: never
          nome_cliente?: string | null
          saldo_devedor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_a_receber_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      contas_financeiras: {
        Row: {
          apelido: string | null
          ativo: boolean
          created_at: string
          data_saldo_inicial: string | null
          empresa_id: string
          id: string
          is_default: boolean
          nome: string
          origem_dremov_id: string | null
          saldo_inicial: number
          tipo: string
          updated_at: string
        }
        Insert: {
          apelido?: string | null
          ativo?: boolean
          created_at?: string
          data_saldo_inicial?: string | null
          empresa_id: string
          id?: string
          is_default?: boolean
          nome: string
          origem_dremov_id?: string | null
          saldo_inicial?: number
          tipo: string
          updated_at?: string
        }
        Update: {
          apelido?: string | null
          ativo?: boolean
          created_at?: string
          data_saldo_inicial?: string | null
          empresa_id?: string
          id?: string
          is_default?: boolean
          nome?: string
          origem_dremov_id?: string | null
          saldo_inicial?: number
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      contas_recebidas: {
        Row: {
          cod_cliente: string | null
          conta: string | null
          created_at: string
          data: string
          data_lancamento: string | null
          data_liquidacao: string | null
          data_vencimento: string | null
          descontos: number | null
          empresa_id: string
          id: number
          juros: number | null
          nome_cliente: string | null
          nota_fiscal: string | null
          numero_venda: string | null
          valor_liquidado: number | null
          valor_original: number | null
        }
        Insert: {
          cod_cliente?: string | null
          conta?: string | null
          created_at?: string
          data: string
          data_lancamento?: string | null
          data_liquidacao?: string | null
          data_vencimento?: string | null
          descontos?: number | null
          empresa_id: string
          id?: never
          juros?: number | null
          nome_cliente?: string | null
          nota_fiscal?: string | null
          numero_venda?: string | null
          valor_liquidado?: number | null
          valor_original?: number | null
        }
        Update: {
          cod_cliente?: string | null
          conta?: string | null
          created_at?: string
          data?: string
          data_lancamento?: string | null
          data_liquidacao?: string | null
          data_vencimento?: string | null
          descontos?: number | null
          empresa_id?: string
          id?: never
          juros?: number | null
          nome_cliente?: string | null
          nota_fiscal?: string | null
          numero_venda?: string | null
          valor_liquidado?: number | null
          valor_original?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contas_recebidas_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      despesas_provisionadas: {
        Row: {
          codigo_id: string
          created_at: string
          data: string
          descricao: string | null
          empresa_id: string
          id: string
          status: string
          updated_at: string
          valor: number
        }
        Insert: {
          codigo_id: string
          created_at?: string
          data: string
          descricao?: string | null
          empresa_id: string
          id?: string
          status?: string
          updated_at?: string
          valor: number
        }
        Update: {
          codigo_id?: string
          created_at?: string
          data?: string
          descricao?: string | null
          empresa_id?: string
          id?: string
          status?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "despesas_provisionadas_codigo_id_fkey"
            columns: ["codigo_id"]
            isOneToOne: false
            referencedRelation: "plano_contas_financeiro"
            referencedColumns: ["id"]
          },
        ]
      }
      empresas: {
        Row: {
          cnpj: string | null
          created_at: string
          id: string
          nome: string
        }
        Insert: {
          cnpj?: string | null
          created_at?: string
          id?: string
          nome: string
        }
        Update: {
          cnpj?: string | null
          created_at?: string
          id?: string
          nome?: string
        }
        Relationships: []
      }
      estrutura_gerencial: {
        Row: {
          categoria: string | null
          created_at: string
          data: string
          empresa_id: string
          id: number
          info_adicional: string | null
          valor: number | null
        }
        Insert: {
          categoria?: string | null
          created_at?: string
          data: string
          empresa_id: string
          id?: never
          info_adicional?: string | null
          valor?: number | null
        }
        Update: {
          categoria?: string | null
          created_at?: string
          data?: string
          empresa_id?: string
          id?: never
          info_adicional?: string | null
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "estrutura_gerencial_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      lancamentos_financeiros: {
        Row: {
          codigo_id: string | null
          conta_id: string
          created_at: string
          data: string
          descricao: string | null
          descricao_normalizada: string | null
          empresa_id: string
          fitid: string | null
          hash_dedupe: string | null
          id: string
          origem: string
          origem_dremov_id: string | null
          origem_ref: string | null
          status: string
          tipo: string
          updated_at: string
          valor: number
        }
        Insert: {
          codigo_id?: string | null
          conta_id: string
          created_at?: string
          data: string
          descricao?: string | null
          descricao_normalizada?: string | null
          empresa_id: string
          fitid?: string | null
          hash_dedupe?: string | null
          id?: string
          origem?: string
          origem_dremov_id?: string | null
          origem_ref?: string | null
          status?: string
          tipo: string
          updated_at?: string
          valor: number
        }
        Update: {
          codigo_id?: string | null
          conta_id?: string
          created_at?: string
          data?: string
          descricao?: string | null
          descricao_normalizada?: string | null
          empresa_id?: string
          fitid?: string | null
          hash_dedupe?: string | null
          id?: string
          origem?: string
          origem_dremov_id?: string | null
          origem_ref?: string | null
          status?: string
          tipo?: string
          updated_at?: string
          valor?: number
        }
        Relationships: [
          {
            foreignKeyName: "lancamentos_financeiros_codigo_id_fkey"
            columns: ["codigo_id"]
            isOneToOne: false
            referencedRelation: "plano_contas_financeiro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lancamentos_financeiros_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      periodos_contabeis_financeiro: {
        Row: {
          ano: number
          ativo: boolean
          created_at: string
          empresa_id: string
          fechado_em: string | null
          fechado_por: string | null
          id: string
          mes: number
          status: string
          updated_at: string
        }
        Insert: {
          ano: number
          ativo?: boolean
          created_at?: string
          empresa_id: string
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          mes: number
          status?: string
          updated_at?: string
        }
        Update: {
          ano?: number
          ativo?: boolean
          created_at?: string
          empresa_id?: string
          fechado_em?: string | null
          fechado_por?: string | null
          id?: string
          mes?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      plano_contas_financeiro: {
        Row: {
          ativo: boolean
          codigo: string
          created_at: string
          empresa_id: string
          entra_no_dre: boolean
          id: string
          nome: string
          origem_dremov_id: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo: string
          created_at?: string
          empresa_id: string
          entra_no_dre?: boolean
          id?: string
          nome: string
          origem_dremov_id?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo?: string
          created_at?: string
          empresa_id?: string
          entra_no_dre?: boolean
          id?: string
          nome?: string
          origem_dremov_id?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      regras_classificacao_financeira: {
        Row: {
          ativo: boolean
          codigo_id: string
          conta_id: string | null
          created_at: string
          descricao: string
          empresa_id: string
          id: string
          origem_dremov_id: string | null
          prioridade: number
          tipo_transacao: string | null
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          codigo_id: string
          conta_id?: string | null
          created_at?: string
          descricao: string
          empresa_id: string
          id?: string
          origem_dremov_id?: string | null
          prioridade?: number
          tipo_transacao?: string | null
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          codigo_id?: string
          conta_id?: string | null
          created_at?: string
          descricao?: string
          empresa_id?: string
          id?: string
          origem_dremov_id?: string | null
          prioridade?: number
          tipo_transacao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "regras_classificacao_financeira_codigo_id_fkey"
            columns: ["codigo_id"]
            isOneToOne: false
            referencedRelation: "plano_contas_financeiro"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "regras_classificacao_financeira_conta_id_fkey"
            columns: ["conta_id"]
            isOneToOne: false
            referencedRelation: "contas_financeiras"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_a_prazo: {
        Row: {
          cod_cliente: string | null
          coi: string | null
          created_at: string
          data: string
          data_compra: string | null
          descontos: number | null
          empresa_id: string
          id: number
          nome_cliente: string | null
          tipo_venda: string | null
          valor_bruto: number | null
          valor_liquido: number | null
          venda_doc: string | null
        }
        Insert: {
          cod_cliente?: string | null
          coi?: string | null
          created_at?: string
          data: string
          data_compra?: string | null
          descontos?: number | null
          empresa_id: string
          id?: never
          nome_cliente?: string | null
          tipo_venda?: string | null
          valor_bruto?: number | null
          valor_liquido?: number | null
          venda_doc?: string | null
        }
        Update: {
          cod_cliente?: string | null
          coi?: string | null
          created_at?: string
          data?: string
          data_compra?: string | null
          descontos?: number | null
          empresa_id?: string
          id?: never
          nome_cliente?: string | null
          tipo_venda?: string | null
          valor_bruto?: number | null
          valor_liquido?: number | null
          venda_doc?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_a_prazo_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_por_forma_pagamento: {
        Row: {
          created_at: string
          data: string
          empresa_id: string
          forma_pagamento: string | null
          id: number
          valor_vendido: number | null
        }
        Insert: {
          created_at?: string
          data: string
          empresa_id: string
          forma_pagamento?: string | null
          id?: never
          valor_vendido?: number | null
        }
        Update: {
          created_at?: string
          data?: string
          empresa_id?: string
          forma_pagamento?: string | null
          id?: never
          valor_vendido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_por_forma_pagamento_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_por_pdv: {
        Row: {
          created_at: string
          data: string
          desconto_aplicado: number | null
          desconto_concedido: number | null
          empresa_id: string
          id: number
          pdv: number | null
          total_produtos: number | null
          total_venda: number | null
        }
        Insert: {
          created_at?: string
          data: string
          desconto_aplicado?: number | null
          desconto_concedido?: number | null
          empresa_id: string
          id?: never
          pdv?: number | null
          total_produtos?: number | null
          total_venda?: number | null
        }
        Update: {
          created_at?: string
          data?: string
          desconto_aplicado?: number | null
          desconto_concedido?: number | null
          empresa_id?: string
          id?: never
          pdv?: number | null
          total_produtos?: number | null
          total_venda?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_por_pdv_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas_por_produto: {
        Row: {
          codigo_produto: string | null
          created_at: string
          data: string
          empresa_id: string
          id: number
          produto: string | null
          total_vendido: number | null
        }
        Insert: {
          codigo_produto?: string | null
          created_at?: string
          data: string
          empresa_id: string
          id?: never
          produto?: string | null
          total_vendido?: number | null
        }
        Update: {
          codigo_produto?: string | null
          created_at?: string
          data?: string
          empresa_id?: string
          id?: never
          produto?: string | null
          total_vendido?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vendas_por_produto_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      vw_estoque_movimentacao: {
        Row: {
          classe_nome: string | null
          codigo_produto: string | null
          data: string | null
          empresa_id: string | null
          produto: string | null
          qtde_comprada: number | null
          qtde_vendida: number | null
          saldo_acumulado: number | null
          saldo_dia: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_vendas_classe_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_estoque_saldo_atual: {
        Row: {
          classe_nome: string | null
          codigo_produto: string | null
          empresa_id: string | null
          produto: string | null
          saldo_acumulado: number | null
          ultima_data: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compras_vendas_classe_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
