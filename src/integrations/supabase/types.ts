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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
